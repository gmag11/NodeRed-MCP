## Context

The Node-RED MCP server currently deploys to the Node-RED runtime on every write operation. Each tool call (create-node, connect-nodes, update-node, etc.) performs a full GET /flows → modify → POST /flows cycle, triggering a deploy that restarts affected flows. This mirrors a "save on every keystroke" model, while the Node-RED editor itself uses a "workspace + explicit deploy" model where edits accumulate locally and a single deploy pushes all changes.

The current architecture already separates pure mutation functions (`apply*`) from I/O orchestration (`handle*` + `withRetry`). This clean separation makes the migration straightforward — the `apply*` functions remain unchanged, and only the orchestration layer changes.

Two distinct write patterns currently exist:
- **Pattern A** (most tools): Bulk flows API via `withRetry` — `GET /flows` → `apply*()` → `POST /flows`
- **Pattern B** (create/update/delete-flow): Individual flow API — `POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`

Both patterns will be unified under the staging model.

## Goals / Non-Goals

**Goals:**
- Eliminate per-operation deploys — edits accumulate in an in-memory staging layer
- Provide explicit deploy control via a new `deploy` tool with three modes (full/flows/nodes)
- Track dirty state per-node and per-flow for granular deploys
- Give the LLM visibility into pending changes via staging summaries in responses and a `get-staging-status` tool
- Unify the two write patterns into a single staging-based model
- Maintain identical `apply*` function signatures — no changes to mutation logic
- Keep the same MCP tool names and parameter schemas (non-breaking for clients)

**Non-Goals:**
- Multi-user staging (one staging store per MCP server instance)
- Persistence across MCP restarts (staging is ephemeral, like the Node-RED editor)
- Automatic deploy (the LLM explicitly controls when to deploy)
- Three-way merge on 409 conflicts (fail-and-report strategy instead)
- Undo/rollback beyond what `previousState` in responses already provides

## Decisions

### Decision 1: Single in-memory StagingStore singleton

**Choice:** A single `StagingStore` class instance, created at server startup and shared across all tool handlers.

**Rationale:** The MCP server is single-process and handles one LLM session at a time. A singleton avoids complexity of per-session stores while matching the Node-RED editor's model (one workspace per browser tab). The store holds the entire flows array in memory — this is the same data that the current `withRetry` already loads on every operation.

**Alternatives considered:**
- *Per-flow staging*: Track changes per flow tab independently. Rejected because many operations (delete-subflow, import-flow) span multiple flows, and the Node-RED API requires sending the complete flows array on deploy.
- *Event-sourced mutation log*: Record each mutation as an event and replay on deploy. Rejected because the `apply*` functions already produce the final state directly, and event sourcing adds complexity for conflict resolution with no clear benefit.

### Decision 2: Lazy-load on first access

**Choice:** The staging store starts empty and loads from `GET /flows` on the first tool call that needs flows data (read or write).

**Rationale:** This avoids an HTTP call at MCP startup (the server might not be connected to Node-RED yet, or the LLM might only use palette/skill tools). After the first load, all subsequent reads and writes operate on the in-memory copy — zero HTTP until deploy.

### Decision 3: Dirty tracking with dual granularity

**Choice:** Track both `dirtyNodeIds: Set<string>` and `dirtyFlowIds: Set<string>`.

**Rationale:** Node-RED supports three deploy types via the `Node-RED-Deployment-Type` header:
- `full`: Restarts everything
- `flows`: Restarts only modified flow tabs
- `nodes`: Restarts only modified individual nodes

Tracking dirty at both levels lets us default to `nodes` deploy (least disruptive) while having the data for `flows` deploy when needed. The `dirtyFlowIds` set is derived from the `z` property of dirty nodes — when a node in flow X is modified, flow X is added to `dirtyFlowIds`.

New nodes, deleted nodes, and modified nodes all add their IDs to `dirtyNodeIds`. When a flow tab itself is created/modified/deleted, its ID is added to `dirtyFlowIds`.

### Decision 4: Staging summary in every write response

**Choice:** Every write tool appends a `staging` object to its response:
```json
{
  "staging": {
    "pendingChanges": 5,
    "dirtyNodeIds": ["abc-123", "def-456", ...],
    "dirtyFlowIds": ["flow-1"],
    "deployed": false
  }
}
```

**Rationale:** The LLM needs to know the staging state to decide when to deploy. Including it inline avoids an extra tool call. The `dirtyNodeIds` and `dirtyFlowIds` arrays give the LLM complete visibility — it can see exactly what's pending. This was chosen over a minimal counter because the LLM benefits from knowing *which* flows are dirty (e.g., "I modified 3 nodes in the MQTT flow, let me deploy before testing").

### Decision 5: Fail-and-report on 409 at deploy time

**Choice:** When `deploy` gets a 409 `version_mismatch`, throw an error with a clear message. Do not retry or merge.

**Rationale:** This matches the Node-RED editor behavior ("workspace out of date"). The LLM can then:
1. Call `invalidate()` (via a staging reset mechanism) to discard local changes
2. Re-read the current state from Node-RED
3. Re-apply its changes (it has the node IDs in context)

Automatic retry would be dangerous because the external changes might conflict semantically with the staged changes. Three-way merge is complex and error-prone for flow graphs. Letting the LLM decide is the safest approach.

### Decision 6: inject-message pre-deploy guard

**Choice:** `inject-message` checks `staging.hasPendingChanges()` before executing. If true, it returns an error: "Cannot inject: there are N undeployed changes. Call `deploy` first."

**Rationale:** Injecting a message into a node that hasn't been deployed yet will either fail or hit a stale version of the node. This guard prevents confusing errors and teaches the LLM the correct workflow: edit → deploy → test. This mirrors the Node-RED editor where you can't test undeployed changes.

`read-debug-messages` does NOT need a guard — it's valid to read the debug buffer at any time (it might contain messages from previous runs).

### Decision 7: Unify flow-level operations under staging

**Choice:** Refactor `create-flow`, `update-flow`, and `delete-flow` from the individual flow API (`POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`) to pure `apply*` functions that operate on the staging flows array.

**Rationale:** The individual flow API is a different deployment path that bypasses the staging model. Unifying all writes under `staging.applyMutation()` ensures consistent behavior and dirty tracking. The new `apply*` functions follow the same pattern as existing ones:
- `applyCreateFlow(rawResponse, label, disabled, info, env)` → `{ updatedFlows, currentState }`
- `applyUpdateFlow(rawResponse, flowId, updates)` → `{ updatedFlows, previousState, currentState }`
- `applyDeleteFlow(rawResponse, flowId)` → `{ updatedFlows, previousState }`

### Decision 8: Handler signature change

**Choice:** Tool handlers change from `handleX(client, params)` to `handleX(staging, client, params)` — staging is the first argument, client is kept for tools that still need direct API access (credentials, inject, etc.).

**Rationale:** Most handlers only need staging, but some (update-node for credential detection, inject-message, install-node) still need the HTTP client. Passing both keeps the interface uniform. The `server.js` registration passes the shared staging instance.

Alternative: Pass staging as part of a context object `{ staging, client }`. This is more extensible but adds a wrapper object for no immediate benefit.

### Decision 9: withRetry removal

**Choice:** Remove the `withRetry` function from `flow-utils.js` entirely.

**Rationale:** `withRetry` exists solely to handle 409 conflicts during per-operation deploys. With staging, there are no per-operation deploys, so there are no 409s during editing. The only 409 can occur at `deploy` time, which is handled by Decision 5 (fail-and-report). Keeping dead code invites confusion.

## Risks / Trade-offs

### Risk: Stale staging after external changes
**Risk:** If someone edits flows via the Node-RED editor while the MCP has a staged copy, the staging becomes stale. Deploy will fail with 409.
**Mitigation:** Fail-and-report strategy (Decision 5). The LLM invalidates staging and re-applies. The `get-staging-status` tool helps the LLM understand the current state.

### Risk: Memory usage for large flow instances
**Risk:** The staging store holds the entire flows array in memory.
**Mitigation:** This is the same data `withRetry` loads on every operation today. Typical Node-RED instances have flows measured in tens of KB to low single-digit MBs. Not a practical concern.

### Risk: LLM forgets to deploy
**Risk:** The LLM builds a complex flow but never calls `deploy`, leaving changes in staging that are never applied.
**Mitigation:** The staging summary in every write response reminds the LLM of pending changes. The `inject-message` guard prevents testing without deploying. Skills explicitly document the deploy step.

### Risk: install-node / uninstall-node interaction
**Risk:** Installing or uninstalling a node module changes the Node-RED palette but not the flows. The staging remains valid, but newly created nodes of installed types won't work until deployed, and nodes of uninstalled types may fail.
**Mitigation:** Document this behavior. Do not auto-invalidate staging on install/uninstall — the staged flows are still structurally valid. The LLM should deploy after making flow changes that use new node types.

### Trade-off: No partial deploy tracking
**Trade-off:** The staging tracks dirty nodes, but when `deploy` sends the flows, it sends the *entire* flows array. The `Node-RED-Deployment-Type: nodes` header tells Node-RED to only restart dirty nodes, but the payload is always complete.
**Acceptance:** This is how the Node-RED editor works too. The deploy type controls restart granularity, not payload size.
