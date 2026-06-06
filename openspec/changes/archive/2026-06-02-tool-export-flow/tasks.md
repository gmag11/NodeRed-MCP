## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/export-flow.js` with `collectFlowNodes(allNodes, flowId)` that returns the tab node + all child nodes with `z === flowId`
- [x] 1.2 Implement `collectReferencedConfigNodes(allNodes, flowNodes)` that scans all string properties of `flowNodes` looking for IDs that match config nodes (no `z` property)
- [x] 1.3 Implement `collectSelectedNodes(allNodes, nodeIds)` that returns the nodes matching the given IDs
- [x] 1.4 Implement `trimWires(nodes, allowedIds)` that removes wire targets not in `allowedIds`, leaving empty `[]` for ports with no remaining targets
- [x] 1.5 Implement `handleExportFlowJson(nodeRedClient)` that dispatches to flow mode or nodes mode based on `exportMode`, and returns `{ exportMode, flowId?, label?, nodeCount, json }`

## 2. Server Registration

- [x] 2.1 Import `handleExportFlowJson` in `src/server.js`
- [x] 2.2 Register the `export-flow` tool with parameters: `exportMode` (optional string, enum `["flow","nodes"]`, default `"flow"`), `flowId` (optional string), `nodeIds` (optional array of strings); description must note the JSON can be passed to `import-flow`

## 3. Tests

- [x] 3.1 Create `tests/tools/export-flow.test.js`
- [x] 3.2 Add test: `collectFlowNodes` returns tab node + children for a known flowId
- [x] 3.3 Add test: `collectReferencedConfigNodes` includes a config node referenced by a child node property
- [x] 3.4 Add test: `collectReferencedConfigNodes` does not include config nodes not referenced by the exported flow
- [x] 3.5 Add test: handler (flow mode) returns error when `flowId` is not found
- [x] 3.6 Add test: handler (flow mode) with no `flowId` returns all nodes as JSON string
- [x] 3.7 Add test: `collectSelectedNodes` returns only nodes whose IDs are in `nodeIds`
- [x] 3.8 Add test: `trimWires` removes wire targets outside the selection, leaves `[]` for fully-trimmed ports
- [x] 3.9 Add test: handler (nodes mode) returns error when `nodeIds` is empty or omitted
- [x] 3.10 Add test: handler (nodes mode) returns trimmed node array with correct `nodeCount`
