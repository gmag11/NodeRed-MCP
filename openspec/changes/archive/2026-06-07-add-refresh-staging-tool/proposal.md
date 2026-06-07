## Why

The MCP server maintains a local in-memory staging copy of Node-RED flows. Edits made externally (via the Node-RED editor UI, another MCP client, or REST API calls) are invisible to the staging store until a deploy fails with a version mismatch (409). There is currently no way for an LLM agent to proactively discard stale staged edits and re-sync with the backend. This gap forces the agent to hit a deploy error before discovering external modifications, wasting tokens and confusing users.

## What Changes

- **New MCP tool `refresh-staging`**: Discards all un-deployed staged changes and re-fetches the latest flow state from the Node-RED Admin API (`GET /flows`). Returns the previous staging summary (what was discarded) and the new staging summary (confirming the sync). The tool requires no parameters.
- **Warning**: The tool explicitly warns that all un-deployed staged edits will be lost. This warning appears in the tool description and in the response payload (`previousPendingChanges` and `warning` fields).
- **No breaking changes**: This is a purely additive tool. Existing tools, staging logic, and deploy behavior are unchanged.

## Capabilities

### New Capabilities
- `tool-refresh-staging`: A new MCP tool that resets the staging store to match the current Node-RED backend state, discarding any local un-deployed changes.

### Modified Capabilities
<!-- None -->

## Impact

- **New file**: `src/tools/refresh-staging.js` — tool handler (~47 lines)
- **New file**: `tests/tools/refresh-staging.test.js` — unit tests (5 test cases, vitest)
- **Modified file**: `src/server.js` — register the new `refresh-staging` tool (~12 lines)
- **Affected system**: `src/staging-store.js` — already exposes `invalidate()` and `getStagingSummary()`; the tool is a thin wrapper requiring no changes to the staging store itself
- **No new dependencies**: Uses existing `StagingStore` API surface
- **No API changes**: No changes to Node-RED API calls, transport layer, or auth
