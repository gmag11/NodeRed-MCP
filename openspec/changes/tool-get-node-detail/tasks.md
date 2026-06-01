## 1. Core Tool Implementation

- [ ] 1.1 Create `src/tools/get-node-detail.js` with a `transformNodeDetail(rawResponse, nodeId)` function that finds the node by ID and returns all its fields
- [ ] 1.2 Implement the `handleGetNodeDetail(nodeRedClient)` handler that calls `client.getFlows()` and delegates to `transformNodeDetail`
- [ ] 1.3 Return a structured error when the node is not found (`Node '<nodeId>' not found`)

## 2. Server Registration

- [ ] 2.1 Import `handleGetNodeDetail` in `src/server.js`
- [ ] 2.2 Register the `get-node-detail` tool in `createMcpServer()` with a `nodeId` (required string) parameter and a descriptive tool description

## 3. Tests

- [ ] 3.1 Create `tests/tools/get-node-detail.test.js` with unit tests for `transformNodeDetail`
- [ ] 3.2 Add test: returns full node detail including `func` for a function node
- [ ] 3.3 Add test: returns full node detail including `template` for a template node
- [ ] 3.4 Add test: returns full node detail for a standard node (all config fields present)
- [ ] 3.5 Add test: throws/rejects when `nodeId` is not found
