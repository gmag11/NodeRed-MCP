/**
 * Shared Zod output schemas for MCP tool responses.
 *
 * Used by server.js to define outputSchema on each registered tool,
 * enabling LLM clients to understand response shapes without parsing JSON.
 */

import { z } from 'zod';

// ── Staging ─────────────────────────────────────────────────────────

export const StagingSummarySchema = z.object({
  pendingChanges: z.number(),
  dirtyNodeIds: z.array(z.string()),
  dirtyFlowIds: z.array(z.string()),
  deployed: z.boolean(),
});

// ── Flow / Subflow summaries ───────────────────────────────────────

export const FlowSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  disabled: z.boolean(),
  locked: z.boolean(),
  info: z.string(),
  nodeCount: z.number(),
  nodeTypes: z.array(z.string()),
});

export const SubflowSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  info: z.string().optional(),
  inputCount: z.number(),
  outputCount: z.number(),
  nodeCount: z.number(),
  nodeTypes: z.array(z.string()),
  instanceCount: z.number(),
});

// ── Node summaries ──────────────────────────────────────────────────

export const NodeBasicSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  disabled: z.boolean().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  wires: z.array(z.array(z.string())).optional(),
  g: z.string().optional(),
});

export const ConfigNodeSummarySchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
});

export const PaletteNodeSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  module: z.string(),
  version: z.string().optional(),
  types: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

// ── Pagination ──────────────────────────────────────────────────────

export const PaginationMeta = z.object({
  offset: z.number(),
  limit: z.number(),
  total: z.number(),
});

// ── Mutation responses ──────────────────────────────────────────────

/** Response for tools that return nodeId + currentState + staging */
export const CreateNodeResponseSchema = z.object({
  nodeId: z.string(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for flow creation */
export const CreateFlowResponseSchema = z.object({
  flowId: z.string(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for subflow creation */
export const CreateSubflowResponseSchema = z.object({
  subflowId: z.string(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for subflow instance creation */
export const CreateSubflowInstanceResponseSchema = z.object({
  instanceId: z.string(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for updates (previousState + currentState + staging) */
export const UpdateNodeResponseSchema = z.object({
  previousState: z.object({}).passthrough(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

export const UpdateFlowResponseSchema = z.object({
  previousState: z.object({}).passthrough(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

export const UpdateSubflowResponseSchema = z.object({
  previousState: z.object({}).passthrough(),
  currentState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for connect-nodes / disconnect-nodes */
export const WireChangeResponseSchema = z.object({
  previousWires: z.array(z.array(z.string())).optional(),
  currentWires: z.array(z.array(z.string())).optional(),
  staging: StagingSummarySchema,
});

/** Response for add-nodes-to-group */
export const AddNodesToGroupResponseSchema = z.object({
  groupId: z.string(),
  created: z.boolean(),
  boundingBox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  staging: StagingSummarySchema,
});

/** Response for remove-nodes-from-group */
export const RemoveNodesFromGroupResponseSchema = z.object({
  removed: z.array(z.string()),
  staging: StagingSummarySchema,
});

/** Response for import-flow */
export const ImportFlowResponseSchema = z.object({
  imported: z.object({
    flows: z.number(),
    nodes: z.number(),
    configNodes: z.number(),
  }).optional(),
  conflicts: z.number().optional(),
  strategy: z.string().optional(),
  targetFlowId: z.string().optional(),
  staging: StagingSummarySchema,
});

/** Response for delete-node */
export const DeleteNodeResponseSchema = z.object({
  nodeId: z.string(),
  previousState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for delete-flow */
export const DeleteFlowResponseSchema = z.object({
  flowId: z.string(),
  previousState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for delete-subflow */
export const DeleteSubflowResponseSchema = z.object({
  subflowId: z.string(),
  previousState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for delete-group */
export const DeleteGroupResponseSchema = z.object({
  groupId: z.string(),
  previousState: z.object({}).passthrough(),
  staging: StagingSummarySchema,
});

/** Response for delete-context */
export const DeleteContextResponseSchema = z.object({
  success: z.boolean(),
  deletedKeys: z.array(z.string()).optional(),
  staging: StagingSummarySchema.optional(),
});

// ── Special tools ───────────────────────────────────────────────────

export const DeployResponseSchema = z.object({
  success: z.boolean(),
  deployType: z.enum(['full', 'flows', 'nodes']).optional(),
  message: z.string().optional(),
  previousPendingChanges: z.number().optional(),
  staging: StagingSummarySchema,
});

export const InjectMessageResponseSchema = z.object({
  success: z.boolean(),
  nodeId: z.string(),
  message: z.string().optional(),
});

export const DebugMessagesResponseSchema = z.object({
  messages: z.array(z.object({}).passthrough()),
  count: z.number(),
});

export const UninstallNodeResponseSchema = z.object({
  uninstalled: z.boolean(),
  module: z.string(),
});

export const RefreshStagingResponseSchema = z.object({
  previousState: StagingSummarySchema,
  newState: StagingSummarySchema,
});

// ── Read-only responses ─────────────────────────────────────────────

export const FlowNodesResponseSchema = z.object({
  nodes: z.array(NodeBasicSchema),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
});

export const FlowDiagramResponseSchema = z.object({
  mermaid: z.string(),
  nodeCount: z.number(),
});

export const ConfigNodesResponseSchema = z.object({
  configNodes: z.array(ConfigNodeSummarySchema),
  total: z.number(),
});

export const PaletteNodesResponseSchema = z.object({
  nodes: z.array(PaletteNodeSchema),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
});

export const SubflowDetailResponseSchema = z.object({
  subflow: z.object({}).passthrough(),
  internalNodes: z.array(NodeBasicSchema),
  instances: z.array(z.object({}).passthrough()),
  mermaid: z.string(),
});

export const SkillListResponseSchema = z.array(
  z.object({ name: z.string(), description: z.string() })
);

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
