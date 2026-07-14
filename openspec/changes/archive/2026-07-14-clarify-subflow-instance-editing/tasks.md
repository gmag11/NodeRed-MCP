## 1. Update tool descriptions in server.js

- [x] 1.1 Update `update-node` description to mention subflow instance support: "Works on any node type including subflow instances (type: 'subflow:...')"
- [x] 1.2 Update `update-subflow` description to clarify it only edits definitions and redirect to `update-node` for instances
- [x] 1.3 Update `create-subflow-instance` description to mention instances can be edited with `update-node`

## 2. Update JSDoc in tool source files

- [x] 2.1 Update JSDoc in `src/tools/update-node.js` to document subflow instance support
- [x] 2.2 Update JSDoc in `src/tools/update-subflow.js` to clarify definition-only scope and redirect to `update-node`

## 3. Add type-mismatch detection in update-subflow

- [x] 3.1 In `src/tools/update-subflow.js` handler, scan the flows array before the existing `findIndex` to detect if `subflowId` matches a node with `type` starting with `"subflow:"` (a subflow instance)
- [x] 3.2 If detected, throw a specific error: `Node '<subflowId>' is a subflow instance (type: 'subflow:...'), not a subflow definition. Use update-node to edit subflow instances.`

## 4. Update tests

- [x] 4.1 Check `tests/tools/update-node.test.js` for description-string assertions and update if needed — none found
- [x] 4.2 Check `tests/tools/update-subflow.test.js` for description-string assertions and update if needed — none found
- [x] 4.3 Add a test case for the new type-mismatch error in `update-subflow`

## 5. Verify and deploy

- [x] 5.1 Run full test suite: 688 tests pass, 0 failures
- [x] 5.2 Redeploy MCP server — done (Docker rebuild sin cache + restart)
- [x] 5.3 Verify with a small-model agent that it correctly routes subflow instance edits to `update-node` — verified: `update-subflow` on instance gives clear redirect error, `update-node` on instance works
