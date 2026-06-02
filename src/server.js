/**
 * MCP Server definition.
 *
 * Creates and configures the McpServer instance with all registered tools.
 * Transport-agnostic: the caller decides how to connect it.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { handleGetFlows } from './tools/get-flows.js';
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

/**
 * Create a configured MCP server with all tools registered.
 *
 * @param {ReturnType<import('./nodered/client.js').createNodeRedClient>} nodeRedClient
 * @returns {McpServer}
 */
export function createMcpServer(nodeRedClient) {
  const server = new McpServer({
    name: 'nodered-mcp-server',
    version: '0.1.0',
  });

  // Register: get-flows
  server.tool(
    'get-flows',
    'Get a summarized list of all flows (tabs and subflows) from the Node-RED instance. ' +
    'Returns each flow\'s id, label, enabled/disabled status, node count, and the types of nodes it contains. ' +
    'Use this to understand what flows exist and what they do at a glance.',
    {},
    async () => handleGetFlows(nodeRedClient),
  );

  // Register: get-flow-nodes
  server.tool(
    'get-flow-nodes',
    'Get a detailed, paginated list of nodes within a specific Node-RED flow. ' +
    'Returns each node\'s id, type, name, disabled state, position (x/y), wires (connections), and sanitized configuration. ' +
    'Large text fields (func, template, format, html, css) are excluded to save context. ' +
    'Supports filtering by disabled state, node type, and connected subgraph (upstream/downstream from a specific node). ' +
    'Use offset/limit for pagination on large flows.',
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
    async (params) => handleGetFlowNodes(nodeRedClient, params),
  );

  // Register: get-flow-diagram
  server.tool(
    'get-flow-diagram',
    'Get a Mermaid flowchart diagram (flowchart TD) representing the topology of a Node-RED flow. ' +
    'Shows node names/types as labeled boxes connected by wires. ' +
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
    async (params) => handleGetFlowDiagram(nodeRedClient, params),
  );

  // Register: get-config-nodes
  server.tool(
    'get-config-nodes',
    'Get a paginated list of global configuration nodes from the Node-RED instance. ' +
    'Configuration nodes (e.g. mqtt-broker, tls-config, http-proxy) are shared resources used by flow nodes but not tied to any specific flow. ' +
    'Returns each config node\'s id, type, name, and sanitized configuration. ' +
    'Supports filtering by node type and pagination.',
    {
      nodeType: z.string().optional().describe('Filter to config nodes of this type (e.g. "mqtt-broker")'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max config nodes to return (default 50, max 200)'),
    },
    async (params) => handleGetConfigNodes(nodeRedClient, params),
  );

  // Register: get-node-detail
  server.tool(
    'get-node-detail',
    'Get the full detail of a single Node-RED node by its ID. ' +
    'Returns all node fields including large text fields (func, template, format, html, css) ' +
    'that are intentionally excluded from get-flow-nodes to save context. ' +
    'Use this when you need to read the actual logic or content of a specific node (e.g. a function node\'s JavaScript code or a template node\'s markup).',
    {
      nodeId: z.string().describe('ID of the node to retrieve'),
    },
    async (params) => handleGetNodeDetail(nodeRedClient, params),
  );

  // Register: get-palette-nodes
  server.tool(
    'get-palette-nodes',
    'Get a paginated list of all node types available in the Node-RED palette. ' +
    'Returns each type name, its module, version, category, and enabled state. ' +
    'Results are sorted alphabetically by type name. ' +
    'Use page and pageSize to iterate through large palettes. ' +
    'Use this to discover what node types are installed before building or auditing flows.',
    {
      page: z.number().int().min(1).optional().default(1).describe('Page number (1-based, default 1)'),
      pageSize: z.number().int().min(1).max(200).optional().default(50).describe('Items per page (default 50, max 200)'),
    },
    async (params) => handleGetPaletteNodes(nodeRedClient, params),
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
  );

  // Register: create-flow
  server.tool(
    'create-flow',
    'Create a new Node-RED flow tab with the given label and optional properties. ' +
    'Returns the new flow\'s ID and the full current state as returned by Node-RED. ' +
    'Use this to add a new empty flow tab before creating nodes inside it.',
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
    async (params) => handleCreateFlow(nodeRedClient, params),
  );

  // Register: delete-flow
  server.tool(
    'delete-flow',
    'Delete an existing Node-RED flow tab by ID. ' +
    'Fetches the full flow state (including all its nodes) before deletion and returns it as previousState. ' +
    'Use previousState to undo the deletion if needed. ' +
    'Refuses to delete a locked flow.',
    {
      flowId: z.string().describe('ID of the flow tab to delete'),
    },
    async (params) => handleDeleteFlow(nodeRedClient, params),
  );

  // Register: update-flow
  server.tool(
    'update-flow',
    'Update metadata fields (label, disabled, info, env) of an existing Node-RED flow tab. ' +
    'Nodes inside the flow are left unchanged. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a locked flow.',
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
    async (params) => handleUpdateFlow(nodeRedClient, params),
  );

  // Register: update-node
  server.tool(
    'update-node',
    'Shallow-merge a properties object onto an existing Node-RED node\'s configuration and deploy immediately. ' +
    'IMPORTANT: Do NOT include `wires` in properties — wiring is managed exclusively by connect-nodes and disconnect-nodes. ' +
    'To wire a node after creating it: call connect-nodes with fromNodeId and toNodeId. ' +
    'Fields in properties overwrite the matching node fields; fields not mentioned are preserved. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to update'),
      properties: z.record(z.unknown()).describe('Properties to shallow-merge onto the node — must NOT include wires; use connect-nodes to add connections'),
    },
    async (params) => handleUpdateNode(nodeRedClient, params),
  );

  // Register: connect-nodes
  server.tool(
    'connect-nodes',
    'Add a wire from a node output port to a target node and deploy immediately. ' +
    'Idempotent — if the wire already exists, returns success without re-deploying. ' +
    'Pads the source node\'s wires array if the requested output port does not exist yet. ' +
    'Returns previousWires and currentWires for the source node. ' +
    'Use this after create-node to connect the new node into the flow. ' +
    'Refuses to wire nodes in a locked flow.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0)'),
      toNodeId: z.string().describe('ID of the target node to wire to'),
    },
    async (params) => handleConnectNodes(nodeRedClient, params),
  );

  // Register: disconnect-nodes
  server.tool(
    'disconnect-nodes',
    'Remove a wire from a node output port to a target node and deploy immediately. ' +
    'Returns an error if the wire does not exist. ' +
    'Returns previousWires and currentWires for the source node. ' +
    'Use this when inserting a node between two existing nodes: disconnect the old wire first, then connect via the new node. ' +
    'Refuses to modify nodes in a locked flow.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0)'),
      toNodeId: z.string().describe('ID of the target node whose wire to remove'),
    },
    async (params) => handleDisconnectNodes(nodeRedClient, params),
  );

  // Register: create-node
  server.tool(
    'create-node',
    'Create a new node of any installed palette type inside a specified Node-RED flow and deploy immediately. ' +
    'Generates a unique ID for the node. ' +
    'Use the optional `properties` object to set type-specific configuration fields (e.g. func, url, method). ' +
    'The `id`, `z`, and `wires` fields in `properties` are silently ignored — the tool controls them. ' +
    'Returns nodeId and currentState. ' +
    'IMPORTANT — after creating a node, you MUST wire it manually using connect-nodes and disconnect-nodes. ' +
    'Creating a node does NOT connect it to anything. ' +
    'To INSERT a node between A and B: (1) create-node to get newId, (2) disconnect-nodes A→B, (3) connect-nodes A→newId, (4) connect-nodes newId→B. ' +
    'Skipping steps 2-4 will leave the new node isolated and the original flow broken. ' +
    'Refuses to create in a locked flow.',
    {
      type: z.string().describe('Palette node type to create (e.g. "function", "debug", "http in")'),
      flowId: z.string().describe('ID of the flow tab or subflow to place the node in'),
      properties: z.record(z.unknown()).optional().describe('Type-specific configuration fields to set on the new node'),
      x: z.number().optional().default(200).describe('X canvas position (default 200)'),
      y: z.number().optional().default(200).describe('Y canvas position (default 200)'),
    },
    async (params) => handleCreateNode(nodeRedClient, params),
  );

  // Register: delete-node
  server.tool(
    'delete-node',
    'Remove an existing node from a Node-RED flow by its ID and deploy immediately. ' +
    'Node-RED automatically cleans up any dangling wire references to the deleted node on deploy. ' +
    'Returns nodeId and previousState (the full node object before deletion) for review or recovery. ' +
    'Refuses to delete a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to delete'),
    },
    async (params) => handleDeleteNode(nodeRedClient, params),
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
    async (params) => handleExportFlowJson(nodeRedClient, params),
  );

  // Register: import-flow
  server.tool(
    'import-flow',
    'Import a Node-RED flow JSON into the running instance and redeploy all flows. ' +
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
    async (params) => handleImportFlow(nodeRedClient, params),
  );

  return server;
}
