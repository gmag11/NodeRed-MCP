## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/get-context.js` with `handleGetContext(nodeRedClient)` that validates `scope`/`id` and calls `GET /context/{scope}/:id?key=<key>` or `GET /context/global`
- [x] 1.2 Return `{ name, value }` for single-key queries and `[{ name, value }, ...]` for all-keys queries (scope/id not included in output)
- [x] 1.3 Validate that `id` is provided when `scope` is `node` or `flow`

## 2. Server Registration

- [x] 2.1 Import `handleGetContext` in `src/server.js`
- [x] 2.2 Register the `get-context` tool with parameters: `scope` (required, enum), `id` (optional string), `key` (optional string); description must note that in-memory context is lost on restart

## 3. Tests

- [x] 3.1 Create `tests/tools/get-context.test.js`
- [x] 3.2 Add test: reads a specific key from global context
- [x] 3.3 Add test: reads all keys from flow context (no `key` param)
- [x] 3.4 Add test: returns `{ value: null }` when key does not exist
- [x] 3.5 Add test: returns error when `id` is missing for `node` scope
- [x] 3.6 Add test: returns error when `id` is missing for `flow` scope
