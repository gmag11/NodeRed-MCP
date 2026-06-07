## Context

Node-RED's editor UI enforces a constraint: at least one flow tab must exist at all times. The "Delete" option is disabled when only one flow remains. The MCP `delete-flow` tool (`src/tools/delete-flow.js`) currently performs two checks before deleting: (1) flow exists, (2) flow is not locked. It does NOT check whether the target flow is the last remaining flow tab.

This means an MCP client can delete the sole remaining flow, leaving the Node-RED instance with zero flow tabs — an invalid state that the editor itself prevents.

## Goals / Non-Goals

**Goals:**
- Add a guard in `applyDeleteFlow` that counts flow tabs and refuses deletion if the target is the last one
- Return a clear, descriptive error message when the guard triggers
- Match Node-RED editor behavior: "Cannot delete the last flow"

**Non-Goals:**
- No changes to how non-last flows are deleted (existing behavior preserved)
- No changes to the deploy flow or staging store architecture
- No changes to other flow management tools (`create-flow`, `update-flow`)

## Decisions

### Decision 1: Add the guard in `applyDeleteFlow` (pure function layer)

**Choice**: Add the last-flow check inside `applyDeleteFlow`, before the existing "not found" and "locked" checks.

**Rationale**: `applyDeleteFlow` is the pure data-transformation function. Adding the guard here ensures it applies consistently regardless of the caller. It also keeps the logic testable without mocking HTTP or staging infrastructure.

**Alternatives considered**:
- *Add guard in `handleDeleteFlow` (handler layer)*: This would mix validation with orchestration. The pure function is the right place for business rules.
- *Add guard in the staging store*: Too low-level; the staging store shouldn't know about Node-RED domain rules.

### Decision 2: Error message format

**Choice**: Return `"Cannot delete the last flow — at least one flow tab must exist"`.

**Rationale**: Consistent with existing error patterns (e.g., `"Flow '<flowId>' not found"`). Descriptive enough for both LLM agents and human users.

### Decision 3: Count all tab nodes, not just unlocked ones

**Choice**: Count ALL nodes with `type === 'tab'` in the flows array, regardless of lock status.

**Rationale**: A locked flow still counts as an existing flow tab. If there's only one tab and it's locked, the user already gets the "locked" error — we don't need the last-flow guard. If there are multiple tabs and one is locked, the unlocked one can still be deleted.

## Risks / Trade-offs

- **[Low] Edge case: All remaining flows are locked**: If a user has one unlocked flow and one locked flow, they can delete the unlocked one (last-flow check passes because there are 2 tabs). After deletion, only the locked flow remains — which is valid. No risk.

- **[Low] Staging state vs deployed state**: The guard operates on the current staging state, which reflects the last known server state (or staged changes). If the staging state is stale, the count could be wrong. Mitigation: The staging store syncs with the server on each operation via `refresh-staging` if needed.
