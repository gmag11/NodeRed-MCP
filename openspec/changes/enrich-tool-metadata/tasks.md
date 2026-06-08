# Tasks: enrich-tool-metadata

## 1. Create shared output schemas
- [ ] Create `src/schemas/responses.js` with common Zod schemas:
  - `StagingSummarySchema` — pendingChanges, dirtyNodeIds, dirtyFlowIds, deployed
  - `SuccessResponse` — success, message
  - `FlowSummarySchema` — id, label, type, disabled, locked, info, nodeCount, nodeTypes
  - `SubflowSummarySchema` — id, name, info, inputCount, outputCount, nodeCount, nodeTypes, instanceCount
  - `NodeBasicSchema` — id, type, name, disabled, x, y, wires, g
  - `ConfigNodeSummarySchema` — id, type, name
  - `PaletteNodeSchema` — type, module, version, category, enabled
  - `StagingMutationResponse` — success, staging (StagingSummarySchema)

## 2. Add annotations to read-only tools (16 tools)
- [ ] `get-flows`, `get-subflows`, `get-subflow-detail`, `get-flow-nodes`, `get-flow-diagram`, `get-config-nodes`, `get-node-detail`, `get-palette-nodes`, `get-node-type-detail`, `list-skills`, `get-skill`, `get-staging-status`, `export-flow`, `export-subflow`, `search-nodes`, `get-context`
- [ ] Annotations: `{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }`

## 3. Add annotations to staging mutation tools (13 tools)
- [ ] `create-node`, `create-flow`, `create-subflow`, `create-subflow-instance`, `update-node`, `update-flow`, `update-subflow`, `update-group`, `connect-nodes`, `disconnect-nodes`, `add-nodes-to-group`, `remove-nodes-from-group`, `import-flow`
- [ ] Annotations: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }`

## 4. Add annotations to destructive tools (6 tools)
- [ ] `delete-node`, `delete-flow`, `delete-subflow`, `delete-group`, `delete-context`
- [ ] Annotations: `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }`

## 5. Add annotations to special tools (5 tools)
- [ ] `deploy` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }`
- [ ] `inject-message` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`
- [ ] `read-debug-messages` — `{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }`
- [ ] `install-node` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`
- [ ] `uninstall-node` — `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }`
- [ ] `refresh-staging` — `{ readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }`

## 6. Add outputSchema to read-only tools
- [ ] `get-flows` → `z.array(FlowSummarySchema)`
- [ ] `get-subflows` → `z.array(SubflowSummarySchema)`
- [ ] `get-subflow-detail` → object with subflow, internalNodes, instances, mermaid
- [ ] `get-flow-nodes` → object with nodes, total, pagination
- [ ] `get-flow-diagram` → object with mermaid, nodeCount
- [ ] `get-config-nodes` → object with configNodes, total
- [ ] `get-node-detail` → passthrough object
- [ ] `get-palette-nodes` → object with nodes, total, page
- [ ] `get-node-type-detail` → passthrough object
- [ ] `list-skills` → `z.array(z.object({ name: z.string(), description: z.string() }))`
- [ ] `get-skill` → passthrough object
- [ ] `get-staging-status` → StagingSummarySchema
- [ ] `export-flow` → passthrough object
- [ ] `export-subflow` → passthrough object
- [ ] `search-nodes` → `z.array(NodeBasicSchema)`
- [ ] `get-context` → passthrough object

## 7. Add outputSchema to mutation tools
- [ ] `create-node` → `{ nodeId, currentState, staging }`
- [ ] `create-flow` → `{ flowId, currentState, staging }`
- [ ] `create-subflow` → `{ subflowId, currentState, staging }`
- [ ] `create-subflow-instance` → `{ instanceId, currentState, staging }`
- [ ] `update-node` → `{ previousState, currentState, staging }`
- [ ] `update-flow` → `{ previousState, currentState, staging }`
- [ ] `update-subflow` → `{ previousState, currentState, staging }`
- [ ] `update-group` → `{ previousState, currentState, staging }`
- [ ] `connect-nodes` → `{ previousWires, currentWires, staging }`
- [ ] `disconnect-nodes` → `{ previousWires, currentWires, staging }`
- [ ] `add-nodes-to-group` → `{ groupId, created, boundingBox, staging }`
- [ ] `remove-nodes-from-group` → `{ removed, staging }`
- [ ] `import-flow` → `{ imported, conflicts, strategy, staging }`
- [ ] `delete-node` → `{ nodeId, previousState, staging }`
- [ ] `delete-flow` → `{ flowId, previousState, staging }`
- [ ] `delete-subflow` → `{ subflowId, previousState, staging }`
- [ ] `delete-group` → `{ groupId, previousState, staging }`
- [ ] `delete-context` → `{ success, deletedKeys, staging }`

## 8. Add outputSchema to special tools
- [ ] `deploy` → `{ success, deployType, staging }`
- [ ] `inject-message` → `{ success, nodeId, message }`
- [ ] `read-debug-messages` → `{ messages, count }`
- [ ] `install-node` → passthrough (API-dependent)
- [ ] `uninstall-node` → `{ uninstalled, module }`
- [ ] `refresh-staging` → `{ previousState, newState }`

## 9. Add structuredContent to all handlers
- [ ] Each handler in `src/tools/*.js` returns `structuredContent` alongside `content`
- [ ] The structuredContent value is the same data object passed to `JSON.stringify()`
- [ ] Verify SDK validates structuredContent against outputSchema

## 10. Test
- [ ] Run `npm test` — all vitest tests must pass
- [ ] Verify annotations appear in MCP tool list (use MCP Inspector or manual check)
- [ ] Verify outputSchema is reported by the server
- [ ] Verify structuredContent is present in tool responses
