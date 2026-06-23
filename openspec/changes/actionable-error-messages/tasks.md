## 1. Audit current error messages

- [ ] 1.1 Run `grep -rn "throw new Error" src/tools/ src/staging-store.js src/nodered/` to catalog all error sites
- [ ] 1.2 Classify each error by category: not-found, validation, state, auth, network
- [ ] 1.3 Map each error category to the appropriate suggestion tool(s) per the design doc

## 2. Enrich error messages in staging-store.js

- [ ] 2.1 Enrich flow/node not found errors with `get-flows` / `get-flow-nodes` / `search-nodes` suggestions
- [ ] 2.2 Enrich flow locked errors with explanation and read-only alternative
- [ ] 2.3 Enrich version mismatch errors with `refresh-staging` → re-apply → `deploy` sequence

## 3. Enrich error messages in tool handlers — not-found category

- [ ] 3.1 `connect-nodes.js`: node not found, target not found, parent flow lock
- [ ] 3.2 `disconnect-nodes.js`: node not found, parent flow lock
- [ ] 3.3 `create-node.js`: flow not found, flow lock
- [ ] 3.4 `delete-node.js`: node not found, flow lock
- [ ] 3.5 `update-node.js`: node not found, flow lock
- [ ] 3.6 `inject-message.js`: inject node not found, ambiguous name
- [ ] 3.7 `get-node-detail.js`: node not found
- [ ] 3.8 `get-flow-nodes.js`: flow not found
- [ ] 3.9 Remaining tool files with not-found errors

## 4. Enrich error messages in tool handlers — validation category

- [ ] 4.1 `deploy.js`: invalid deploy type → list valid types
- [ ] 4.2 `read-debug-messages.js`: mutually exclusive `last`/`limit` → explain when to use each
- [ ] 4.3 `create-subflow-instance.js`: invalid subflow/flow reference
- [ ] 4.4 `import-flow.js`: invalid JSON format
- [ ] 4.5 Remaining tool files with validation errors

## 5. Enrich error messages in tool handlers — state category

- [ ] 5.1 `inject-message.js`: staging dirty → suggest `deploy` first
- [ ] 5.2 `deploy.js`: version mismatch → suggest `refresh-staging` + re-apply
- [ ] 5.3 Any tool with lock/precondition checks

## 6. Enrich error messages in nodered/ client

- [ ] 6.1 `client.js`: API errors (non-2xx responses) — suggest checking connectivity, auth, or trying `refresh-staging`
- [ ] 6.2 `comms-client.js`: WebSocket errors — suggest checking Node-RED URL and auth

## 7. Validation

- [ ] 7.1 Run `npm test` and fix any tests that assert on exact error message strings
- [ ] 7.2 Manual verification: trigger 5 common errors and confirm suggestions are present and correct
- [ ] 7.3 Run `grep -rn "throw new Error" src/` and verify no error message is a single sentence without a suggestion
