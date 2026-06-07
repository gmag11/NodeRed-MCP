## Context

The MCP server uses a `StagingStore` class (`src/staging-store.js`) that maintains an in-memory mutable copy of the Node-RED flows array. This staging model mirrors the Node-RED editor's workspace: all edits are local until an explicit `deploy()` call pushes them to the backend. The staging store lazy-loads flows via `GET /flows` on first access and tracks dirty nodes/flows for granular deploys.

Currently, if external modifications occur (e.g., a user edits a flow via the Node-RED editor UI), the staging store has no way to detect this until a deploy is attempted. At that point, Node-RED returns a 409 version mismatch, the deploy fails, and the staged changes are lost. There is no proactive mechanism to discard staged edits and re-sync.

The staging store already exposes `invalidate()` (clears cache and dirty tracking, forces re-fetch on next access) but this method is not exposed as an MCP tool. The `getStagingSummary()` method provides a snapshot of pending changes.

## Goals / Non-Goals

**Goals:**
- Expose a zero-parameter MCP tool `refresh-staging` that discards all un-deployed staged changes and re-fetches the latest flows from Node-RED
- Return clear information about what was discarded (`previousPendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`) and the post-sync state
- Include an explicit warning in both the tool description and response payload that staged edits will be lost
- Keep the implementation minimal — a thin wrapper around existing staging store methods

**Non-Goals:**
- Selective discard (keeping some edits, dropping others)
- Automatic detection of external changes (this remains a manual action by the LLM agent)
- Backup/restore of staged changes before discarding
- Changes to the deploy flow or version mismatch handling

## Decisions

### Decision 1: Use existing `invalidate()` + `ensureLoaded()` pattern

**Chosen**: The tool calls `staging.invalidate()` followed by `staging.ensureLoaded()`, captures before/after snapshots via `getStagingSummary()`.

**Rationale**: This is the exact pattern already used by `deploy()` after a successful POST. No new staging store methods are needed. The tool is a pure orchestration layer.

**Alternatives considered**:
- Adding a dedicated `staging.refresh()` method: Unnecessary abstraction; this tool is a one-liner composition of existing public methods.
- Re-implementing the GET /flows logic directly in the tool handler: Violates separation of concerns; the staging store is the single source of truth.

### Decision 2: Tool name `refresh-staging`

**Chosen**: `refresh-staging` is descriptive and follows the project's naming convention (verb-noun, e.g., `get-flows`, `export-subflow`, `inject-message`).

**Alternatives considered**:
- `sync-staging`: Less clear that it's discarding local edits, not merging.
- `reload-flows`: Could be confused with reloading the Node-RED runtime.
- `reset-staging`: Also viable but "refresh" better conveys "get the latest" rather than "factory reset".

### Decision 3: Snapshot staging state before invalidation

**Chosen**: Call `getStagingSummary()` BEFORE invalidating to capture what will be discarded, then call it again AFTER re-fetching to show the clean state.

**Rationale**: Provides the LLM agent with full transparency about what edits were lost, enabling better error recovery (e.g., "I see you had 3 pending node changes that were discarded — would you like me to re-apply them?").

## Risks / Trade-offs

- **[Risk] LLM agent accidentally discards important edits**: The tool description and response payload include explicit warnings. The LLM is instructed (via the tool description) that this is destructive. → Mitigation: The `warning` field in the response is prominent; the `previousPendingChanges` count is always included.
- **[Risk] Race condition between refresh and next edit**: Another client could modify Node-RED between the refresh and the next staged edit. → Mitigation: Same race condition exists today with any external edit. The version mismatch on deploy remains the safety net.
