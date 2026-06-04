## 1. Core Tool Implementation

- [ ] 1.1 Create `src/tools/search-nodes.js` with `searchNodes(allNodes, { name, type, property, value, limit })` pure function that filters regular nodes (those with `z` property, excluding tabs and subflow definitions) and returns enriched results
- [ ] 1.2 Build a `flowIndex` map from the `allNodes` array: `flowId → { id, label }` for tabs, used to enrich each result with `flowLabel`
- [ ] 1.3 Implement filter logic: all provided filters are ANDed; name and type use substring case-insensitive match; property+value uses strict equality on the stringified property value; `pattern` is a regex tested against name (or property if specified); invalid regex returns a clear error
- [ ] 1.4 Implement `handleSearchNodes(nodeRedClient)` that fetches all flows, delegates to `searchNodes`, and returns `{ results, total, truncated }`

## 2. Server Registration

- [ ] 2.1 Import `handleSearchNodes` in `src/server.js`
- [ ] 2.2 Register the `search-nodes` tool with parameters: `name` (optional string), `type` (optional string), `property` (optional string), `value` (optional string), `pattern` (optional string, regex), `limit` (optional number, default 50); description must state at least one filter is required

## 3. Tests

- [ ] 3.1 Create `tests/tools/search-nodes.test.js`
- [ ] 3.2 Add test: `searchNodes` filters by name substring (case-insensitive)
- [ ] 3.3 Add test: `searchNodes` filters by exact type
- [ ] 3.4 Add test: `searchNodes` filters by type substring
- [ ] 3.5 Add test: `searchNodes` filters by property value
- [ ] 3.6 Add test: `searchNodes` matches by regex pattern on `name` (e.g., `^sensor_\\d+`)
- [ ] 3.7 Add test: `searchNodes` matches by regex pattern on a specified `property`
- [ ] 3.8 Add test: `searchNodes` returns error for invalid regex pattern
- [ ] 3.9 Add test: `searchNodes` ANDs multiple filters correctly (including pattern with other filters)
- [ ] 3.10 Add test: `searchNodes` excludes tab and subflow-definition nodes from results
- [ ] 3.11 Add test: `searchNodes` includes `flowLabel` from the flow index
- [ ] 3.12 Add test: `searchNodes` respects `limit` and sets `truncated: true` when results are cut
- [ ] 3.13 Add test: handler returns error when no filters are provided
