## 1. Core Tool Implementation

- [ ] 1.1 Create `src/tools/get-context.js` with `handleGetContext(nodeRedClient)` that validates `scope`/`id` and calls `GET /context/{scope}/:id?key=<key>` or `GET /context/global`
- [ ] 1.2 Return `{ scope, id?, key?, value }` for single-key queries and `{ scope, id?, values }` for all-keys queries
- [ ] 1.3 Validate that `id` is provided when `scope` is `node` or `flow`

## 2. Server Registration

- [ ] 2.1 Import `handleGetContext` in `src/server.js`
- [ ] 2.2 Register the `get-context` tool with parameters: `scope` (required, enum), `id` (optional string), `key` (optional string); description must note that in-memory context is lost on restart

## 3. Tests

- [ ] 3.1 Create `tests/tools/get-context.test.js`
- [ ] 3.2 Add test: reads a specific key from global context
- [ ] 3.3 Add test: reads all keys from flow context (no `key` param)
- [ ] 3.4 Add test: returns `{ value: null }` when key does not exist
- [ ] 3.5 Add test: returns error when `id` is missing for `node` scope
- [ ] 3.6 Add test: returns error when `id` is missing for `flow` scope
