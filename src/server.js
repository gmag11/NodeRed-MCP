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
    'Get a summarized list of all flow tabs from the Node-RED instance. ' +
    'Returns each tab\'s id, label, type, enabled/disabled status, node count, and the types of nodes it contains. ' +
    'Use this to understand what flow tabs exist and what they do at a glance. ' +
    'For subflow definitions, use get-subflows.',
    {},
    async () => handleGetFlows(staging),
    { annotations: getFlowsDefinition.annotations, outputSchema: getFlowsDefinition.outputSchema },
  );

  // Register: get-subflows
  server.tool(
    'get-subflows',
    'Get a summarized list of all subflow definitions from the Node-RED instance. ' +
    'Returns each subflow\'s id, name, info, input/output port counts, internal node count and types, ' +
    'instance count, and the locations of each instance. ' +
    'Use this to discover reusable subflows before building flows. ' +
    'Use get-subflow-detail for deep inspection of a specific subflow.',
    {},
    async () => handleGetSubflows(staging),
    { annotations: getSubflowsDefinition.annotations, outputSchema: getSubflowsDefinition.outputSchema },
  );

  // Register: get-subflow-detail
  server.tool(
    'get-subflow-detail',
    'Get the full detail of a single subflow definition. ' +
    'Returns the subflow definition node, all internal nodes (with sanitized config), ' +
    'all instances placed in flow tabs, and a Mermaid flowchart diagram of the internal wiring. ' +
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
    'Create an instance of an existing subflow inside a flow tab (staged — call `deploy` to apply). ' +
    'Auto-sizes the output wires to match the subflow\'s output port count. ' +
    'Validates that the subflow and target flow exist. ' +
    'Use this to place a reusable subflow into a flow tab. ' +
    '📐 LAYOUT: For proper positioning of subflow instances relative to other nodes, see the `nodered-flow-layout` skill. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Export a Node-RED subflow definition, its internal nodes, and any referenced config nodes ' +
    'as a JSON array string that can be passed to import-flow. ' +
    'Use this to back up a subflow, share it, or duplicate it across instances.',
    {
      subflowId: z.string().describe('ID of the subflow to export'),
    },
    async (params) => handleExportSubflow(staging, params),
    { annotations: exportSubflowDefinition.annotations, outputSchema: exportSubflowDefinition.outputSchema },
  );

  // Register: create-subflow
  server.tool(
    'create-subflow',
    'Create a new empty subflow definition (staged — call `deploy` to apply). ' +
    'Returns the subflowId which can then be used with create-node (flowId = subflowId) ' +
    'and connect-nodes to populate internal nodes. Use update-subflow to define input/output ports. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Update metadata fields of an existing subflow definition (staged — call `deploy` to apply). ' +
    'Allowed fields: name, info, category, color, icon, in, out. ' +
    'Performs a partial merge — unspecified fields are preserved. ' +
    'Refuses to update a locked subflow. ' +
    'Use this to rename a subflow or redefine its input/output port wiring. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Delete a subflow definition, its internal nodes, and optionally its instances (staged — call `deploy` to apply). ' +
    'By default (deleteInstances: true), all instances are also removed. ' +
    'Set deleteInstances: false to keep orphan instances. ' +
    'Returns previousState with definition, internalNodes, and instances for undo support. ' +
    'Refuses to delete a locked subflow. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Get a detailed, paginated list of nodes within a specific Node-RED flow. ' +
    'Returns each node\'s id, type, name, disabled state, position (x/y), wires (connections), group membership (g), and sanitized configuration. ' +
    'Group nodes (type: "group") are included with their style, member list (nodes[]), and dimensions (w/h). ' +
    'Large text fields (func, template, format, html, css) are excluded to save context. ' +
    'Supports filtering by disabled state, node type (including "group"), and connected subgraph (upstream/downstream from a specific node). ' +
    'Use offset/limit for pagination on large flows. ' +
    '⚠️ Credential field values (passwords, API keys) are stripped by Node-RED and NOT included here. ' +
    'Use get-node-detail on a specific config node to see credential metadata (field names and has_<field> flags).',
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
    'Get a Mermaid flowchart diagram (flowchart TD) representing the topology of a Node-RED flow. ' +
    'Shows node names/types as labeled boxes connected by wires. Groups are rendered as Mermaid subgraph containers with their style colors. ' +
    'Disabled nodes are styled with dashed borders. Multi-output nodes show output port labels. ' +
    'Supports the same filtering options as get-flow-nodes (disabled, type, subgraph direction) and pagination. ' +
    'Use this to visualize flow structure or share with users.',
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
    'Get a paginated list of global configuration nodes from the Node-RED instance. ' +
    'Configuration nodes (e.g. mqtt-broker, tls-config, http-proxy) are shared resources used by flow nodes but not tied to any specific flow. ' +
    'Returns each config node\'s id, type, name, and sanitized configuration. ' +
    'Supports filtering by node type and pagination. ' +
    '⚠️ Credential values (passwords, keys) are NOT included — Node-RED strips them. ' +
    'Use get-node-detail on a specific config node to see credential metadata (field names, has_<field> flags). ' +
    'To update credentials, use update-node with a `credentials` object.',
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
    'Get the full detail of a single Node-RED node by its ID. ' +
    'Returns all node fields including large text fields (func, template, format, html, css) ' +
    'that are intentionally excluded from get-flow-nodes to save context. ' +
    'Use this when you need to read the actual logic or content of a specific node (e.g. a function node\'s JavaScript code or a template node\'s markup). ' +
    '� The `info` field (labeled "Description" in the Node-RED editor UI) contains the node\'s description text. ' +
    '�🔑 CREDENTIAL METADATA: For config nodes (mqtt-broker, http-proxy, tls-config, etc.), ' +
    'includes a `_credentials` field with credential field names and whether each password is set (has_<field>: true/false). ' +
    'Password VALUES are never exposed — only their presence/absence. Non-credential text fields (like username) are shown in plain text.',
    {
      nodeId: z.string().describe('ID of the node to retrieve'),
    },
    async (params) => handleGetNodeDetail(staging, nodeRedClient, params),
    { annotations: getNodeDetailDefinition.annotations, outputSchema: getNodeDetailDefinition.outputSchema },
  );

  // Register: get-palette-nodes
  server.tool(
    'get-palette-nodes',
    'Get a paginated list of all node types available in the Node-RED palette. ' +
    'Returns each type name, its module, version, category, and enabled state. ' +
    'Results are sorted alphabetically by type name. ' +
    'Use offset and limit to iterate through large palettes. ' +
    'Use this to discover what node types are installed before building or auditing flows.',
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
    'Get detailed information about a specific Node-RED node type from the palette. ' +
    'Returns the type name, module, version, category, description, enabled state, ' +
    'and a list of configurable parameters with their types and default values. ' +
    'Use this to understand what properties a node type accepts before using it in a flow.',
    {
      type: z.string().describe('The node type name to look up (e.g. "inject", "function", "http in")'),
    },
    async (params) => handleGetNodeTypeDetail(nodeRedClient, params),
    { annotations: getNodeTypeDetailDefinition.annotations, outputSchema: getNodeTypeDetailDefinition.outputSchema },
  );

  // Register: create-flow
  server.tool(
    'create-flow',
    'Create a new Node-RED flow tab with the given label and optional properties (staged — call `deploy` to apply). ' +
    'Returns the new flow\'s ID and the full current state. ' +
    'Use this to add a new empty flow tab before creating nodes inside it. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Delete an existing Node-RED flow tab by ID (staged — call `deploy` to apply). ' +
    'Returns the full previous state (including nodes) for undo support. ' +
    'Refuses to delete a locked flow. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
    {
      flowId: z.string().describe('ID of the flow tab to delete'),
    },
    async (params) => handleDeleteFlow(staging, params),
    { annotations: deleteFlowDefinition.annotations, outputSchema: deleteFlowDefinition.outputSchema },
  );

  // Register: update-flow
  server.tool(
    'update-flow',
    'Update metadata fields (label, disabled, info, env) of an existing Node-RED flow tab (staged — call `deploy` to apply). ' +
    'Nodes inside the flow are left unchanged. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a locked flow. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Shallow-merge a properties object onto an existing Node-RED node\'s configuration in the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'IMPORTANT: Do NOT include `wires` in properties — wiring is managed exclusively by connect-nodes and disconnect-nodes. ' +
    'To wire a node after creating it: call connect-nodes with fromNodeId and toNodeId. ' +
    'Fields in properties overwrite the matching node fields; fields not mentioned are preserved. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a node in a locked flow. ' +
    '� COMMON PROPERTIES: All nodes accept `name` (label) and `info` (Description field in the Node-RED editor UI). ' +
    'When a user says "add a description to this node" or "describe what this node does", set `info`. ' +
    'Example: `properties: { info: "Pings the main server every 30 seconds" }`. ' +
    '�🔑 CREDENTIALS: For config nodes (mqtt-broker, http-proxy, tls-config, etc.), put credential fields ' +
    '(username, password, key, cert, token) inside a `credentials` object: ' +
    'e.g. `properties: { broker: "localhost", credentials: { username: "user", password: "pass" } }`. ' +
    'The tool auto-detects and nests credential fields correctly. Partial updates are supported — ' +
    'only send the credential fields you want to change; unspecified ones are preserved.',
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
    'Add a wire from a node output port to a target node in the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'Idempotent — if the wire already exists, returns success without re-deploying. ' +
    'Pads the source node\'s wires array if the requested output port does not exist yet. ' +
    'Returns previousWires and currentWires for the source node. ' +
    'Use this after create-node to connect the new node into the flow. ' +
    'Refuses to wire nodes in a locked flow. ' +
    'BATCH MODE: Provide optional `connections` array with `{ outputPort, toNodeId }` objects to wire multiple ' +
    'output ports in a single call. When `connections` is provided, `outputPort` and `toNodeId` are ignored. ' +
    'Example batch: `connections: [{ outputPort: 0, toNodeId: "n1" }, { outputPort: 1, toNodeId: "n2" }]`.',
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
    'Remove wires from a node output port in the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'Supports three modes: ' +
    '(1) SINGLE: provide `toNodeId` to remove one specific wire; ' +
    '(2) CLEAR-PORT: set `clearPort: true` (omit `toNodeId`) to clear all wires from `outputPort`; ' +
    '(3) BATCH: provide `connections` array of `{ outputPort, toNodeId }` to remove multiple wires at once. ' +
    'In single mode, returns an error if the wire does not exist. ' +
    'In clear-port mode, returns success without deploying if the port is already empty. ' +
    'In batch mode, validates all wires exist before removing any (atomic). ' +
    'Returns previousWires and currentWires for the source node. ' +
    'When `connections` is provided, `toNodeId`, `clearPort`, and `outputPort` are ignored. ' +
    'Refuses to modify nodes in a locked flow.',
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
    'Create a new node of any installed palette type inside a specified Node-RED flow in the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'Generates a unique ID for the node. ' +
    'Use the optional `properties` object to set type-specific configuration fields (e.g. func, url, method). ' +
    'The `id`, `z`, and `wires` fields in `properties` are silently ignored — the tool controls them. ' +
    'Returns nodeId and currentState. ' +
    'IMPORTANT — after creating a node, you MUST wire it manually using connect-nodes and disconnect-nodes. ' +
    'Creating a node does NOT connect it to anything. ' +
    'To INSERT a node between A and B: (1) create-node to get newId, (2) disconnect-nodes A→B, (3) connect-nodes A→newId, (4) connect-nodes newId→B. ' +
    'Skipping steps 2-4 will leave the new node isolated and the original flow broken. ' +
    'Refuses to create in a locked flow. ' +
    '� DEBUG TIP: When building a new flow, add a `debug` node after each processing node and deploy+inject to verify outputs step-by-step before adding more nodes. ' +
    '🔑 CREDENTIALS: For config node types (mqtt-broker, http-proxy, tls-config, websocket-listener, etc.), ' +
    'put credential fields inside a `credentials` object within properties: ' +
    'e.g. `properties: { broker: \"localhost\", port: 1883, credentials: { username: \"user\", password: \"pass\" } }`. ' +
    'The tool auto-detects and nests credential fields correctly even if sent at the top level. ' +
    '📐 LAYOUT: For proper node positioning and spacing rules (horizontal/vertical gaps, ' +
    'debug placement, branch-point centering, group layout), see the `nodered-flow-layout` skill. ' +
    'Always start the first node at (x=120, y=80) unless a group header is present.',
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
    'Remove an existing node from a Node-RED flow by its ID in the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'Node-RED automatically cleans up any dangling wire references to the deleted node on deploy. ' +
    'Returns nodeId and previousState (the full node object before deletion) for review or recovery. ' +
    'Refuses to delete a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to delete'),
    },
    async (params) => handleDeleteNode(staging, nodeRedClient, params),
    { annotations: deleteNodeDefinition.annotations, outputSchema: deleteNodeDefinition.outputSchema },
  );

  // Register: export-flow
  server.tool(
    'export-flow',
    'Export a Node-RED flow or selection of nodes as a JSON array string that can be passed to import-flow. ' +
    'Two export modes are supported: ' +
    '"flow" (default) exports a full tab — the tab node, all its child nodes, and any referenced config nodes. ' +
    'If flowId is omitted in flow mode, all nodes in the instance are exported. ' +
    '"nodes" exports a specific selection of nodes by nodeIds, trimming wires to targets outside the selection. ' +
    'Use this to back up a flow before editing, share it with the user, or pass it to import-flow to duplicate or migrate a flow.',
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
    'Import a Node-RED flow JSON into the staging area. ' +
    'Changes are NOT deployed to Node-RED until you call the `deploy` tool. ' +
    'Accepts a JSON array string (Node-RED export format) or a JSON object with a `nodes` array. ' +
    'WARNING: All flows are redeployed on import, which briefly interrupts any running flows. ' +
    'Two conflict strategies are supported: ' +
    '"regenerate" (default) remaps all node IDs to new UUIDs — always safe, creates a duplicate. ' +
    '"overwrite" replaces existing nodes whose IDs match the imported JSON — use to apply an updated version of a flow. ' +
    'Optional `targetFlowId`: when provided, all non-tab nodes are injected into that existing flow tab ' +
    '(tab nodes in the JSON are discarded and their children are remapped to the target). ' +
    'Returns a summary: `{ imported: { flows, nodes, configNodes }, conflicts, strategy, targetFlowId }`. ' +
    'Use export-flow to obtain the flowJson string from this or another Node-RED instance.',
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
    'Read a context variable from a Node-RED node, flow, or global context scope. ' +
    'Single-key mode (key provided): returns { "<key>": <value> } — e.g. { "counter": 42 }. ' +
    'All-keys mode (no key): returns a JSON object with all key-value pairs — e.g. { "counter": 42, "config": {} }. ' +
    'Use scope="global" to access global context (no id needed). ' +
    'Use scope="flow" with a flowId to access flow-scoped context. ' +
    'Use scope="node" with a nodeId to access node-scoped context. ' +
    'If the key does not exist, value is returned as null (not an error). ' +
    'WARNING: In-memory context values are lost when Node-RED restarts.',
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
    'Delete a context variable from a Node-RED node, flow, or global context scope. ' +
    'Use scope="global" to delete from global context (no id needed). ' +
    'Use scope="flow" with a flowId to delete from flow-scoped context. ' +
    'Use scope="node" with a nodeId to delete from node-scoped context. ' +
    'Returns { scope, id?, key, deleted: true } on success. ' +
    'Note: The Node-RED Admin API does not support writing context values directly — ' +
    'use a function node with flow.set() / global.set() if you need to write context.',
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
    'Deep-search all regular nodes across all flows (or a single flow via flowId) with a single query string. ' +
    'Serializes each node with JSON.stringify and matches the query against the resulting string. ' +
    'Plain text mode (default, regex: false) is case-insensitive substring matching. ' +
    'Regex mode (regex: true) treats the query as a JavaScript regex pattern. ' +
    'Each result includes flowId, flowLabel, nodeId, type, name, x, and y. ' +
    'Use this to find nodes by name, type, property value, function body content, or any other field.',
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
    'Trigger an inject node in the running Node-RED instance by node ID or by name (optionally scoped to a flow). ' +
    'The target node MUST be an inject node. ' +
    '⚠️ You MUST call `deploy` BEFORE `inject-message` — undeployed changes are not active and inject will fail. ' +
    'Use `read-debug-messages` to observe the results of the injected message. ' +
    'If multiple inject nodes share the same name, an error is returned listing the matching IDs — use nodeId to disambiguate.',
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
    'Install a new Node-RED node module from the npm registry via the Admin API\'s POST /nodes endpoint. ' +
    'Accepts a plain npm package name (no @version qualifiers — the API does not support them via JSON body). ' +
    'Intended workflow: the LLM discovers a suitable package from the Node-RED library catalog (https://flows.nodered.org/search?type=node), ' +
    'the user selects one, and this tool installs it. ' +
    'Returns the Node Module object with name, version, and the list of installed node types. ' +
    'Note: installation may take 10-30+ seconds for large packages. Some nodes may require a Node-RED restart for full activation.',
    {
      module: z.string().describe('npm package name to install (plain name, no @version), e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleInstallNode(nodeRedClient, params),
    { annotations: installNodeDefinition.annotations, outputSchema: installNodeDefinition.outputSchema },
  );

  // Register: uninstall-node
  server.tool(
    'uninstall-node',
    'Uninstall a Node-RED node module from the running instance via the Admin API\'s DELETE /nodes/:module endpoint. ' +
    'The `module` parameter is the module identifier as shown in get-palette-nodes (e.g., "node-red-node-suncalc"). ' +
    'Use get-palette-nodes to discover installed modules. ' +
    'WARNING: Uninstalling a module removes its node types from ALL flows. Nodes of those types will be lost. ' +
    'If unsure, export your flows with export-flow before uninstalling. ' +
    'Returns { uninstalled: true, module } on success.',
    {
      module: z.string().describe('Module identifier to uninstall, as shown in get-palette-nodes, e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleUninstallNode(nodeRedClient, params),
    { annotations: uninstallNodeDefinition.annotations, outputSchema: uninstallNodeDefinition.outputSchema },
  );

  // Register: add-nodes-to-group
  server.tool(
    'add-nodes-to-group',
    'Add nodes to a Node-RED group (staged — call `deploy` to apply). If the group does not exist, it is created ' +
    'with a bounding rectangle that encloses all specified nodes. ' +
    'Nodes already in another group are automatically reassigned. ' +
    'Returns the groupId, whether the group was newly created, and the final bounding box. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Remove nodes from a Node-RED group (staged — call `deploy` to apply). If no specific node IDs are provided, ' +
    'all members are removed. Optionally repositions removed nodes outside the ' +
    'group\'s bounding rectangle. Nodes not in the group are silently skipped. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Update a Node-RED group\'s metadata: name, style (colors, label position), ' +
    'or bounding box dimensions (staged — call `deploy` to apply). Validates that the target is a group node. ' +
    'Returns previous and current state for undo support. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    'Delete a Node-RED group (staged — call `deploy` to apply). By default, all member nodes are also deleted. ' +
    'Set deleteMembers to false to keep the nodes and only delete the group rectangle. ' +
    'Returns the full previous state (group + members) for undo support. ' +
    '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.',
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
    '🚨 CRITICAL — Deploy all staged (undeployed) flow changes to the Node-RED runtime. ' +
    'NO write operation (create-node, connect-nodes, update-node, etc.) takes effect until you call this tool. ' +
    'If you forget to deploy, your edits are lost — they only exist in the staging area. ' +
    'Supports three deploy types: "full" (restarts everything), "flows" (restarts only modified flow tabs), ' +
    'and "nodes" (default — restarts only modified nodes, least disruptive). ' +
    'Best practice: batch several edits (e.g. create 3 nodes + wire them), then deploy once. ' +
    'After deploy, always check the response to confirm `staging.deployed === true`. ' +
    'If there are no pending changes, returns success immediately. ' +
    'On version mismatch (409), throws an error — your staged changes are discarded and you must re-read and re-apply. ' +
    'Use get-staging-status to inspect pending changes before deploying.',
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
    'Get the current staging state: pending change count, dirty node IDs, dirty flow IDs, ' +
    'and whether the staging is deployed (no pending changes). ' +
    'Use this to inspect what changes are pending before deploying, ' +
    'or to verify that a deploy was successful.',
    {},
    async () => handleGetStagingStatus(staging)(),
    { annotations: getStagingStatusDefinition.annotations, outputSchema: getStagingStatusDefinition.outputSchema },
  );

  // Register: refresh-staging
  server.tool(
    'refresh-staging',
    '🔄 MUST CALL FIRST before any editing session. Discards ALL un-deployed staged changes and ' +
    're-fetches the latest flow state from the Node-RED backend (GET /flows), ensuring the staging ' +
    'store is synchronized with the server. Use this at the START of every editing workflow — before ' +
    'any create, update, delete, or import operations. Without this, stale staging state can cause ' +
    'version mismatch errors (HTTP 409) on deploy, which will discard ALL your staged work. ' +
    'Also use when flows have been modified externally (e.g., via the Node-RED editor UI) and the ' +
    'MCP staging state is out of sync. Returns the previous staging state (what was discarded) and ' +
    'the new staging state (confirming sync). Any edits made via MCP tools that were NOT yet ' +
    'deployed will be permanently lost. Use get-staging-status first to review what would be discarded.',
    {},
    async () => handleRefreshStaging(staging)(),
    { annotations: refreshStagingDefinition.annotations, outputSchema: refreshStagingDefinition.outputSchema },
  );

  // Register: read-debug-messages
  if (commsClient) {
    server.tool(
      'read-debug-messages',
      'Read buffered debug messages from the connected Node-RED instance. ' +
      'Messages are captured in real time from the /comms WebSocket and stored in an in-memory ring buffer. ' +
      'Use this to observe the output of debug nodes after triggering a flow with inject-message. ' +
      'All filter parameters are optional — combine them to narrow results. ' +
      'The `last` and `limit` parameters are mutually exclusive.',
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

  // Register MCP Prompts — one per skill
  for (const [skillName, skill] of skills) {
    server.prompt(
      skillName,
      skill.description,
      {},
      async () => ({
        messages: [{
          role: 'user',
          content: { type: 'text', text: skill.content },
        }],
      }),
    );
  }

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

  // Register: list-skills tool
  server.tool(
    'list-skills',
    'List all available Node-RED skills with their names and descriptions. ' +
    'Call this FIRST to discover what skills exist, then use get-skill with the desired skill name ' +
    'to retrieve its full content.',
    {},
    async () => {
      const skillList = [...skills].map(([name, s]) => ({
        name,
        description: s.description,
      }));
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(skillList),
        }],
      };
    },
  );

  // Register: get-skill tool
  server.tool(
    'get-skill',
    'MUST call this BEFORE building any Node-RED flows. ' +
    'Use this tool to retrieve domain-specific guidance, best practices, patterns, ' +
    'and reference material for building Node-RED flows. ' +
    'Call it with a skill name (e.g. "nodered-flow-builder") to get the full skill content. ' +
    'Use list-skills FIRST to discover the available skill names.',
    {
      topic: z.string().describe('The skill topic/name to retrieve. Use list-skills to see available values (e.g. "nodered-flow-builder", "nodered-node-reference")'),
    },
    async (params) => {
      const skill = skills.get(params.topic);
      if (!skill) {
        const available = [...skills.keys()].join(', ');
        return {
          content: [{
            type: 'text',
            text: `Skill "${params.topic}" not found. Available skills: ${available || '(none)'}`,
          }],
        };
      }
      return {
        content: [{
          type: 'text',
          text: skill.content,
        }],
      };
    },
  );

  // ── Render-staging tool ────────────────────────────────────────────

  server.tool(
    'render-staging',
    'Render the current staging workspace as SVG, HTML, or Mermaid format. ' +
    'SVG shows real node positions, bezier wire curves, and type-specific colors embeddable in chat. ' +
    'HTML is an interactive browser page with D3.js zoom/pan/tooltips and live WebSocket refresh. ' +
    'Mermaid produces a topology diagram. ' +
    'The highlightDirty option (default true) draws un-deployed nodes with an orange border.',
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
