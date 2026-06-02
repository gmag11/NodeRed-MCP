## 1. Core Tool Implementation

- [ ] 1.1 Create `src/tools/export-flow-json.js` with `collectFlowNodes(allNodes, flowId)` that returns the tab node + all child nodes with `z === flowId`
- [ ] 1.2 Implement `collectReferencedConfigNodes(allNodes, flowNodes)` that scans all string properties of `flowNodes` looking for IDs that match config nodes (no `z` property)
- [ ] 1.3 Implement `collectSelectedNodes(allNodes, nodeIds)` that returns the nodes matching the given IDs
- [ ] 1.4 Implement `trimWires(nodes, allowedIds)` that removes wire targets not in `allowedIds`, leaving empty `[]` for ports with no remaining targets
- [ ] 1.5 Implement `handleExportFlowJson(nodeRedClient)` that dispatches to flow mode or nodes mode based on `exportMode`, and returns `{ exportMode, flowId?, label?, nodeCount, json }`

## 2. Server Registration

- [ ] 2.1 Import `handleExportFlowJson` in `src/server.js`
- [ ] 2.2 Register the `export-flow-json` tool with parameters: `exportMode` (optional string, enum `["flow","nodes"]`, default `"flow"`), `flowId` (optional string), `nodeIds` (optional array of strings); description must note the JSON can be passed to `import-flow`

## 3. Tests

- [ ] 3.1 Create `tests/tools/export-flow-json.test.js`
- [ ] 3.2 Add test: `collectFlowNodes` returns tab node + children for a known flowId
- [ ] 3.3 Add test: `collectReferencedConfigNodes` includes a config node referenced by a child node property
- [ ] 3.4 Add test: `collectReferencedConfigNodes` does not include config nodes not referenced by the exported flow
- [ ] 3.5 Add test: handler (flow mode) returns error when `flowId` is not found
- [ ] 3.6 Add test: handler (flow mode) with no `flowId` returns all nodes as JSON string
- [ ] 3.7 Add test: `collectSelectedNodes` returns only nodes whose IDs are in `nodeIds`
- [ ] 3.8 Add test: `trimWires` removes wire targets outside the selection, leaves `[]` for fully-trimmed ports
- [ ] 3.9 Add test: handler (nodes mode) returns error when `nodeIds` is empty or omitted
- [ ] 3.10 Add test: handler (nodes mode) returns trimmed node array with correct `nodeCount`
