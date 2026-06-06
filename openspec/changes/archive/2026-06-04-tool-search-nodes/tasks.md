## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/search-nodes.js` with `searchNodes(allNodes, { query, regex, flowId, limit })` pure function that filters regular nodes (those with `z` property, excluding tabs and subflow definitions), optionally scoped to `flowId`, and returns enriched results
- [x] 1.2 Build a `flowIndex` map from the `allNodes` array: `flowId → { id, label }` for tabs, used to enrich each result with `flowLabel`
- [x] 1.3 Implement deep search: `JSON.stringify(node)` each regular node; in plain text mode (`regex: false`, default), lowercase both the serialized node and query for case-insensitive substring match; in regex mode (`regex: true`), compile `new RegExp(query)` and test against the serialized string; invalid regex returns a clear error
- [x] 1.4 Implement `handleSearchNodes(nodeRedClient)` that fetches all flows, validates `query` is non-empty (return error if missing/empty), validates `flowId` exists if provided, delegates to `searchNodes`, and returns `{ results, total, truncated }`

## 2. Server Registration

- [x] 2.1 Import `handleSearchNodes` in `src/server.js`
- [x] 2.2 Register the `search-nodes` tool with parameters: `query` (required string, the search term), `regex` (optional boolean, default false), `flowId` (optional string, limits search to a specific flow), `limit` (optional number, default 50)

## 3. Tests

- [x] 3.1 Create `tests/tools/search-nodes.test.js`
- [x] 3.2 Add test: `searchNodes` finds node by name substring (case-insensitive, plain text mode)
- [x] 3.3 Add test: `searchNodes` finds node by content in a deep field (e.g., `func` body contains the query)
- [x] 3.4 Add test: `searchNodes` finds node by a property value (e.g., `topic` contains the query)
- [x] 3.5 Add test: `searchNodes` matches by regex pattern across all fields
- [x] 3.6 Add test: `searchNodes` returns error for invalid regex pattern
- [x] 3.7 Add test: `searchNodes` excludes tab and subflow-definition nodes from results
- [x] 3.8 Add test: `searchNodes` includes `flowLabel` from the flow index
- [x] 3.9 Add test: `searchNodes` respects `limit` and sets `truncated: true` when results are cut
- [x] 3.10 Add test: handler returns error when `query` is empty or missing
- [x] 3.11 Add test: `searchNodes` returns empty results when no match is found
- [x] 3.12 Add test: `searchNodes` scoped to a `flowId` only returns nodes from that flow
- [x] 3.13 Add test: handler returns error when `flowId` is provided but does not exist
