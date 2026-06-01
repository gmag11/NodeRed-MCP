## 1. get-palette-nodes Tool Implementation

- [x] 1.1 Create `src/tools/get-palette-nodes.js` with `paginateNodes(nodes, page, pageSize)` that paginates the raw node set array and returns `{ page, pageSize, total, totalPages, nodes }`
- [x] 1.2 Implement the `handleGetPaletteNodes(client, params)` handler that calls `GET /nodes`, paginates, and returns the result; clamp `pageSize` to max 200 and default `page` to 1

## 2. get-node-type-detail Tool Implementation

- [x] 2.1 Create `src/tools/get-node-type-detail.js` with a `findNodeType(rawResponse, typeName)` function that searches all node sets for the given type name and returns the matching raw node set object
- [x] 2.2 Implement `handleGetNodeTypeDetail(client, params)` handler that calls `GET /nodes`, delegates to `findNodeType`, and returns a structured error if the type is not found
- [x] 2.3 Add `extractHelpHtml(html, typeName)` function that extracts the `<script type="text/html" data-help-name="<typeName>">` block content from the full HTML, returning `null` if not found
- [x] 2.4 Update `handleGetNodeTypeDetail` to also call `GET /nodes` with `Accept: text/html`, extract the help block, and merge it as a `help` field onto the node set object
- [x] 2.5 Convert the extracted help HTML to Markdown using `turndown` before returning it in the `help` field

## 3. HTTP Client Extension

- [x] 3.1 Add `requestText(method, path)` method to `src/nodered/client.js` that makes a request without forcing `Accept: application/json` and returns the raw response body as a string

## 4. Server Registration

- [x] 4.1 Import `handleGetPaletteNodes` in `src/server.js` and register the `get-palette-nodes` tool with optional integer parameters `page` (default 1) and `pageSize` (default 50)
- [x] 4.2 Import `handleGetNodeTypeDetail` in `src/server.js` and register the `get-node-type-detail` tool with a required `type` string parameter

## 5. Spec Archive Updates

- [x] 5.1 Update `openspec/specs/mcp-server-core/spec.md` to add `get-palette-nodes` and `get-node-type-detail` to the registered tools list in the MCP tool registration requirement

## 6. Tests

- [x] 6.1 Create `tests/tools/get-palette-nodes.test.js` with unit tests for `paginateNodes`
- [x] 6.2 Add test: pagination returns correct slice, `total`, and `totalPages`
- [x] 6.3 Add test: `pageSize` is clamped to 200 when exceeded
- [x] 6.4 Add test: out-of-range `page` returns empty `nodes` with correct totals
- [x] 6.5 Add test: disabled node sets are included in results
- [x] 6.6 Create `tests/tools/get-node-type-detail.test.js` with unit tests for `findNodeType`
- [x] 6.7 Add test: returns raw node set for a known type name
- [x] 6.8 Add test: throws when type name is not found
- [x] 6.9 Add test: `module` field is included in the response
- [x] 6.10 Add `extractHelpHtml` unit tests: returns inner content when block exists
- [x] 6.11 Add `extractHelpHtml` unit test: returns `null` when block is absent
- [x] 6.12 Add integration test for `handleGetNodeTypeDetail`: `help` field is merged into response
- [x] 6.13 Add `requestText` unit test to `tests/nodered/client.test.js`

- [x] 5.10 Add test: throws/rejects when type name is not found
- [x] 5.11 Add test: `module` field is included in the response
