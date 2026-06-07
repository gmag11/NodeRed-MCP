## 1. Staging Store

- [x] 1.1 Create `src/staging-store.js` module
- [x] 1.2 Implement `StagingStore` class with `flows`, `rev`, `dirtyNodeIds`, `dirtyFlowIds`
- [x] 1.3 Implement `ensureLoaded(client)` lazy-load method
- [x] 1.4 Implement `applyMutation(fn)` method tracking dirty state
- [x] 1.5 Implement `deploy(client, deployType)` method
- [x] 1.6 Implement `invalidate()` and `getStagingSummary()` methods

## 2. Refactor Read Tools

- [x] 2.1 Update `get-flows.js` to use `staging.getFlows()`
- [x] 2.2 Update `get-flow-nodes.js` to use `staging.getFlows()`
- [x] 2.3 Update `get-flow-diagram.js` to use `staging.getFlows()`
- [x] 2.4 Update `get-config-nodes.js` to use `staging.getFlows()`
- [x] 2.5 Update `get-node-detail.js` to use `staging.getFlows()` (keep API call for credentials)
- [x] 2.6 Update `get-subflows.js` to use `staging.getFlows()`
- [x] 2.7 Update `get-subflow-detail.js` to use `staging.getFlows()`
- [x] 2.8 Update `search-nodes.js` to use `staging.getFlows()`
- [x] 2.9 Update `export-flow.js` and `export-subflow.js` to use `staging.getFlows()`

## 3. Unify Flow Operations

- [x] 3.1 Extract `applyCreateFlow` logic from `create-flow.js`
- [x] 3.2 Update `create-flow.js` to use `staging.applyMutation()`
- [x] 3.3 Extract `applyDeleteFlow` logic from `delete-flow.js`
- [x] 3.4 Update `delete-flow.js` to use `staging.applyMutation()`
- [x] 3.5 Update `update-flow.js` to use `staging.applyMutation()`

## 4. Refactor Write Tools

- [x] 4.1 Update `create-node.js` and `update-node.js` to use `staging.applyMutation()` and include summary
- [x] 4.2 Update `delete-node.js` to use `staging.applyMutation()` and include summary
- [x] 4.3 Update `connect-nodes.js` and `disconnect-nodes.js` to use `staging.applyMutation()` and include summary
- [x] 4.4 Update `create-subflow.js`, `update-subflow.js`, `delete-subflow.js`, `create-subflow-instance.js` to use `staging.applyMutation()` and include summary
- [x] 4.5 Update `add-nodes-to-group.js`, `remove-nodes-from-group.js`, `update-group.js`, `delete-group.js` to use `staging.applyMutation()` and include summary
- [x] 4.6 Update `import-flow.js` to use `staging.applyMutation()` and include summary
- [x] 4.7 Remove `withRetry` from `flow-utils.js`

## 5. Runtime and New Tools

- [x] 5.1 Implement `deploy.js` tool handler
- [x] 5.2 Implement `get-staging-status.js` tool handler
- [x] 5.3 Add pre-deploy guard to `inject-message.js`

## 6. Server Registration and Skills

- [x] 6.1 Update `src/server.js` to instantiate `StagingStore` and pass to all handlers
- [x] 6.2 Register `deploy` and `get-staging-status` tools in `server.js`
- [x] 6.3 Update write tool descriptions in `server.js` to explain staging
- [x] 6.4 Update `skill-nodered-flow-builder/SKILL.md` workflows
- [x] 6.5 Update `skill-nodered-fundamentals/SKILL.md`
- [x] 6.6 Update `skill-nodered-patterns/SKILL.md`
- [x] 6.7 Update `skill-nodered-subflows/SKILL.md`
