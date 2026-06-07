## Why

Node-RED requires at least one flow tab to exist at all times. The editor UI prevents users from deleting the last remaining flow. However, the MCP `delete-flow` tool currently does not enforce this constraint, allowing deletion of the last flow tab via MCP — which leaves the Node-RED instance in an invalid state with zero flow tabs. This change aligns the MCP tool's behavior with the Node-RED editor's built-in guard.

## What Changes

- **`delete-flow` tool**: Add a guard that checks whether the flow being deleted is the last remaining flow tab before proceeding with deletion. If it is the last flow, return an error instead of deleting it.
- **Spec update**: Update the `tool-delete-flow` spec to include the new requirement and scenario for last-flow protection.

## Capabilities

### New Capabilities

<!-- No new capabilities introduced -->

### Modified Capabilities

- `tool-delete-flow`: Add a requirement that `delete-flow` SHALL refuse to delete the last remaining flow tab, returning an error `"Cannot delete the last flow — at least one flow tab must exist"`.

## Impact

- **Affected code**: `src/tools/delete-flow.js` (`applyDeleteFlow` function and handler)
- **Affected specs**: `openspec/specs/tool-delete-flow/spec.md`
- **Affected tests**: `tests/tools/` — new test cases for last-flow guard
- **No breaking changes**: Existing behavior for non-last flows is preserved. Only the edge case of deleting the sole remaining flow is affected.
