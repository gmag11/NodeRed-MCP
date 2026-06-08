# Tasks: refactor-tool-architecture

## 1. Create shared utilities
- [ ] Create `src/tools/response-utils.js` with:
  - `formatSuccess(data)` — returns `{ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }`
  - `formatError(message, details?)` — returns error-shaped response with `isError: true`
- [ ] Create `src/tools/constants.js` with:
  - `STAGING_WARNING` — the repeated staging disclaimer string
  - `DEPLOY_REQUIRED` — the deploy reminder string
  - Other repeated description fragments

## 2. Add definition exports to read-only tool modules (16 tools)
- [ ] `get-flows.js` → export `getFlowsDefinition` with name, description, inputSchema, handler
- [ ] `get-subflows.js` → export `getSubflowsDefinition`
- [ ] `get-subflow-detail.js` → export `getSubflowDetailDefinition`
- [ ] `get-flow-nodes.js` → export `getFlowNodesDefinition`
- [ ] `get-flow-diagram.js` → export `getFlowDiagramDefinition`
- [ ] `get-config-nodes.js` → export `getConfigNodesDefinition`
- [ ] `get-node-detail.js` → export `getNodeDetailDefinition`
- [ ] `get-palette-nodes.js` → export `getPaletteNodesDefinition`
- [ ] `get-node-type-detail.js` → export `getNodeTypeDetailDefinition`
- [ ] `export-flow.js` → export `exportFlowDefinition`
- [ ] `export-subflow.js` → export `exportSubflowDefinition`
- [ ] `search-nodes.js` → export `searchNodesDefinition`
- [ ] `get-context.js` → export `getContextDefinition`
- [ ] `get-staging-status.js` → export `getStagingStatusDefinition`
- [ ] (Skills handled separately — list-skills, get-skill)

## 3. Add definition exports to mutation tool modules (14 tools)
- [ ] `create-node.js` → export `createNodeDefinition`
- [ ] `create-flow.js` → export `createFlowDefinition`
- [ ] `create-subflow.js` → export `createSubflowDefinition`
- [ ] `create-subflow-instance.js` → export `createSubflowInstanceDefinition`
- [ ] `update-node.js` → export `updateNodeDefinition`
- [ ] `update-flow.js` → export `updateFlowDefinition`
- [ ] `update-subflow.js` → export `updateSubflowDefinition`
- [ ] `update-group.js` → export `updateGroupDefinition`
- [ ] `connect-nodes.js` → export `connectNodesDefinition`
- [ ] `disconnect-nodes.js` → export `disconnectNodesDefinition`
- [ ] `add-nodes-to-group.js` → export `addNodesToGroupDefinition`
- [ ] `remove-nodes-from-group.js` → export `removeNodesFromGroupDefinition`
- [ ] `import-flow.js` → export `importFlowDefinition`

## 4. Add definition exports to destructive tool modules (5 tools)
- [ ] `delete-node.js` → export `deleteNodeDefinition`
- [ ] `delete-flow.js` → export `deleteFlowDefinition`
- [ ] `delete-subflow.js` → export `deleteSubflowDefinition`
- [ ] `delete-group.js` → export `deleteGroupDefinition`
- [ ] `delete-context.js` → export `deleteContextDefinition`

## 5. Add definition exports to special tool modules (6 tools)
- [ ] `deploy.js` → export `deployDefinition`
- [ ] `inject-message.js` → export `injectMessageDefinition`
- [ ] `read-debug-messages.js` → export `readDebugMessagesDefinition`
- [ ] `install-node.js` → export `installNodeDefinition`
- [ ] `uninstall-node.js` → export `uninstallNodeDefinition`
- [ ] `refresh-staging.js` → export `refreshStagingDefinition`

## 6. Convert handlers to use formatSuccess
- [ ] All ~38 handlers: replace `return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }` with `return formatSuccess(data)`
- [ ] Handlers with error returns: use `formatError(message)` instead of throwing or returning raw error objects

## 7. Refactor src/server.js
- [ ] Remove all inline `server.tool(...)` calls
- [ ] Import all `*Definition` objects and collect into an array
- [ ] Register tools in a loop:
  ```js
  for (const def of toolDefinitions) {
    server.tool(def.name, def.description, def.inputSchema, async (params) => {
      return def.handler(staging, nodeRedClient, commsClient, params);
    });
  }
  ```
- [ ] Handle special cases (tools that need `commsClient` or no `staging`):
  - `read-debug-messages` needs `commsClient`
  - `get-palette-nodes`, `get-node-type-detail`, `install-node`, `uninstall-node` don't use staging
  - `inject-message` needs both staging AND client
  - Pass all three (staging, nodeRedClient, commsClient) uniformly; handlers ignore unused params

## 8. Handle skills tools separately
- [ ] Skills tools (`list-skills`, `get-skill`) remain in `server.js` since they depend on the skills Map which is loaded at startup

## 9. Test
- [ ] Run `npm test` — all existing vitest tests must pass without modification
- [ ] Verify all 38+ tools are still registered (count tools via MCP client)
- [ ] Spot-check 5 tools across different categories for correct behavior
