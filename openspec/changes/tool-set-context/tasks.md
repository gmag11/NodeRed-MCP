## REVERSED — Tool removed (Node-RED Admin API does not support writing context)

All tasks below were initially completed but have been **undone** after confirming that the Node-RED
Admin API exposes no POST or PUT endpoint for context values (both return 404).

## 1. Core Tool Implementation (DELETED)

- [x] ~~1.1 Create `src/tools/set-context.js`~~ (file deleted)
- [x] ~~1.2 Return `{ scope, id?, key, value, success: true }` on success~~
- [x] ~~1.3 Validate that `id` is provided when `scope` is `node` or `flow`~~

## 2. Server Registration (UNDONE)

- [x] ~~2.1 Import `handleSetContext` in `src/server.js`~~ (import removed)
- [x] ~~2.2 Register the `set-context` tool~~ (registration removed)

## 3. Tests (DELETED)

- [x] ~~3.1 Create `tests/tools/set-context.test.js`~~ (file deleted)
- [x] ~~3.2–3.6 All tests~~ (deleted)

