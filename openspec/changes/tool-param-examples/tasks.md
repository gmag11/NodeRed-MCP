## 1. Audit current state

- [ ] 1.1 List all `server.tool(...)` registrations in `src/server.js` and extract every Zod parameter `.describe()` string
- [ ] 1.2 List all `*Definition` exports in `src/tools/` that contain `inputSchema` Zod schemas
- [ ] 1.3 Identify which parameters already have examples (if any) and which are bare

## 2. Enrich `src/server.js` tool registrations

- [ ] 2.1 Add examples to flow-scoped parameters (flowId, subflowId, nodeId) — indicate UUID format and how to obtain valid IDs
- [ ] 2.2 Add examples to type parameters (type, nodeType) — list common palette types
- [ ] 2.3 Add examples to enum parameters (deployType, direction) — list all valid values
- [ ] 2.4 Add examples to string parameters with constrained values (name, label, category, color, icon)
- [ ] 2.5 Add examples to numeric parameters (x, y, offset, limit, port) — show typical ranges
- [ ] 2.6 Add examples to boolean parameters (disabled, deleteInstances) — self-explanatory but add context
- [ ] 2.7 Add examples to object parameters (properties, updates, env, connections, style) — show valid property shapes

## 3. Enrich tool definition files in `src/tools/`

- [ ] 3.1 Enrich input schemas in `src/tools/create-node.js` (createNodeDefinition)
- [ ] 3.2 Enrich input schemas in `src/tools/connect-nodes.js` (connectNodesDefinition)
- [ ] 3.3 Enrich input schemas in `src/tools/get-flow-nodes.js` (getFlowNodesDefinition)
- [ ] 3.4 Enrich input schemas in `src/tools/inject-message.js` (injectMessageDefinition)
- [ ] 3.5 Enrich input schemas in `src/tools/read-debug-messages.js` (readDebugMessagesDefinition)
- [ ] 3.6 Enrich input schemas in remaining tool definition files

## 4. Validation

- [ ] 4.1 Run `npm test` to verify no test regressions
- [ ] 4.2 Start the MCP server and verify tool descriptions are correctly enriched via MCP Inspector or manual inspection
- [ ] 4.3 Spot-check 5 tools to confirm examples render correctly in tool definitions
