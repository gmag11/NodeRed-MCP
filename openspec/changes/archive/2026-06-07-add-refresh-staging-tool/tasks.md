## 1. Create the tool handler

- [x] 1.1 Create `src/tools/refresh-staging.js` with `handleRefreshStaging(staging)` function that:
  - Captures `previousSummary` via `staging.getStagingSummary()` before invalidation
  - Calls `staging.invalidate()` to clear cache and dirty tracking
  - Calls `staging.ensureLoaded()` to re-fetch latest flows from Node-RED
  - Captures `newSummary` via `staging.getStagingSummary()` after re-fetch
  - Returns a response JSON with `{ success: true, warning, previousPendingChanges, previousDirtyNodeIds, previousDirtyFlowIds, staging }`

## 2. Register the tool in the MCP server

- [x] 2.1 Import `handleRefreshStaging` in `src/server.js`
- [x] 2.2 Register tool `refresh-staging` using `server.tool()` with:
  - Name: `refresh-staging`
  - Description explaining that it discards ALL un-deployed staged changes and re-fetches from Node-RED; includes explicit warning that staged edits will be lost
  - No parameters (`{}`)
  - Handler: `async () => handleRefreshStaging(staging)`

## 3. Unit tests

- [x] 3.1 Create `tests/tools/refresh-staging.test.js` with vitest tests covering:
  - Discards pending changes and reports previous state correctly
  - Succeeds with no pending changes (still returns warning)
  - Calls `invalidate()` before `ensureLoaded()` (ordering verified via mock call order)
  - Calls `getStagingSummary()` twice (before and after)
  - Propagates errors from `ensureLoaded()` (e.g., connection refused)
- [x] 3.2 Run tests and verify all pass

## 4. Manual verification

- [x] 4.1 Manually test: invoke `refresh-staging` with no pending changes → verify `previousPendingChanges: 0`, clean staging state
- [x] 4.2 Manually test: create a node (staged), invoke `refresh-staging` → verify the staged node is discarded, `previousPendingChanges` reflects the discarded count
- [x] 4.3 Manually test: make external edits in Node-RED editor UI, invoke `refresh-staging` → verify staging reflects the external edits
- [x] 4.4 Verify `get-staging-status` after refresh shows `deployed: true` with no dirty nodes
