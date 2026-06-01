## 1. `create-node` Tool

- [x] 1.1 Create `src/tools/create-node.js` with `buildNewNode(type, flowId, properties, x, y)` that:
  - Generates a UUID via `crypto.randomUUID()`
  - Strips `id`, `z`, and `wires` from `properties` if present
  - Returns a node object: `{ id, type, z: flowId, x, y, wires: [[]], ...properties }`
- [x] 1.2 Implement `applyCreateNode(rawResponse, type, flowId, properties, x, y)` that:
  - Verifies `flowId` exists as a tab or subflow in the flows (throws if not found)
  - Throws `Flow '<flowId>' is locked` if that tab has `locked: true`
  - Calls `buildNewNode(...)` to construct the node
  - Returns `{ updatedFlows, currentState }` where `updatedFlows` is the flows array with the new node appended
- [x] 1.3 Implement `handleCreateNode(client, params)`:
  - GET `/flows` to get `{ rev, flows }`
  - Call `applyCreateNode(rawResponse, params.type, params.flowId, params.properties ?? {}, params.x ?? 200, params.y ?? 200)`
  - Call `client.putFlows({ rev, flows: updatedFlows }, 'flows')`
  - Return `{ nodeId, currentState }` as MCP content
- [x] 1.4 Register `create-node` in `src/server.js` with schema: `type` (string, required), `flowId` (string, required), `properties` (object, optional), `x` (number, optional), `y` (number, optional)
- [x] 1.5 Write tests in `tests/tools/create-node.test.js`:
  - Creates a node with correct structural fields and merged properties
  - Generates a unique UUID for `id`
  - Strips `id`, `z`, `wires` if accidentally passed in `properties`
  - Defaults `x`/`y` to 200 when omitted
  - Errors if `flowId` not found
  - Errors if target flow is locked
  - Round-trips `rev` in the PUT body

## 2. `delete-node` Tool

- [x] 2.1 Create `src/tools/delete-node.js` with `applyDeleteNode(rawResponse, nodeId)` that:
  - Finds the node by `nodeId`; throws if not found
  - Finds the parent flow (tab/subflow matching node's `z`); throws `Flow '<flowId>' is locked` if `locked: true`
  - Returns `{ updatedFlows, previousState }` where `updatedFlows` has the node removed
- [x] 2.2 Implement `handleDeleteNode(client, params)`:
  - GET `/flows` to get `{ rev, flows }`
  - Call `applyDeleteNode(rawResponse, params.nodeId)`
  - Call `client.putFlows({ rev, flows: updatedFlows }, 'flows')`
  - Return `{ nodeId, previousState }` as MCP content
- [x] 2.3 Register `delete-node` in `src/server.js` with schema: `nodeId` (string, required)
- [x] 2.4 Write tests in `tests/tools/delete-node.test.js`:
  - Removes the correct node and returns its `previousState`
  - Does not modify any other nodes
  - Errors if `nodeId` not found
  - Errors if node's parent flow is locked
  - Round-trips `rev` in the PUT body

## 3. Integration Verification

- [x] 3.1 Run the full test suite (`npm test`) and verify all new and existing tests pass
- [ ] 3.2 Start the MCP server locally and verify `create-node` and `delete-node` appear in the tool list
- [ ] 3.3 Manually test end-to-end: use `get-palette-nodes` to find a type → `create-node` → `connect-nodes` → verify in Node-RED UI
