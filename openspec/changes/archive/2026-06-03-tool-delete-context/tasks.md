## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/delete-context.js` with `handleDeleteContext(client, params)` that validates `scope`/`id`/`key` and calls `DELETE /context/{scope}/{id}/{key}`
- [x] 1.2 Return `{ scope, id?, key, deleted: true }` on success (204 No Content)
- [x] 1.3 Validate that `id` is provided when `scope` is `node` or `flow`

## 2. Server Registration

- [x] 2.1 Import `handleDeleteContext` in `src/server.js` (replacing `handleSetContext`)
- [x] 2.2 Register the `delete-context` tool with parameters: `scope` (required, enum), `id` (optional string), `key` (required string)
- [x] 2.3 Remove `set-context` tool registration from `src/server.js`
- [x] 2.4 Delete `src/tools/set-context.js` and `tests/tools/set-context.test.js`

## 3. Tests

- [x] 3.1 Create `tests/tools/delete-context.test.js`
- [x] 3.2 Add test: deletes a key from global context
- [x] 3.3 Add test: deletes a key from flow context (with id)
- [x] 3.4 Add test: deletes a key from node context (with id)
- [x] 3.5 Add test: returns error when `id` is missing for `node` scope
- [x] 3.6 Add test: returns error when `id` is missing for `flow` scope
