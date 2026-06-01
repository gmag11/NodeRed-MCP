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
    'Fields in properties overwrite the matching node fields; fields not mentioned are preserved. ' +
    'The `wires` field is explicitly forbidden — use connect-nodes or disconnect-nodes to manage wiring. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to update'),
      properties: z.record(z.unknown()).describe('Properties to shallow-merge onto the node (wires not allowed)'),
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
    'Refuses to modify nodes in a locked flow.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0)'),
      toNodeId: z.string().describe('ID of the target node whose wire to remove'),
    },
    async (params) => handleDisconnectNodes(nodeRedClient, params),
  );

  return server;
}
