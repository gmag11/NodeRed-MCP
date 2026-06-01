## 1. `create-flow` Tool

- [x] 1.1 Create `src/tools/create-flow.js` with `buildCreateFlowPayload(label, disabled, info, env)` that assembles the POST body: `{ label, disabled: disabled ?? false, info: info ?? '', env: env ?? [] }`
- [x] 1.2 Implement `handleCreateFlow(client, params)` that calls `client.request('POST', '/flow', payload)` and returns `{ flowId: result.id, currentState: result }` as MCP content
- [x] 1.3 Register `create-flow` in `src/server.js` with schema: `label` (string, required), `disabled` (boolean, optional), `info` (string, optional), `env` (array of `{ name, value, type }`, optional)
- [x] 1.4 Write tests in `tests/tools/create-flow.test.js`:
  - Builds correct payload with all fields
  - Defaults `disabled` to false when omitted
  - Defaults `info` and `env` to empty when omitted
  - Returns `flowId` and `currentState` from API response

## 2. `delete-flow` Tool

- [x] 2.1 Create `src/tools/delete-flow.js` with `handleDeleteFlow(client, params)` that:
  - Calls `client.request('GET', '/flow/:id')` substituting `params.flowId`; throws formatted error if 404
  - Throws `Flow '<flowId>' is locked` if the fetched flow has `locked: true`
  - Calls `client.request('DELETE', '/flow/:id')`
  - Returns `{ flowId, previousState }` as MCP content
- [x] 2.2 Register `delete-flow` in `src/server.js` with schema: `flowId` (string, required)
- [x] 2.3 Write tests in `tests/tools/delete-flow.test.js`:
  - Fetches and returns `previousState` before deleting
  - `previousState.nodes` contains all nodes from the GET response
  - Errors with `Flow '<flowId>' not found` when GET returns 404
  - Errors with `Flow '<flowId>' is locked` when flow has `locked: true`
  - DELETE is called after GET succeeds (and flow is not locked)

## 3. `update-flow` Tool

- [x] 3.1 Create `src/tools/update-flow.js` with `applyFlowUpdate(currentFlow, updates)` that:
  - Throws if `updates` is empty (`No properties to update`)
  - Throws `Flow '<flowId>' is locked` if `currentFlow.locked` is `true`
  - Shallow-merges `updates` over the tab-level metadata fields (`label`, `disabled`, `info`, `env`) only
  - Preserves `currentFlow.nodes` untouched in the returned object
  - Returns `{ updatedFlow, previousState }` where `previousState` is the original `currentFlow`
- [x] 3.2 Implement `handleUpdateFlow(client, params)` that:
  - Calls `client.request('GET', '/flow/' + params.flowId)`; throws formatted error if 404
  - Calls `applyFlowUpdate(currentFlow, params.updates)`
  - Calls `client.request('PUT', '/flow/' + params.flowId, updatedFlow)`
  - Returns `{ flowId, previousState, currentState: result }` as MCP content
- [x] 3.3 Register `update-flow` in `src/server.js` with schema: `flowId` (string, required), `updates` (object with optional fields: `label` string, `disabled` boolean, `info` string, `env` array)
- [x] 3.4 Write tests in `tests/tools/update-flow.test.js`:
  - Renames a flow (only `label` changes)
  - Enables/disables a flow (only `disabled` changes)
  - Updates `info` field
  - Replaces `env` array
  - Preserves `nodes` array unchanged after update
  - Errors when `updates` is empty
  - Errors with `Flow '<flowId>' not found` when GET returns 404
  - Errors with `Flow '<flowId>' is locked` when flow has `locked: true`
  - Returns correct `previousState` and `currentState`

## 4. Integration Verification

- [x] 4.1 Run the full test suite (`npm test`) and verify all new and existing tests pass
- [x] 4.2 Start the MCP server locally and verify `create-flow`, `delete-flow`, `update-flow` appear in the tool list
- [x] 4.3 Manually test: `get-flows` → note a flow ID → `update-flow` to rename it → verify in Node-RED UI
