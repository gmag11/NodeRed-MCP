# Tasks: unify-pagination

## 1. Update the Zod input schema
- [x] In `src/server.js`, change `get-palette-nodes` input schema:
  - Replace `page` with `offset` (0-based, min 0, default 0)
  - Replace `pageSize` with `limit` (min 1, max 200, default 50)
  - Update parameter descriptions

## 2. Update the tool description
- [x] In `src/server.js`, update `get-palette-nodes` description text to use offset/limit terminology instead of page/pageSize

## 3. Update the handler
- [x] In `src/tools/get-palette-nodes.js`:
  - Rename `params.page` → `params.offset`, `params.pageSize` → `params.limit`
  - Change pagination math: `const start = offset; const end = offset + limit;`

## 4. Update tests
- [x] In `tests/tools/get-palette-nodes.test.js`:
  - Update all test cases to pass `offset`/`limit` instead of `page`/`pageSize`
  - Verify default values produce same results as before

## 5. Verify
- [x] Run `npm test` — all tests pass
- [x] Manual check: call `get-palette-nodes` with `offset=0, limit=10` and verify response
