## 1. Client: Add `putFlows` method

- [x] 1.1 Add a `putFlows(flowsPayload, deployType)` method to the object returned by `createNodeRedClient` in `src/nodered/client.js`. It SHALL call `this.request('PUT', '/flows', flowsPayload)` with an additional `Node-RED-Deployment-Type: <deployType>` header. Default `deployType` to `'flows'`.
- [x] 1.2 Update `doFetch` (or the `request` wrapper) to accept an optional `extraHeaders` object and merge it into the fetch headers.
- [x] 1.3 Add unit tests for `putFlows` in `tests/nodered/client.test.js`: verify the `Node-RED-Deployment-Type` header is sent correctly.

## 2. `update-node` Tool

- [x] 2.1 Create `src/tools/update-node.js` with `applyNodeUpdate(rawResponse, nodeId, properties)` that:
  - Throws if `properties` contains a `wires` key
  - Finds the node by `nodeId`; throws if not found
  - Finds the parent flow (tab/subflow matching node's `z`); throws `Flow '<flowId>' is locked` if `locked: true`
  - Returns `{ updatedFlows, previousState, currentState }` where `updatedFlows` is the full flows array with the node merged, and `previousState`/`currentState` are full node objects
- [x] 2.2 Implement `handleUpdateNode(client, params)`:
  - GET `/flows` to get `{ rev, flows }`
  - Call `applyNodeUpdate(rawResponse, params.nodeId, params.properties)`
  - Call `client.putFlows({ rev, flows: updatedFlows }, 'flows')`
  - Return `{ nodeId, previousState, currentState }` as MCP content
- [x] 2.3 Register `update-node` in `src/server.js` with schema: `nodeId` (string, required), `properties` (object, required)
- [x] 2.4 Write tests in `tests/tools/update-node.test.js`:
  - Updates a field and returns correct `previousState`/`currentState`
  - Errors if `wires` is in `properties`
  - Errors if `nodeId` not found
  - Errors if parent flow is locked
  - Preserves unmentioned fields (shallow merge)
  - Round-trips `rev` in the PUT body

## 3. `connect-nodes` Tool

- [x] 3.1 Create `src/tools/connect-nodes.js` with `applyConnect(rawResponse, fromNodeId, outputPort, toNodeId)` that:
  - Finds `fromNodeId`; throws if not found
  - Finds the parent flow of `fromNodeId`; throws `Flow '<flowId>' is locked` if `locked: true`
  - Finds `toNodeId`; throws if not found (validates target exists)
  - Ensures `node.wires` has enough port slots (pad with `[]` if needed)
  - Adds `toNodeId` to `node.wires[outputPort]` if not already present (idempotent)
  - Returns `{ updatedFlows, previousWires, currentWires }`
- [x] 3.2 Implement `handleConnectNodes(client, params)`:
  - GET `/flows`, call `applyConnect`, PUT flows, return result as MCP content
- [x] 3.3 Register `connect-nodes` in `src/server.js` with schema: `fromNodeId` (string, required), `outputPort` (number, optional, default 0), `toNodeId` (string, required)
- [x] 3.4 Write tests in `tests/tools/connect-nodes.test.js`:
  - Adds a wire and returns correct `previousWires`/`currentWires`
  - Is idempotent when wire already exists (no duplicate, no error)
  - Pads `wires` array when `outputPort` exceeds current length
  - Errors if `fromNodeId` not found
  - Errors if `toNodeId` not found
  - Errors if `fromNodeId`'s parent flow is locked

## 4. `disconnect-nodes` Tool

- [x] 4.1 Create `src/tools/disconnect-nodes.js` with `applyDisconnect(rawResponse, fromNodeId, outputPort, toNodeId)` that:
  - Finds `fromNodeId`; throws if not found
  - Finds the parent flow of `fromNodeId`; throws `Flow '<flowId>' is locked` if `locked: true`
  - Throws if the wire `fromNodeId[outputPort] → toNodeId` does not exist
  - Removes `toNodeId` from `node.wires[outputPort]`
  - Returns `{ updatedFlows, previousWires, currentWires }`
- [x] 4.2 Implement `handleDisconnectNodes(client, params)`:
  - GET `/flows`, call `applyDisconnect`, PUT flows, return result as MCP content
- [x] 4.3 Register `disconnect-nodes` in `src/server.js` with schema: `fromNodeId` (string, required), `outputPort` (number, optional, default 0), `toNodeId` (string, required)
- [x] 4.4 Write tests in `tests/tools/disconnect-nodes.test.js`:
  - Removes a wire and returns correct `previousWires`/`currentWires`
  - Errors if `fromNodeId` not found
  - Errors if wire does not exist
  - Errors if `fromNodeId`'s parent flow is locked
  - Leaves other ports untouched

## 5. Integration Verification

- [x] 5.1 Run the full test suite (`npm test`) and verify all new and existing tests pass
- [x] 5.2 Start the MCP server locally and verify `update-node`, `connect-nodes`, `disconnect-nodes` appear in the tool list
