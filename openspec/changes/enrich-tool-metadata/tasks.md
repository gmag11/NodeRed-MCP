# Tasks: enrich-tool-metadata

## 1. Create shared output schemas
- [x] Create `src/schemas/responses.js` with common Zod schemas:
  - `StagingSummarySchema` — pendingChanges, dirtyNodeIds, dirtyFlowIds, deployed
  - `SuccessResponse` — success, message
  - `FlowSummarySchema` — id, label, type, disabled, locked, info, nodeCount, nodeTypes
  - `SubflowSummarySchema` — id, name, info, inputCount, outputCount, nodeCount, nodeTypes, instanceCount
  - `NodeBasicSchema` — id, type, name, disabled, x, y, wires, g
  - `ConfigNodeSummarySchema` — id, type, name
  - `PaletteNodeSchema` — type, module, version, category, enabled
  - `StagingMutationResponse` — success, staging (StagingSummarySchema)

## 2. Add annotations to read-only tools (16 tools)
- [x] `get-flows`, `get-subflows`, `get-subflow-detail`, `get-flow-nodes`, `get-flow-diagram`, `get-config-nodes`, `get-node-detail`, `get-palette-nodes`, `get-node-type-detail`, `list-skills`, `get-skill`, `get-staging-status`, `export-flow`, `export-subflow`, `search-nodes`, `get-context`
- [x] Annotations: `{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }`

## 3. Add annotations to staging mutation tools (13 tools)
- [x] `create-node`, `create-flow`, `create-subflow`, `create-subflow-instance`, `update-node`, `update-flow`, `update-subflow`, `update-group`, `connect-nodes`, `disconnect-nodes`, `add-nodes-to-group`, `remove-nodes-from-group`, `import-flow`
- [x] Annotations: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }`

## 4. Add annotations to destructive tools (6 tools)
- [x] `delete-node`, `delete-flow`, `delete-subflow`, `delete-group`, `delete-context`
- [x] Annotations: `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }`

## 5. Add annotations to special tools (5 tools)
- [x] `deploy` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }`
- [x] `inject-message` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`
- [x] `read-debug-messages` — `{ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }`
- [x] `install-node` — `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }`
- [x] `uninstall-node` — `{ readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }`
- [x] `refresh-staging` — `{ readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }`

## 6. Add outputSchema to read-only tools
- [x] `get-flows` → `z.array(FlowSummarySchema)`
- [x] `get-subflows` → `z.array(SubflowSummarySchema)`
- [x] `get-subflow-detail` → object with subflow, internalNodes, instances, mermaid
- [x] `get-flow-nodes` → object with nodes, total, pagination
- [x] `get-flow-diagram` → object with mermaid, nodeCount
- [x] `get-config-nodes` → object with configNodes, total
- [x] `get-node-detail` → passthrough object
- [x] `get-palette-nodes` → object with nodes, total, page
- [x] `get-node-type-detail` → passthrough object
- [x] `list-skills` → `z.array(z.object({ name: z.string(), description: z.string() }))`
- [x] `get-skill` → passthrough object
- [x] `get-staging-status` → StagingSummarySchema
- [x] `export-flow` → passthrough object
- [x] `export-subflow` → passthrough object
- [x] `search-nodes` → `z.array(NodeBasicSchema)`
- [x] `get-context` → passthrough object

## 7. Add outputSchema to mutation tools
- [x] `create-node` → `{ nodeId, currentState, staging }`
- [x] `create-flow` → `{ flowId, currentState, staging }`
- [x] `create-subflow` → `{ subflowId, currentState, staging }`
- [x] `create-subflow-instance` → `{ instanceId, currentState, staging }`
- [x] `update-node` → `{ previousState, currentState, staging }`
- [x] `update-flow` → `{ previousState, currentState, staging }`
- [x] `update-subflow` → `{ previousState, currentState, staging }`
- [x] `update-group` → `{ previousState, currentState, staging }`
- [x] `connect-nodes` → `{ previousWires, currentWires, staging }`
- [x] `disconnect-nodes` → `{ previousWires, currentWires, staging }`
- [x] `add-nodes-to-group` → `{ groupId, created, boundingBox, staging }`
- [x] `remove-nodes-from-group` → `{ removed, staging }`
- [x] `import-flow` → `{ imported, conflicts, strategy, staging }`
- [x] `delete-node` → `{ nodeId, previousState, staging }`
- [x] `delete-flow` → `{ flowId, previousState, staging }`
- [x] `delete-subflow` → `{ subflowId, previousState, staging }`
- [x] `delete-group` → `{ groupId, previousState, staging }`
- [x] `delete-context` → `{ success, deletedKeys, staging }`

## 8. Add outputSchema to special tools
- [x] `deploy` → `{ success, deployType, staging }`
- [x] `inject-message` → `{ success, nodeId, message }`
- [x] `read-debug-messages` → `{ messages, count }`
- [x] `install-node` → passthrough (API-dependent)
- [x] `uninstall-node` → `{ uninstalled, module }`
- [x] `refresh-staging` → `{ previousState, newState }`

## 9. Add structuredContent to all handlers
- [x] Each handler in `src/tools/*.js` returns `structuredContent` alongside `content`
- [x] The structuredContent value is the same data object passed to `JSON.stringify()`
- [x] Verify SDK validates structuredContent against outputSchema

## 10. Test
- [x] Run `npm test` — all vitest tests must pass
- [x] Verify annotations appear in MCP tool list (use MCP Inspector or manual check)
- [x] Verify outputSchema is reported by the server
- [x] Verify structuredContent is present in tool responses
