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

  return server;
}
