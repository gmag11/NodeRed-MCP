/**
 * MCP Server definition.
 *
 * Creates and configures the McpServer instance with all registered tools.
 * Transport-agnostic: the caller decides how to connect it.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { handleGetFlows } from './tools/get-flows.js';

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

  return server;
}
