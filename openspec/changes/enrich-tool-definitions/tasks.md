# Tasks: enrich-tool-definitions

## 1. Move annotation constants to shared location
- [ ] 1.1 Add all 9 annotation constant groups (ANN_READONLY, ANN_MUTATION, ANN_DESTRUCTIVE, ANN_DEPLOY, ANN_INJECT, ANN_READ_DEBUG, ANN_INSTALL, ANN_UNINSTALL, ANN_REFRESH) to `src/tools/constants.js`
- [ ] 1.2 Update `src/server.js` to import annotation constants from `./tools/constants.js` instead of defining them inline

## 2. Enrich read-only tool definitions (ANN_READONLY)
- [ ] 2.1 `get-flows.js` — add import for ANN_READONLY + FlowSummarySchema, enrich definition
- [ ] 2.2 `get-subflows.js` — add import for ANN_READONLY + SubflowSummarySchema, enrich definition
- [ ] 2.3 `get-subflow-detail.js` — add import for ANN_READONLY + SubflowDetailResponseSchema, enrich definition
- [ ] 2.4 `get-flow-nodes.js` — add import for ANN_READONLY + FlowNodesResponseSchema, enrich definition
- [ ] 2.5 `get-flow-diagram.js` — add import for ANN_READONLY + FlowDiagramResponseSchema, enrich definition
- [ ] 2.6 `get-config-nodes.js` — add import for ANN_READONLY + ConfigNodesResponseSchema, enrich definition
- [ ] 2.7 `get-node-detail.js` — add import for ANN_READONLY + NodeBasicSchema, enrich definition
- [ ] 2.8 `get-palette-nodes.js` — add import for ANN_READONLY + PaletteNodesResponseSchema, enrich definition
- [ ] 2.9 `get-node-type-detail.js` — add import for ANN_READONLY, enrich definition
- [ ] 2.10 `export-flow.js` — add import for ANN_READONLY, enrich definition
- [ ] 2.11 `export-subflow.js` — add import for ANN_READONLY, enrich definition
- [ ] 2.12 `search-nodes.js` — add import for ANN_READONLY, enrich definition
- [ ] 2.13 `get-context.js` — add import for ANN_READONLY, enrich definition
- [ ] 2.14 `get-staging-status.js` — add import for ANN_READONLY + StagingSummarySchema, enrich definition

## 3. Enrich mutation tool definitions (ANN_MUTATION)
- [ ] 3.1 `create-node.js` — add import for ANN_MUTATION + CreateNodeResponseSchema, enrich definition
- [ ] 3.2 `create-flow.js` — add import for ANN_MUTATION + CreateFlowResponseSchema, enrich definition
- [ ] 3.3 `create-subflow.js` — add import for ANN_MUTATION + CreateSubflowResponseSchema, enrich definition
- [ ] 3.4 `create-subflow-instance.js` — add import for ANN_MUTATION + CreateSubflowInstanceResponseSchema, enrich definition
- [ ] 3.5 `update-node.js` — add import for ANN_MUTATION + UpdateNodeResponseSchema, enrich definition
- [ ] 3.6 `update-flow.js` — add import for ANN_MUTATION + UpdateFlowResponseSchema, enrich definition
- [ ] 3.7 `update-subflow.js` — add import for ANN_MUTATION + UpdateSubflowResponseSchema, enrich definition
- [ ] 3.8 `update-group.js` — add import for ANN_MUTATION, enrich definition
- [ ] 3.9 `connect-nodes.js` — add import for ANN_MUTATION + WireChangeResponseSchema, enrich definition
- [ ] 3.10 `disconnect-nodes.js` — add import for ANN_MUTATION + WireChangeResponseSchema, enrich definition
- [ ] 3.11 `add-nodes-to-group.js` — add import for ANN_MUTATION + AddNodesToGroupResponseSchema, enrich definition
- [ ] 3.12 `remove-nodes-from-group.js` — add import for ANN_MUTATION + RemoveNodesFromGroupResponseSchema, enrich definition
- [ ] 3.13 `import-flow.js` — add import for ANN_MUTATION + ImportFlowResponseSchema, enrich definition

## 4. Enrich destructive tool definitions (ANN_DESTRUCTIVE)
- [ ] 4.1 `delete-node.js` — add import for ANN_DESTRUCTIVE + DeleteNodeResponseSchema, enrich definition
- [ ] 4.2 `delete-flow.js` — add import for ANN_DESTRUCTIVE + DeleteFlowResponseSchema, enrich definition
- [ ] 4.3 `delete-subflow.js` — add import for ANN_DESTRUCTIVE + DeleteSubflowResponseSchema, enrich definition
- [ ] 4.4 `delete-group.js` — add import for ANN_DESTRUCTIVE + DeleteGroupResponseSchema, enrich definition
- [ ] 4.5 `delete-context.js` — add import for ANN_DESTRUCTIVE + DeleteContextResponseSchema, enrich definition

## 5. Enrich special tool definitions
- [ ] 5.1 `deploy.js` — add import for ANN_DEPLOY + DeployResponseSchema, enrich definition
- [ ] 5.2 `inject-message.js` — add import for ANN_INJECT + InjectMessageResponseSchema, enrich definition
- [ ] 5.3 `read-debug-messages.js` — add import for ANN_READ_DEBUG + DebugMessagesResponseSchema, enrich definition
- [ ] 5.4 `install-node.js` — add import for ANN_INSTALL, enrich definition
- [ ] 5.5 `uninstall-node.js` — add import for ANN_UNINSTALL + UninstallNodeResponseSchema, enrich definition
- [ ] 5.6 `refresh-staging.js` — add import for ANN_REFRESH + RefreshStagingResponseSchema, enrich definition

## 6. Refactor server.js to use registry loop
- [ ] 6.1 Import all enriched definition objects and build a `toolDefinitions` array with inline `description` and `inputSchema` (copied from existing `server.tool()` calls)
- [ ] 6.2 Replace the ~38 individual `server.tool()` calls with a single `for` loop that registers each tool from the definitions array
- [ ] 6.3 Keep skills tools (`list-skills`, `get-skill`) as inline registrations in server.js

## 7. Cleanup
- [ ] 7.1 Remove the now-unnecessary inline annotation constant definitions from `server.js` (they're imported from constants.js)
- [ ] 7.2 Verify no unused imports remain in `server.js` after the refactor

## 8. Test
- [ ] 8.1 Run `npm test` — all 547 tests must pass with zero modifications
- [ ] 8.2 Verify all 38 non-skills tools are registered via the loop by checking MCP tool listing
