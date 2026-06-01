## 1. get-palette-nodes Tool Implementation

- [ ] 1.1 Create `src/tools/get-palette-nodes.js` with a `transformPaletteNodes(rawResponse)` function that flattens the module/set/types hierarchy into a sorted array of `{ type, module, version, category, enabled }` objects
- [ ] 1.2 Implement `paginateNodes(nodes, page, pageSize)` that applies pagination and returns `{ page, pageSize, totalTypes, totalPages, nodes }`
- [ ] 1.3 Implement the `handleGetPaletteNodes(client, params)` handler that calls `GET /nodes`, transforms, paginates, and returns the result; clamp `pageSize` to max 200 and default `page` to 1

## 2. get-node-type-detail Tool Implementation

- [ ] 2.1 Create `src/tools/get-node-type-detail.js` with a `findNodeType(rawResponse, typeName)` function that searches all module sets for the given type name and returns `{ type, module, version, category, description, enabled, parameters }`
- [ ] 2.2 Extract `parameters` from the node set's config schema as `[{ name, type, default }]`, defaulting to `[]` if no schema is present
- [ ] 2.3 Implement `handleGetNodeTypeDetail(client, params)` handler that calls `GET /nodes`, delegates to `findNodeType`, and returns a structured error if the type is not found

## 3. Server Registration

- [ ] 3.1 Import `handleGetPaletteNodes` in `src/server.js` and register the `get-palette-nodes` tool with optional integer parameters `page` (default 1) and `pageSize` (default 50)
- [ ] 3.2 Import `handleGetNodeTypeDetail` in `src/server.js` and register the `get-node-type-detail` tool with a required `type` string parameter

## 4. Spec Archive Updates

- [ ] 4.1 Update `openspec/specs/mcp-server-core/spec.md` to add `get-palette-nodes` and `get-node-type-detail` to the registered tools list in the MCP tool registration requirement

## 5. Tests

- [ ] 5.1 Create `tests/tools/get-palette-nodes.test.js` with unit tests for `transformPaletteNodes` and `paginateNodes`
- [ ] 5.2 Add test: flattens module/set/types into per-type entries sorted alphabetically
- [ ] 5.3 Add test: pagination returns correct slice, `totalTypes`, and `totalPages`
- [ ] 5.4 Add test: `pageSize` is clamped to 200 when exceeded
- [ ] 5.5 Add test: out-of-range `page` returns empty `nodes` with correct totals
- [ ] 5.6 Add test: disabled node types are included with `enabled: false`
- [ ] 5.7 Create `tests/tools/get-node-type-detail.test.js` with unit tests for `findNodeType`
- [ ] 5.8 Add test: returns correct detail for a known type name
- [ ] 5.9 Add test: returns empty `parameters` when no config schema is present
- [ ] 5.10 Add test: throws/rejects when type name is not found
- [ ] 5.11 Add test: `module` field is included in the response
