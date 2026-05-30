/**
 * Streamable HTTP transport for the MCP server.
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

/**
 * Start the MCP server using Streamable HTTP transport via Express.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {number} port
 */
export async function startHttpTransport(server, port) {
  const app = express();
  app.use(express.json());

  // Map of sessionId -> transport
  const transports = {};

  app.post('/mcp', async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'] || randomUUID();
      let transport = transports[sessionId];

      if (!transport) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });
        transports[sessionId] = transport;
        await server.connect(transport);
      }

      await transport.handleRequest(req, res);
    } catch (err) {
      console.error('[nodered-mcp] HTTP transport error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({ error: 'Missing or invalid session ID' });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId && transports[sessionId]) {
      await transports[sessionId].close();
      delete transports[sessionId];
    }
    res.status(200).end();
  });

  app.listen(port, () => {
    console.error(`[nodered-mcp] Server running on HTTP transport at http://localhost:${port}/mcp`);
  });
}
