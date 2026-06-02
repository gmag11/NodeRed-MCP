## 1. Core Tool Implementation

- [ ] 1.1 Create `src/tools/inject-message.js` with `resolveInjectNode(allNodes, { nodeId, name, flowId })` that finds the target inject node, throwing descriptive errors on ambiguity or not-found
- [ ] 1.2 Implement `handleInjectMessage(nodeRedClient)` that resolves the node then calls `client.post('/inject/:nodeId')` and returns `{ success, nodeId, message }`
- [ ] 1.3 Add `post(path)` method to `src/nodered/client.js` if it does not already exist (used for `POST /inject/:id`)

## 2. Server Registration

- [ ] 2.1 Import `handleInjectMessage` in `src/server.js`
- [ ] 2.2 Register the `inject-message` tool with parameters: `nodeId` (optional string), `name` (optional string), `flowId` (optional string); description must note that the node must be an inject node and that `read-debug-messages` can be used to observe results

## 3. Tests

- [ ] 3.1 Create `tests/tools/inject-message.test.js`
- [ ] 3.2 Add test: `resolveInjectNode` returns node when `nodeId` matches
- [ ] 3.3 Add test: `resolveInjectNode` resolves by name within a specific flow
- [ ] 3.4 Add test: `resolveInjectNode` resolves by name across all flows when unique
- [ ] 3.5 Add test: `resolveInjectNode` throws on name collision listing all matching IDs
- [ ] 3.6 Add test: `resolveInjectNode` throws when node not found
- [ ] 3.7 Add test: handler returns error when neither `nodeId` nor `name` is provided
