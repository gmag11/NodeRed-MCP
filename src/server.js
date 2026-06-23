/**
 * MCP Server definition.
 *
 * Creates and configures the McpServer instance with all registered tools.
 * Transport-agnostic: the caller decides how to connect it.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StagingStore } from './staging-store.js';
import {
  StagingSummarySchema,
  FlowSummarySchema,
  SubflowSummarySchema,
  NodeBasicSchema,
  ConfigNodeSummarySchema,
  PaletteNodeSchema,
  CreateNodeResponseSchema,
  CreateFlowResponseSchema,
  CreateSubflowResponseSchema,
  CreateSubflowInstanceResponseSchema,
  UpdateNodeResponseSchema,
  UpdateFlowResponseSchema,
  UpdateSubflowResponseSchema,
  WireChangeResponseSchema,
  AddNodesToGroupResponseSchema,
  RemoveNodesFromGroupResponseSchema,
  ImportFlowResponseSchema,
  DeleteNodeResponseSchema,
  DeleteFlowResponseSchema,
  DeleteSubflowResponseSchema,
  DeleteGroupResponseSchema,
  DeleteContextResponseSchema,
  DeployResponseSchema,
  InjectMessageResponseSchema,
  DebugMessagesResponseSchema,
  UninstallNodeResponseSchema,
  RefreshStagingResponseSchema,
  FlowNodesResponseSchema,
  FlowDiagramResponseSchema,
  ConfigNodesResponseSchema,
  PaletteNodesResponseSchema,
  SubflowDetailResponseSchema,
  SkillListResponseSchema,
} from './schemas/responses.js';
import { handleGetFlows } from './tools/get-flows.js';
import { handleGetSubflows } from './tools/get-subflows.js';
import { handleGetSubflowDetail } from './tools/get-subflow-detail.js';
import { handleCreateSubflowInstance } from './tools/create-subflow-instance.js';
import { handleExportSubflow } from './tools/export-subflow.js';
import { handleCreateSubflow } from './tools/create-subflow.js';
import { handleUpdateSubflow } from './tools/update-subflow.js';
import { handleDeleteSubflow } from './tools/delete-subflow.js';
import { handleGetFlowNodes } from './tools/get-flow-nodes.js';
import { handleGetFlowDiagram } from './tools/get-flow-diagram.js';
import { handleGetConfigNodes } from './tools/get-config-nodes.js';
import { handleGetNodeDetail } from './tools/get-node-detail.js';
import { handleGetPaletteNodes } from './tools/get-palette-nodes.js';
import { handleGetNodeTypeDetail } from './tools/get-node-type-detail.js';
import { handleCreateFlow } from './tools/create-flow.js';
import { handleDeleteFlow } from './tools/delete-flow.js';
import { handleUpdateFlow } from './tools/update-flow.js';
import { handleUpdateNode } from './tools/update-node.js';
import { handleConnectNodes } from './tools/connect-nodes.js';
import { handleDisconnectNodes } from './tools/disconnect-nodes.js';
import { handleCreateNode } from './tools/create-node.js';
import { handleDeleteNode } from './tools/delete-node.js';
import { handleExportFlowJson } from './tools/export-flow.js';
import { handleImportFlow } from './tools/import-flow.js';
import { handleGetContext } from './tools/get-context.js';
import { handleDeleteContext } from './tools/delete-context.js';
import { handleSearchNodes } from './tools/search-nodes.js';
import { handleInjectMessage } from './tools/inject-message.js';
import { handleReadDebugMessages } from './tools/read-debug-messages.js';
import { handleInstallNode } from './tools/install-node.js';
import { handleUninstallNode } from './tools/uninstall-node.js';
import { handleAddNodesToGroup } from './tools/add-nodes-to-group.js';
import { handleRemoveNodesFromGroup } from './tools/remove-nodes-from-group.js';
import { handleUpdateGroup } from './tools/update-group.js';
import { handleDeleteGroup } from './tools/delete-group.js';
import { handleDeploy } from './tools/deploy.js';
import { handleGetStagingStatus } from './tools/get-staging-status.js';
import { handleRefreshStaging } from './tools/refresh-staging.js';
import { handleRenderStaging, renderStagingDefinition } from './tools/render-staging.js';
import { loadSkills } from './skills/loader.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFlowsDefinition } from './tools/get-flows.js';
import { getSubflowsDefinition } from './tools/get-subflows.js';
import { getSubflowDetailDefinition } from './tools/get-subflow-detail.js';
import { createSubflowInstanceDefinition } from './tools/create-subflow-instance.js';
import { exportSubflowDefinition } from './tools/export-subflow.js';
import { createSubflowDefinition } from './tools/create-subflow.js';
import { updateSubflowDefinition } from './tools/update-subflow.js';
import { deleteSubflowDefinition } from './tools/delete-subflow.js';
import { getFlowNodesDefinition } from './tools/get-flow-nodes.js';
import { getFlowDiagramDefinition } from './tools/get-flow-diagram.js';
import { getConfigNodesDefinition } from './tools/get-config-nodes.js';
import { getNodeDetailDefinition } from './tools/get-node-detail.js';
import { getPaletteNodesDefinition } from './tools/get-palette-nodes.js';
import { getNodeTypeDetailDefinition } from './tools/get-node-type-detail.js';
import { createFlowDefinition } from './tools/create-flow.js';
import { deleteFlowDefinition } from './tools/delete-flow.js';
import { updateFlowDefinition } from './tools/update-flow.js';
import { updateNodeDefinition } from './tools/update-node.js';
import { connectNodesDefinition } from './tools/connect-nodes.js';
import { disconnectNodesDefinition } from './tools/disconnect-nodes.js';
import { createNodeDefinition } from './tools/create-node.js';
import { deleteNodeDefinition } from './tools/delete-node.js';
import { exportFlowDefinition } from './tools/export-flow.js';
import { importFlowDefinition } from './tools/import-flow.js';
import { getContextDefinition } from './tools/get-context.js';
import { deleteContextDefinition } from './tools/delete-context.js';
import { searchNodesDefinition } from './tools/search-nodes.js';
import { injectMessageDefinition } from './tools/inject-message.js';
import { readDebugMessagesDefinition } from './tools/read-debug-messages.js';
import { installNodeDefinition } from './tools/install-node.js';
import { uninstallNodeDefinition } from './tools/uninstall-node.js';
import { addNodesToGroupDefinition } from './tools/add-nodes-to-group.js';
import { removeNodesFromGroupDefinition } from './tools/remove-nodes-from-group.js';
import { updateGroupDefinition } from './tools/update-group.js';
import { deleteGroupDefinition } from './tools/delete-group.js';
import { deployDefinition } from './tools/deploy.js';
import { getStagingStatusDefinition } from './tools/get-staging-status.js';
import { refreshStagingDefinition } from './tools/refresh-staging.js';

/**
 * Create a configured MCP server with all tools registered.
 *
 * Eagerly loads the staging store from the Node-RED backend so that flows are
 * available immediately without waiting for the first tool call.
 *
 * @param {ReturnType<import('./nodered/client.js').createNodeRedClient>} nodeRedClient
 * @param {import('./nodered/comms-client.js').CommsClient} [commsClient]
 * @returns {Promise<McpServer>}
 */
export async function createMcpServer(nodeRedClient, commsClient) {
  const server = new McpServer({
    name: 'nodered-mcp-server',
    version: '0.1.0',
  });

  // Create the in-memory staging store shared across all tool handlers
  const staging = new StagingStore(nodeRedClient);

  // Eagerly load staging from Node-RED backend on startup
  console.error('[nodered-mcp] Loading staging from Node-RED backend...');
  await staging.ensureLoaded();
  console.error('[nodered-mcp] Staging loaded — ready to serve');

  // Register: get-flows
  server.tool(
    'get-flows',
    'Summarized list of all flow tabs: id, label, type, status, node count, and node types. ' +
    'Use get-subflows for subflow definitions.',
    {},
    async () => handleGetFlows(staging),
    { annotations: getFlowsDefinition.annotations, outputSchema: getFlowsDefinition.outputSchema },
  );

  // Register: get-subflows
  server.tool(
    'get-subflows',
    'Summarized list of all subflow definitions: id, name, ports, node count, instances. ' +
    'Use get-subflow-detail for deep inspection of a specific subflow.',
    {},
    async () => handleGetSubflows(staging),
    { annotations: getSubflowsDefinition.annotations, outputSchema: getSubflowsDefinition.outputSchema },
  );

  // Register: get-subflow-detail
  server.tool(
    'get-subflow-detail',
    'Full detail of a single subflow: definition, internal nodes, instances, and Mermaid diagram. ' +
    'Use this to understand what a subflow does internally before instantiating or modifying it.',
    {
      subflowId: z.string().describe('ID of the subflow to inspect'),
    },
    async (params) => handleGetSubflowDetail(staging, params),
    { annotations: getSubflowDetailDefinition.annotations, outputSchema: getSubflowDetailDefinition.outputSchema },
  );

  // Register: create-subflow-instance
  server.tool(
    'create-subflow-instance',
    'Place a reusable subflow instance into a flow tab (staged — deploy to apply). ' +
    'Auto-sizes output wires to match the subflow definition. Validates subflow and target flow exist.',
    {
      subflowId: z.string().describe('ID of the subflow definition to instantiate'),
      flowId: z.string().describe('ID of the target flow tab where the instance will be placed'),
      name: z.string().optional().describe('Display name for the instance'),
      env: z.array(z.object({
        name: z.string().describe('Environment variable name'),
        value: z.string().describe('Environment variable value'),
        type: z.string().describe('Environment variable type (e.g. "str", "num", "bool")'),
      })).optional().describe('Instance-level environment variables'),
      x: z.number().int().optional().default(300).describe('X canvas position (default 300)'),
      y: z.number().int().optional().default(200).describe('Y canvas position (default 200)'),
    },
    async (params) => handleCreateSubflowInstance(staging, nodeRedClient, params),
    { annotations: createSubflowInstanceDefinition.annotations, outputSchema: createSubflowInstanceDefinition.outputSchema },
  );

  // Register: export-subflow
  server.tool(
    'export-subflow',
    'Export a subflow definition, internal nodes, and config nodes as JSON for import-flow. ' +
    'Use to back up, share, or duplicate a subflow across instances.',
    {
      subflowId: z.string().describe('ID of the subflow to export'),
    },
    async (params) => handleExportSubflow(staging, params),
    { annotations: exportSubflowDefinition.annotations, outputSchema: exportSubflowDefinition.outputSchema },
  );

  // Register: create-subflow
  server.tool(
    'create-subflow',
    'Create a new empty subflow definition (staged — deploy to apply). ' +
    'Returns the subflowId for use with create-node and connect-nodes. Use update-subflow to define ports.',
    {
      name: z.string().describe('Display name for the subflow'),
      info: z.string().optional().describe('Markdown description for the subflow'),
      category: z.string().optional().describe('Palette category (e.g. "subflow"). Omit to place in the default "subflows" section.'),
      color: z.string().optional().describe('Palette node color (e.g. "#DDAA99")'),
      icon: z.string().optional().describe('Palette icon path (e.g. "node-red/subflow.svg")'),
      in: z.array(z.object({}).passthrough()).optional().describe('Input port definitions'),
      out: z.array(z.object({}).passthrough()).optional().describe('Output port definitions'),
    },
    async (params) => handleCreateSubflow(staging, nodeRedClient, params),
    { annotations: createSubflowDefinition.annotations, outputSchema: createSubflowDefinition.outputSchema },
  );

  // Register: update-subflow
  server.tool(
    'update-subflow',
    'Update metadata of a subflow definition (staged — deploy to apply). ' +
    'Partial merge — unspecified fields are preserved. Refuses locked subflows.',
    {
      subflowId: z.string().describe('ID of the subflow to update'),
      updates: z.object({}).passthrough().describe('Fields to update: name, info, category, color, icon, in, out'),
    },
    async (params) => handleUpdateSubflow(staging, nodeRedClient, params),
    { annotations: updateSubflowDefinition.annotations, outputSchema: updateSubflowDefinition.outputSchema },
  );

  // Register: delete-subflow
  server.tool(
    'delete-subflow',
    'Delete a subflow definition and optionally its instances (staged — deploy to apply). ' +
    'Returns previousState for undo. Refuses locked subflows.',
    {
      subflowId: z.string().describe('ID of the subflow to delete'),
      deleteInstances: z.boolean().optional().default(true)
        .describe('Whether to also delete all instances of this subflow (default true)'),
    },
    async (params) => handleDeleteSubflow(staging, nodeRedClient, params),
    { annotations: deleteSubflowDefinition.annotations, outputSchema: deleteSubflowDefinition.outputSchema },
  );

  // Register: get-flow-nodes
  server.tool(
    'get-flow-nodes',
    'Paginated list of nodes within a flow: id, type, name, position, wires, group membership. ' +
    'Supports filtering by disabled state, node type, and connected subgraph. Large text fields excluded.',
    {
      flowId: z.string().describe('ID of the flow (tab or subflow) to inspect'),
      disabledOnly: z.boolean().optional().describe('If true, return only disabled nodes'),
      nodeType: z.string().optional().describe('Filter to nodes of this type (e.g. "function", "http in")'),
      fromNodeId: z.string().optional().describe('Filter to the connected subgraph reachable from this node ID'),
      direction: z.enum(['downstream', 'upstream', 'both']).optional().default('both')
        .describe('Traversal direction when fromNodeId is set: downstream (follow wires forward), upstream (follow wires backward), or both (full connected component). Default: both'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max nodes to return (default 50, max 200)'),
    },
    async (params) => handleGetFlowNodes(staging, params),
    { annotations: getFlowNodesDefinition.annotations, outputSchema: getFlowNodesDefinition.outputSchema },
  );

  // Register: get-flow-diagram
  server.tool(
    'get-flow-diagram',
    'Mermaid flowchart diagram of a flow\'s topology with node names, wires, and group containers. ' +
    'Supports same filtering as get-flow-nodes. Use to visualize flow structure.',
    {
      flowId: z.string().describe('ID of the flow (tab or subflow) to diagram'),
      disabledOnly: z.boolean().optional().describe('If true, include only disabled nodes in the diagram'),
      nodeType: z.string().optional().describe('Include only nodes of this type in the diagram'),
      fromNodeId: z.string().optional().describe('Include only the connected subgraph reachable from this node ID'),
      direction: z.enum(['downstream', 'upstream', 'both']).optional().default('both')
        .describe('Traversal direction when fromNodeId is set. Default: both'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max nodes to include in diagram (default 50, max 200)'),
    },
    async (params) => handleGetFlowDiagram(staging, params),
    { annotations: getFlowDiagramDefinition.annotations, outputSchema: getFlowDiagramDefinition.outputSchema },
  );

  // Register: get-config-nodes
  server.tool(
    'get-config-nodes',
    'Paginated list of global config nodes (mqtt-broker, tls-config, etc.): id, type, name, config. ' +
    'Supports type filtering and pagination. Credential values are never exposed.',
    {
      nodeType: z.string().optional().describe('Filter to config nodes of this type (e.g. "mqtt-broker")'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max config nodes to return (default 50, max 200)'),
    },
    async (params) => handleGetConfigNodes(staging, params),
    { annotations: getConfigNodesDefinition.annotations, outputSchema: getConfigNodesDefinition.outputSchema },
  );

  // Register: get-node-detail
  server.tool(
    'get-node-detail',
    'Full detail of a single node by ID, including large text fields (func, template, html). ' +
    'For config nodes, includes credential metadata (field names, has_<field> flags). Passwords are never exposed.',
    {
      nodeId: z.string().describe('ID of the node to retrieve'),
    },
    async (params) => handleGetNodeDetail(staging, nodeRedClient, params),
    { annotations: getNodeDetailDefinition.annotations, outputSchema: getNodeDetailDefinition.outputSchema },
  );

  // Register: get-palette-nodes
  server.tool(
    'get-palette-nodes',
    'Paginated list of all installed node types: name, module, version, category, enabled state. ' +
    'Use to discover available node types before building flows.',
    {
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (0-based, default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max items to return (default 50, max 200)'),
    },
    async (params) => handleGetPaletteNodes(nodeRedClient, params),
    { annotations: getPaletteNodesDefinition.annotations, outputSchema: getPaletteNodesDefinition.outputSchema },
  );

  // Register: get-node-type-detail
  server.tool(
    'get-node-type-detail',
    'Detailed info about a specific node type: module, version, description, configurable parameters. ' +
    'Use to understand what properties a node type accepts before using it in a flow.',
    {
      type: z.string().describe('The node type name to look up (e.g. "inject", "function", "http in")'),
    },
    async (params) => handleGetNodeTypeDetail(nodeRedClient, params),
    { annotations: getNodeTypeDetailDefinition.annotations, outputSchema: getNodeTypeDetailDefinition.outputSchema },
  );

  // Register: create-flow
  server.tool(
    'create-flow',
    'Create a new flow tab (staged — deploy to apply). ' +
    'Returns the new flow ID. Use before creating nodes inside the tab.',
    {
      label: z.string().describe('Display label for the new flow tab'),
      disabled: z.boolean().optional().describe('Whether the flow is disabled (default false)'),
      info: z.string().optional().describe('Description or notes for the flow (default empty string)'),
      env: z.array(z.object({
        name: z.string().describe('Environment variable name'),
        value: z.string().describe('Environment variable value'),
        type: z.string().describe('Environment variable type (e.g. "str", "num", "bool")'),
      })).optional().describe('Flow-level environment variables (default empty array)'),
    },
    async (params) => handleCreateFlow(staging, params),
    { annotations: createFlowDefinition.annotations, outputSchema: createFlowDefinition.outputSchema },
  );

  // Register: delete-flow
  server.tool(
    'delete-flow',
    'Delete a flow tab by ID (staged — deploy to apply). ' +
    'Returns previousState for undo. Refuses locked flows.',
    {
      flowId: z.string().describe('ID of the flow tab to delete'),
    },
    async (params) => handleDeleteFlow(staging, params),
    { annotations: deleteFlowDefinition.annotations, outputSchema: deleteFlowDefinition.outputSchema },
  );

  // Register: update-flow
  server.tool(
    'update-flow',
    'Update flow tab metadata: label, disabled, info, env (staged — deploy to apply). ' +
    'Returns previousState and currentState. Refuses locked flows.',
    {
      flowId: z.string().describe('ID of the flow tab to update'),
      updates: z.object({
        label: z.string().optional().describe('New display label'),
        disabled: z.boolean().optional().describe('New enabled/disabled state'),
        info: z.string().optional().describe('New description or notes'),
        env: z.array(z.object({
          name: z.string().describe('Environment variable name'),
          value: z.string().describe('Environment variable value'),
          type: z.string().describe('Environment variable type (e.g. "str", "num", "bool")'),
        })).optional().describe('Replacement flow-level environment variables'),
      }).describe('Fields to update — at least one field is required'),
    },
    async (params) => handleUpdateFlow(staging, params),
    { annotations: updateFlowDefinition.annotations, outputSchema: updateFlowDefinition.outputSchema },
  );

  // Register: update-node
  server.tool(
    'update-node',
    'Shallow-merge properties onto an existing node (staged — deploy to apply). ' +
    'Do NOT include wires — use connect-nodes/disconnect-nodes. For credentials, nest in a credentials object.',
    {
      nodeId: z.string().describe('ID of the node to update'),
      properties: z.record(z.unknown()).describe('Properties to shallow-merge onto the node — must NOT include wires; use connect-nodes to add connections'),
    },
    async (params) => handleUpdateNode(staging, nodeRedClient, params),
    { annotations: updateNodeDefinition.annotations, outputSchema: updateNodeDefinition.outputSchema },
  );

  // Register: connect-nodes
  server.tool(
    'connect-nodes',
    'Add a wire between nodes (staged — deploy to apply). ' +
    'Idempotent. Supports batch mode via connections array. Returns wire state before and after.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0) — ignored when `connections` is provided'),
      toNodeId: z.string().optional().describe('ID of the target node to wire to — ignored when `connections` is provided'),
      connections: z.array(z.object({
        outputPort: z.number().int().min(0).describe('Output port index (0-based)'),
        toNodeId: z.string().describe('ID of the target node to wire to'),
      })).optional().describe('Batch mode: wire multiple output ports in one call. When provided, `outputPort` and `toNodeId` are ignored.'),
    },
    async (params) => handleConnectNodes(staging, nodeRedClient, params),
    { annotations: connectNodesDefinition.annotations, outputSchema: connectNodesDefinition.outputSchema },
  );

  // Register: disconnect-nodes
  server.tool(
    'disconnect-nodes',
    'Remove wires between nodes (staged — deploy to apply). ' +
    'Supports single-wire, clear-port, and batch modes. Returns wire state before and after.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0) — ignored when `connections` is provided'),
      toNodeId: z.string().optional().describe('ID of the target node whose wire to remove — omitted in clear-port mode; ignored when `connections` is provided'),
      clearPort: z.boolean().optional().default(false).describe('If true and `toNodeId` is omitted, remove ALL wires from `outputPort`. Ignored when `connections` is provided.'),
      connections: z.array(z.object({
        outputPort: z.number().int().min(0).describe('Output port index (0-based)'),
        toNodeId: z.string().describe('ID of the target node to disconnect'),
      })).optional().describe('Batch mode: remove multiple wires in one call. When provided, `outputPort`, `toNodeId`, and `clearPort` are ignored.'),
    },
    async (params) => handleDisconnectNodes(staging, nodeRedClient, params),
    { annotations: disconnectNodesDefinition.annotations, outputSchema: disconnectNodesDefinition.outputSchema },
  );

  // Register: create-node
  server.tool(
    'create-node',
    'Create a new node of any installed palette type in a flow (staged — deploy to apply). ' +
    'Returns the new node ID. After creation, wire it with connect-nodes. ' +
    'For credentials, nest them in a credentials object inside properties.',
    {
      type: z.string().describe('Palette node type to create (e.g. "function", "debug", "http in")'),
      flowId: z.string().describe('ID of the flow tab or subflow to place the node in'),
      properties: z.record(z.unknown()).optional().describe('Type-specific configuration fields to set on the new node'),
      x: z.number().optional().default(300).describe('X canvas position (default 300)'),
      y: z.number().optional().default(200).describe('Y canvas position (default 200)'),
    },
    async (params) => handleCreateNode(staging, nodeRedClient, params),
    { annotations: createNodeDefinition.annotations, outputSchema: createNodeDefinition.outputSchema },
  );

  // Register: delete-node
  server.tool(
    'delete-node',
    'Remove a node by ID (staged — deploy to apply). ' +
    'Returns the deleted node for undo. Refuses locked flows.',
    {
      nodeId: z.string().describe('ID of the node to delete'),
    },
    async (params) => handleDeleteNode(staging, nodeRedClient, params),
    { annotations: deleteNodeDefinition.annotations, outputSchema: deleteNodeDefinition.outputSchema },
  );

  // Register: export-flow
  server.tool(
    'export-flow',
    'Export a flow or selected nodes as JSON for import-flow. ' +
    'Supports "flow" mode (full tab + config nodes) and "nodes" mode (selected nodes with trimmed wires).',
    {
      exportMode: z.enum(['flow', 'nodes']).optional().default('flow')
        .describe('Export mode: "flow" (full tab + config nodes) or "nodes" (selected nodes with trimmed wires). Default: "flow"'),
      flowId: z.string().optional()
        .describe('ID of the flow tab to export (flow mode only). Omit to export all flows.'),
      nodeIds: z.array(z.string()).optional()
        .describe('IDs of nodes to export (nodes mode only). Required when exportMode is "nodes".'),
    },
    async (params) => handleExportFlowJson(staging, params),
    { annotations: exportFlowDefinition.annotations, outputSchema: exportFlowDefinition.outputSchema },
  );

  // Register: import-flow
  server.tool(
    'import-flow',
    'Import flow JSON into staging (staged — deploy to apply). ' +
    'Supports "regenerate" (safe, new IDs) and "overwrite" conflict strategies. Optional targetFlowId for injection.',
    {
      flowJson: z.string().describe('Node-RED flow JSON to import — a JSON array string or a JSON object string with a "nodes" array'),
      conflictStrategy: z.enum(['regenerate', 'overwrite']).optional().default('regenerate')
        .describe('How to handle ID collisions: "regenerate" (default) remaps all IDs to new UUIDs; "overwrite" replaces existing nodes by ID'),
      targetFlowId: z.string().optional()
        .describe('If provided, import all non-tab nodes into this existing flow tab (its ID must exist and must not be locked)'),
    },
    async (params) => handleImportFlow(staging, nodeRedClient, params),
    { annotations: importFlowDefinition.annotations, outputSchema: importFlowDefinition.outputSchema },
  );

  // Register: get-context
  server.tool(
    'get-context',
    'Read a context variable from node, flow, or global scope. ' +
    'Single-key or all-keys mode. In-memory values are lost on restart.',
    {
      scope: z.enum(['node', 'flow', 'global']).describe('Context scope to read from'),
      id: z.string().optional().describe('Node or flow UUID — required when scope is "node" or "flow"'),
      key: z.string().optional().describe('Context key to read; omit to return all keys in the scope'),
    },
    async (params) => handleGetContext(nodeRedClient, params),
    { annotations: getContextDefinition.annotations, outputSchema: getContextDefinition.outputSchema },
  );

  // Register: delete-context
  server.tool(
    'delete-context',
    'Delete a context variable from node, flow, or global scope. ' +
    'Returns confirmation. The API does not support writing context — use function nodes for that.',
    {
      scope: z.enum(['node', 'flow', 'global']).describe('Context scope to delete from'),
      id: z.string().optional().describe('Node or flow UUID — required when scope is "node" or "flow"'),
      key: z.string().describe('Context key to delete'),
    },
    async (params) => handleDeleteContext(nodeRedClient, params),
    { annotations: deleteContextDefinition.annotations, outputSchema: deleteContextDefinition.outputSchema },
  );

  // Register: search-nodes
  server.tool(
    'search-nodes',
    'Deep-search all regular nodes by query string (plain text or regex). ' +
    'Returns matching nodes with flow context. Use to find nodes by name, type, or property value.',
    {
      query: z.string().describe('The search term — plain text (case-insensitive substring) or regex pattern when regex: true'),
      regex: z.boolean().optional().default(false).describe('If true, treat query as a JavaScript regex pattern (default false — plain text search)'),
      flowId: z.string().optional().describe('Limit search to nodes in a specific flow tab or subflow (omit to search all flows)'),
      limit: z.number().int().min(1).optional().default(50).describe('Max results to return (default 50)'),
    },
    async (params) => handleSearchNodes(staging, params),
    { annotations: searchNodesDefinition.annotations, outputSchema: searchNodesDefinition.outputSchema },
  );

  // Register: inject-message
  server.tool(
    'inject-message',
    'Trigger an inject node by ID or name. ' +
    'Must deploy first — undeployed inject nodes will fail. Use read-debug-messages to observe results.',
    {
      nodeId: z.string().optional().describe('Node UUID of the inject node to trigger (alternative to name)'),
      name: z.string().optional().describe('Name of the inject node to trigger (alternative to nodeId)'),
      flowId: z.string().optional().describe('Flow ID to scope the name search (optional, ignored when nodeId is provided)'),
    },
    async (params) => handleInjectMessage(staging, nodeRedClient)(params),
    { annotations: injectMessageDefinition.annotations, outputSchema: injectMessageDefinition.outputSchema },
  );

  // Register: install-node
  server.tool(
    'install-node',
    'Install a Node-RED node module from npm. ' +
    'Returns the installed module info. May take 10-30+ seconds. Some nodes require restart.',
    {
      module: z.string().describe('npm package name to install (plain name, no @version), e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleInstallNode(nodeRedClient, params),
    { annotations: installNodeDefinition.annotations, outputSchema: installNodeDefinition.outputSchema },
  );

  // Register: uninstall-node
  server.tool(
    'uninstall-node',
    'Uninstall a Node-RED node module. ' +
    'WARNING: removes node types from ALL flows. Export flows first if unsure.',
    {
      module: z.string().describe('Module identifier to uninstall, as shown in get-palette-nodes, e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleUninstallNode(nodeRedClient, params),
    { annotations: uninstallNodeDefinition.annotations, outputSchema: uninstallNodeDefinition.outputSchema },
  );

  // Register: add-nodes-to-group
  server.tool(
    'add-nodes-to-group',
    'Add nodes to a group, creating the group if needed (staged — deploy to apply). ' +
    'Returns groupId and bounding box. Nodes are reassigned if already in another group.',
    {
      flowId: z.string().describe('ID of the flow tab where the nodes and group reside'),
      nodeIds: z.array(z.string()).describe('Array of node IDs to add to the group'),
      groupId: z.string().optional().describe('ID of an existing group. If omitted, a new group is created'),
      groupName: z.string().optional().describe('Name for a new group (ignored if groupId is provided). Defaults to "Group"'),
      style: z.object({
        label: z.boolean().optional(),
        fill: z.string().optional(),
        'fill-opacity': z.string().optional(),
        stroke: z.string().optional(),
        'label-position': z.string().optional(),
        color: z.string().optional(),
      }).optional().describe('Style overrides for a new group (merged with defaults). Ignored if groupId is provided'),
    },
    async (params) => handleAddNodesToGroup(staging, nodeRedClient, params),
    { annotations: addNodesToGroupDefinition.annotations, outputSchema: addNodesToGroupDefinition.outputSchema },
  );

  // Register: remove-nodes-from-group
  server.tool(
    'remove-nodes-from-group',
    'Remove nodes from a group (staged — deploy to apply). ' +
    'If no nodeIds provided, removes all members. Optionally repositions nodes outside the group bounds.',
    {
      groupId: z.string().describe('ID of the group to remove nodes from'),
      nodeIds: z.array(z.string()).optional().describe('Specific node IDs to remove. If omitted, all members are removed'),
      reposition: z.boolean().optional().default(false).describe('If true, reposition removed nodes to the right of the group bounds'),
    },
    async (params) => handleRemoveNodesFromGroup(staging, nodeRedClient, params),
    { annotations: removeNodesFromGroupDefinition.annotations, outputSchema: removeNodesFromGroupDefinition.outputSchema },
  );

  // Register: update-group
  server.tool(
    'update-group',
    'Update group name, style, or dimensions (staged — deploy to apply). ' +
    'Returns previous and current state for undo.',
    {
      groupId: z.string().describe('ID of the group node to update'),
      properties: z.object({}).passthrough().describe('Properties to shallow-merge onto the group (name, style, x, y, w, h)'),
    },
    async (params) => handleUpdateGroup(staging, nodeRedClient, params),
    { annotations: updateGroupDefinition.annotations, outputSchema: updateGroupDefinition.outputSchema },
  );

  // Register: delete-group
  server.tool(
    'delete-group',
    'Delete a group and optionally its member nodes (staged — deploy to apply). ' +
    'Returns previousState for undo. Set deleteMembers: false to keep nodes.',
    {
      groupId: z.string().describe('ID of the group to delete'),
      deleteMembers: z.boolean().optional().default(true).describe('Whether to also delete member nodes (default true). Set to false to keep nodes'),
    },
    async (params) => handleDeleteGroup(staging, nodeRedClient, params),
    { annotations: deleteGroupDefinition.annotations, outputSchema: deleteGroupDefinition.outputSchema },
  );

  // Register: deploy
  server.tool(
    'deploy',
    'Deploy all staged changes to the Node-RED runtime. ' +
    'No write operation takes effect until deploy. Supports full, flows, and nodes deploy types. ' +
    'Best practice: batch edits, then deploy once. Check get-staging-status before deploying.',
    {
      deployType: z.enum(['full', 'flows', 'nodes']).optional().default('nodes')
        .describe('Deploy scope: "full" (all), "flows" (modified flows), or "nodes" (modified nodes only). Default: "nodes"'),
    },
    async (params) => handleDeploy(staging)(params),
    { annotations: deployDefinition.annotations, outputSchema: deployDefinition.outputSchema },
  );

  // Register: get-staging-status
  server.tool(
    'get-staging-status',
    'Current staging state: pending changes, dirty node/flow IDs, deployed flag. ' +
    'Use to inspect pending changes before deploy or verify deploy success.',
    {},
    async () => handleGetStagingStatus(staging)(),
    { annotations: getStagingStatusDefinition.annotations, outputSchema: getStagingStatusDefinition.outputSchema },
  );

  // Register: refresh-staging
  server.tool(
    'refresh-staging',
    'Discard all un-deployed changes and re-fetch latest state from Node-RED. ' +
    'Use at the START of every editing session. Without this, stale state causes HTTP 409 on deploy.',
    {},
    async () => handleRefreshStaging(staging)(),
    { annotations: refreshStagingDefinition.annotations, outputSchema: refreshStagingDefinition.outputSchema },
  );

  // Register: read-debug-messages
  if (commsClient) {
    server.tool(
      'read-debug-messages',
    'Read buffered debug messages from the Node-RED WebSocket connection. ' +
    'Filter by node, name, keyword, or time range. Use after inject-message to observe flow output.',
      {
        nodeId: z.string().optional().describe('Filter: exact match on debug node ID'),
        nodeName: z.string().optional().describe('Filter: case-insensitive substring match on debug node name'),
        keyword: z.string().optional().describe('Filter: case-insensitive substring match in the stringified message payload'),
        after: z.number().optional().describe('Filter: inclusive lower bound timestamp (Unix ms) — only messages with timestamp >= after'),
        before: z.number().optional().describe('Filter: inclusive upper bound timestamp (Unix ms) — only messages with timestamp <= before'),
        last: z.number().int().min(1).optional().describe('Return the last N matching messages (tail mode). Mutually exclusive with limit.'),
        limit: z.number().int().min(1).optional().describe('Return the first N matching messages (default 50). Mutually exclusive with last.'),
      },
      async (params) => handleReadDebugMessages(commsClient)(params),
      { annotations: readDebugMessagesDefinition.annotations, outputSchema: readDebugMessagesDefinition.outputSchema },
    );
  }

  // ── Skills integration ──────────────────────────────────────────────

  // Resolve project root (src/server.js → src/ → project root)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '..');
  const allSkills = loadSkills(projectRoot);

  // Only expose Node-RED skills — filter out openspec, workflows, etc.
  const skills = new Map(
    [...allSkills].filter(([name]) => name.startsWith('nodered-'))
  );

  // Register MCP Resources — one per skill
  for (const [skillName, skill] of skills) {
    server.resource(
      skillName,
      `nodered://skills/${skillName}`,
      { description: skill.description, mimeType: 'text/markdown' },
      async () => ({
        contents: [{
          uri: `nodered://skills/${skillName}`,
          text: skill.content,
          mimeType: 'text/markdown',
        }],
      }),
    );
  }

  // Register: get-skill tool (fallback for clients that don't support MCP Resources)
  server.tool(
    'get-skill',
    'Retrieve full content of a Node-RED skill by name. ' +
    'Use list-skills first to discover available skills. Also available as MCP resources.',
    {
      name: z.string().describe('The skill name to retrieve. Use list-skills to see available values (e.g. "nodered-flow-builder", "nodered-node-reference")'),
    },
    async (params) => {
      const skill = skills.get(params.name);
      if (!skill) {
        const available = [...skills.keys()].join(', ');
        return {
          content: [{
            type: 'text',
            text: `Skill "${params.name}" not found. Available skills: ${available || '(none)'}`,
          }],
        };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: skill.name,
            description: skill.description,
            content: skill.content,
          }),
        }],
      };
    },
  );

  // Register: list-skills tool
  server.tool(
    'list-skills',
    'List all available Node-RED skills with names, descriptions, and resource URIs. ' +
    'Call this first to discover what skill guides exist, then use get-skill to read full content.',
    {},
    async () => {
      const skillList = [...skills].map(([name, s]) => ({
        name,
        description: s.description,
        uri: `nodered://skills/${name}`,
      }));
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(skillList),
        }],
      };
    },
  );

  // ── Render-staging tool ────────────────────────────────────────────

  server.tool(
    'render-staging',
    'Render the current staging workspace as SVG, HTML, or Mermaid. ' +
    'SVG shows node positions and wire curves. HTML is interactive. highlightDirty highlights un-deployed nodes.',
    {
      format: z.enum(['svg', 'html', 'mermaid']).optional().default('svg')
        .describe('Output format: "svg" (static SVG), "html" (interactive page), or "mermaid" (topology diagram)'),
      flowId: z.string().optional().describe('Filter to a single flow tab or subflow ID'),
      highlightDirty: z.boolean().optional().default(true).describe('Highlight dirty nodes with orange border'),
    },
    async (params) => handleRenderStaging(staging)(params),
    { annotations: renderStagingDefinition.annotations },
  );

  // Expose staging for HTTP transport (WebSocket, snapshot endpoint)
  server.__staging = staging;

  return server;
}
