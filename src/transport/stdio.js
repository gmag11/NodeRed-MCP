/**
 * stdio transport for the MCP server.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Start the MCP server using stdio transport.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export async function startStdioTransport(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[nodered-mcp] Server running on stdio transport');
}
