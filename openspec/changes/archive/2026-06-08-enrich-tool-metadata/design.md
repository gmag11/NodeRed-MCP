# Design: enrich-tool-metadata

## Overview

Three related enhancements applied in a single pass across all tool registrations:

1. **Annotations** — 4th argument to `server.tool()` via `{ annotations: { ... } }`
2. **Output schemas** — 5th argument to `server.tool()` via `{ outputSchema: ZodSchema }`
3. **Structured content** — Handlers return `structuredContent` alongside `content`

## Annotation Classification

| Category | Tools | readOnlyHint | destructiveHint | idempotentHint | openWorldHint |
|---|---|---|---|---|---|
| **Read-only queries** | `get-flows`, `get-subflows`, `get-subflow-detail`, `get-flow-nodes`, `get-flow-diagram`, `get-config-nodes`, `get-node-detail`, `get-palette-nodes`, `get-node-type-detail`, `list-skills`, `get-skill`, `get-staging-status`, `export-flow`, `export-subflow`, `search-nodes`, `get-context` | `true` | `false` | `true` | `true` |
| **Staging mutations** | `create-node`, `create-flow`, `create-subflow`, `create-subflow-instance`, `update-node`, `update-flow`, `update-subflow`, `update-group`, `connect-nodes`, `disconnect-nodes`, `add-nodes-to-group`, `remove-nodes-from-group`, `import-flow` | `false` | `false` | `false` | `false` |
| **Destructive staging** | `delete-node`, `delete-flow`, `delete-subflow`, `delete-group`, `delete-context`, `remove-nodes-from-group` (when clearing all members) | `false` | `true` | `false` | `false` |
| **Deploy** | `deploy` | `false` | `false` | `true` | `false` |
| **Side-effect actions** | `inject-message`, `read-debug-messages`, `install-node`, `uninstall-node`, `refresh-staging` | `false` | `false`/`true` | `false`/`true` | `true` |

## Output Schema Strategy

### Shared schemas (new file: `src/schemas/responses.js`)

```js
// Common building blocks
export const StagingSummarySchema = z.object({
  pendingChanges: z.number(),
  dirtyNodeIds: z.array(z.string()),
  dirtyFlowIds: z.array(z.string()),
  deployed: z.boolean(),
});

export const SuccessResponse = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export const FlowSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.literal('tab'),
  disabled: z.boolean(),
  locked: z.boolean(),
  info: z.string(),
  nodeCount: z.number(),
  nodeTypes: z.array(z.string()),
});
```

### Tool-specific schemas

Each tool defines its output schema inline or reuses shared schemas. For example:

- `get-flows` → `z.array(FlowSummarySchema)`
- `create-node` → `z.object({ nodeId: z.string(), currentState: z.object({}).passthrough(), staging: StagingSummarySchema })`
- `deploy` → `z.object({ success: z.literal(true), deployType: z.enum(['full','flows','nodes']), staging: StagingSummarySchema })`

## Structured Content Pattern

All handlers currently return:
```js
return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
```

After this change, they also return:
```js
return {
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  structuredContent: data,
};
```

The `structuredContent` field is validated by the MCP SDK against the `outputSchema` if provided. This is additive — existing text responses are preserved.

## Files Affected

- **`src/server.js`** — Add annotations + outputSchema to all ~38 `server.tool()` calls
- **`src/schemas/responses.js`** (new) — Shared Zod output schemas
- **`src/tools/*.js`** (~38 files) — Add `structuredContent` to handler return values
- **`src/tools/flow-utils.js`** — May need minor adjustments for structured types

## Risks

- **Zod schema drift**: If handlers change their return shape, the output schema must be updated too. Mitigation: keep schemas close to handlers.
- **structuredContent validation**: The SDK may reject responses that don't match the schema. Mitigation: thorough testing with vitest.
