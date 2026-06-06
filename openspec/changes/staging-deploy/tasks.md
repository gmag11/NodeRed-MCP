## 1. Staging Store

- [ ] 1.1 Create `src/staging-store.js` module
- [ ] 1.2 Implement `StagingStore` class with `flows`, `rev`, `dirtyNodeIds`, `dirtyFlowIds`
- [ ] 1.3 Implement `ensureLoaded(client)` lazy-load method
- [ ] 1.4 Implement `applyMutation(fn)` method tracking dirty state
- [ ] 1.5 Implement `deploy(client, deployType)` method
- [ ] 1.6 Implement `invalidate()` and `getStagingSummary()` methods

## 2. Refactor Read Tools

- [ ] 2.1 Update `get-flows.js` to use `staging.getFlows()`
- [ ] 2.2 Update `get-flow-nodes.js` to use `staging.getFlows()`
- [ ] 2.3 Update `get-flow-diagram.js` to use `staging.getFlows()`
- [ ] 2.4 Update `get-config-nodes.js` to use `staging.getFlows()`
- [ ] 2.5 Update `get-node-detail.js` to use `staging.getFlows()` (keep API call for credentials)
- [ ] 2.6 Update `get-subflows.js` to use `staging.getFlows()`
- [ ] 2.7 Update `get-subflow-detail.js` to use `staging.getFlows()`
- [ ] 2.8 Update `search-nodes.js` to use `staging.getFlows()`
- [ ] 2.9 Update `export-flow.js` and `export-subflow.js` to use `staging.getFlows()`

## 3. Unify Flow Operations

- [ ] 3.1 Extract `applyCreateFlow` logic from `create-flow.js`
- [ ] 3.2 Update `create-flow.js` to use `staging.applyMutation()`
- [ ] 3.3 Extract `applyDeleteFlow` logic from `delete-flow.js`
- [ ] 3.4 Update `delete-flow.js` to use `staging.applyMutation()`
- [ ] 3.5 Update `update-flow.js` to use `staging.applyMutation()`

## 4. Refactor Write Tools

- [ ] 4.1 Update `create-node.js` and `update-node.js` to use `staging.applyMutation()` and include summary
- [ ] 4.2 Update `delete-node.js` to use `staging.applyMutation()` and include summary
- [ ] 4.3 Update `connect-nodes.js` and `disconnect-nodes.js` to use `staging.applyMutation()` and include summary
- [ ] 4.4 Update `create-subflow.js`, `update-subflow.js`, `delete-subflow.js`, `create-subflow-instance.js` to use `staging.applyMutation()` and include summary
- [ ] 4.5 Update `add-nodes-to-group.js`, `remove-nodes-from-group.js`, `update-group.js`, `delete-group.js` to use `staging.applyMutation()` and include summary
- [ ] 4.6 Update `import-flow.js` to use `staging.applyMutation()` and include summary
- [ ] 4.7 Remove `withRetry` from `flow-utils.js`

## 5. Runtime and New Tools

- [ ] 5.1 Implement `deploy.js` tool handler
- [ ] 5.2 Implement `get-staging-status.js` tool handler
- [ ] 5.3 Add pre-deploy guard to `inject-message.js`

## 6. Server Registration and Skills

- [ ] 6.1 Update `src/server.js` to instantiate `StagingStore` and pass to all handlers
- [ ] 6.2 Register `deploy` and `get-staging-status` tools in `server.js`
- [ ] 6.3 Update write tool descriptions in `server.js` to explain staging
- [ ] 6.4 Update `skill-nodered-flow-builder/SKILL.md` workflows
- [ ] 6.5 Update `skill-nodered-fundamentals/SKILL.md`
- [ ] 6.6 Update `skill-nodered-patterns/SKILL.md`
- [ ] 6.7 Update `skill-nodered-subflows/SKILL.md`
