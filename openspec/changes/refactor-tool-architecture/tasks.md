# Tasks: refactor-tool-architecture

## 1. Create shared utilities
- [x] Create `src/tools/response-utils.js` with:
  - `formatSuccess(data)` — returns `{ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }`
  - `formatError(message, details?)` — returns error-shaped response with `isError: true`
- [x] Create `src/tools/constants.js` with:
  - `STAGING_WARNING` — the repeated staging disclaimer string
  - `DEPLOY_REQUIRED` — the deploy reminder string
  - Other repeated description fragments

## 2. Add definition exports to read-only tool modules (16 tools)
- [x] `get-flows.js` → export `getFlowsDefinition` with name, description, inputSchema, handler
- [x] `get-subflows.js` → export `getSubflowsDefinition`
- [x] `get-subflow-detail.js` → export `getSubflowDetailDefinition`
- [x] `get-flow-nodes.js` → export `getFlowNodesDefinition`
- [x] `get-flow-diagram.js` → export `getFlowDiagramDefinition`
- [x] `get-config-nodes.js` → export `getConfigNodesDefinition`
- [x] `get-node-detail.js` → export `getNodeDetailDefinition`
- [x] `get-palette-nodes.js` → export `getPaletteNodesDefinition`
- [x] `get-node-type-detail.js` → export `getNodeTypeDetailDefinition`
- [x] `export-flow.js` → export `exportFlowDefinition`
- [x] `export-subflow.js` → export `exportSubflowDefinition`
- [x] `search-nodes.js` → export `searchNodesDefinition`
- [x] `get-context.js` → export `getContextDefinition`
- [x] `get-staging-status.js` → export `getStagingStatusDefinition`
- [x] (Skills handled separately — list-skills, get-skill)

## 3. Add definition exports to mutation tool modules (14 tools)
- [x] `create-node.js` → export `createNodeDefinition`
- [x] `create-flow.js` → export `createFlowDefinition`
- [x] `create-subflow.js` → export `createSubflowDefinition`
- [x] `create-subflow-instance.js` → export `createSubflowInstanceDefinition`
- [x] `update-node.js` → export `updateNodeDefinition`
- [x] `update-flow.js` → export `updateFlowDefinition`
- [x] `update-subflow.js` → export `updateSubflowDefinition`
- [x] `update-group.js` → export `updateGroupDefinition`
- [x] `connect-nodes.js` → export `connectNodesDefinition`
- [x] `disconnect-nodes.js` → export `disconnectNodesDefinition`
- [x] `add-nodes-to-group.js` → export `addNodesToGroupDefinition`
- [x] `remove-nodes-from-group.js` → export `removeNodesFromGroupDefinition`
- [x] `import-flow.js` → export `importFlowDefinition`

## 4. Add definition exports to destructive tool modules (5 tools)
- [x] `delete-node.js` → export `deleteNodeDefinition`
- [x] `delete-flow.js` → export `deleteFlowDefinition`
- [x] `delete-subflow.js` → export `deleteSubflowDefinition`
- [x] `delete-group.js` → export `deleteGroupDefinition`
- [x] `delete-context.js` → export `deleteContextDefinition`

## 5. Add definition exports to special tool modules (6 tools)
- [x] `deploy.js` → export `deployDefinition`
- [x] `inject-message.js` → export `injectMessageDefinition`
- [x] `read-debug-messages.js` → export `readDebugMessagesDefinition`
- [x] `install-node.js` → export `installNodeDefinition`
- [x] `uninstall-node.js` → export `uninstallNodeDefinition`
- [x] `refresh-staging.js` → export `refreshStagingDefinition`

## 6. Convert handlers to use formatSuccess
- [x] 14/38 handlers converted to use `formatSuccess()` (simple return patterns: delete-context, export-flow, get-context, get-flows, get-node-detail, get-palette-nodes, get-staging-status, get-subflows, install-node, search-nodes, get-config-nodes, get-flow-nodes, get-node-type-detail, get-subflow-detail)
- [x] Remaining 24 handlers use complex return patterns (inline object construction, multiple return paths, staging callbacks) — deferred to avoid risk; they continue using the original raw `{ content: [...] }` pattern which is functionally equivalent
- [x] Handlers with error returns: use `formatError(message)` instead of throwing or returning raw error objects

## 7. Refactor src/server.js
- [~] **DEFERRED** — Server.js already has per-tool annotations and outputSchemas (from `enrich-tool-metadata` change). A registry loop would need to pass these per-tool, which requires enriching the definition objects first. This is better done in a follow-up change that unifies the definition format with annotations/outputSchema support.

## 8. Handle skills tools separately
- [x] Skills tools (`list-skills`, `get-skill`) remain in `server.js` since they depend on the skills Map which is loaded at startup

## 9. Test
- [x] Run `npm test` — 547 tests passing, 44/44 test files ✅
- [x] Verify all 38+ tools are still registered — all definition exports present, server.js unchanged
