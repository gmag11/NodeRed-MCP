## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/import-flow.js` with a `normalizeFlowJson(input)` function that accepts a JSON string (array or `{ nodes: [...] }` object) and returns a flat node array, throwing on invalid input
- [x] 1.2 Implement `regenerateIds(nodes)` that remaps all `id` and `z` fields to new UUIDs, preserving internal references (wire targets, `z` cross-references)
- [x] 1.3 Implement `mergeFlows(existing, imported, strategy)` that merges the imported nodes into the existing flows array according to the `conflictStrategy`
- [x] 1.4 Implement `applyTargetFlow(nodes, targetFlowId)` that discards tab nodes and remaps all remaining nodes' `z` to `targetFlowId`
- [x] 1.5 Implement `summarizeImport(importedNodes, conflicts, targetFlowId)` that returns `{ imported: { flows, nodes, configNodes }, conflicts, strategy, targetFlowId }`
- [x] 1.6 Implement `handleImportFlow(nodeRedClient)` handler that orchestrates: validate `targetFlowId` if provided (exists + not locked) → fetch existing flows → normalize → apply target flow or standard merge → apply conflict strategy → PUT /flows → return summary

## 2. Server Registration

- [x] 2.1 Import `handleImportFlow` in `src/server.js`
- [x] 2.2 Register the `import-flow` tool with parameters: `flowJson` (required string), `conflictStrategy` (optional string, enum `["regenerate","overwrite"]`, default `"regenerate"`), `targetFlowId` (optional string)
- [x] 2.3 Write a clear tool description mentioning that all flows are redeployed on import and explaining the `targetFlowId` option

## 3. Tests

- [x] 3.1 Create `tests/tools/import-flow.test.js`
- [x] 3.2 Add test: `normalizeFlowJson` accepts a JSON array string
- [x] 3.3 Add test: `normalizeFlowJson` accepts a JSON object string with `nodes` property
- [x] 3.4 Add test: `normalizeFlowJson` throws on invalid JSON
- [x] 3.5 Add test: `normalizeFlowJson` throws on empty array
- [x] 3.6 Add test: `regenerateIds` remaps all IDs and preserves `z` cross-references
- [x] 3.7 Add test: `regenerateIds` remaps wire targets to new IDs correctly
- [x] 3.8 Add test: `mergeFlows` with `regenerate` strategy produces no conflicts
- [x] 3.9 Add test: `mergeFlows` with `overwrite` strategy replaces existing nodes by ID
- [x] 3.10 Add test: `summarizeImport` counts tabs, regular nodes, and config nodes correctly
- [x] 3.11 Add test: `applyTargetFlow` discards tab nodes and remaps `z` to targetFlowId on all remaining nodes
- [x] 3.12 Add test: handler returns error when `targetFlowId` does not match any existing flow
- [x] 3.13 Add test: handler returns error when `targetFlowId` matches a locked flow
