## 1. Core Tool Implementation

- [x] 1.1 Create `src/tools/set-context.js` with `handleSetContext(nodeRedClient)` that validates `scope`/`id`/`key` and calls `PUT /context/{scope}/:id` with body `{ "<key>": value }`
- [x] 1.2 Return `{ scope, id?, key, value, success: true }` on success
- [x] 1.3 Validate that `id` is provided when `scope` is `node` or `flow`

## 2. Server Registration

- [x] 2.1 Import `handleSetContext` in `src/server.js`
- [x] 2.2 Register the `set-context` tool with parameters: `scope` (required, enum), `id` (optional string), `key` (required string), `value` (required); description must note in-memory context is lost on restart

## 3. Tests

- [x] 3.1 Create `tests/tools/set-context.test.js`
- [x] 3.2 Add test: sets a global context key
- [x] 3.3 Add test: sets a flow context key
- [x] 3.4 Add test: sets a node context key
- [x] 3.5 Add test: returns error when `id` is missing for `node` scope
- [x] 3.6 Add test: returns error when `id` is missing for `flow` scope
