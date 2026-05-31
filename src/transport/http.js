/**
 * Streamable HTTP transport for the MCP server.
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';

/**
 * Start the MCP server using Streamable HTTP transport via Express.
 *
 * @param {() => import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} serverFactory
 * @param {number} port
 */
export async function startHttpTransport(serverFactory, port) {
  const app = express();
  app.use(express.json());

  // Map of sessionId -> transport
  const transports = {};

  // Log every incoming request
  app.use('/mcp', (req, _res, next) => {
    const sid = req.headers['mcp-session-id'] || '(none)';
    const accept = req.headers['accept'] || '(none)';
    console.error(`[nodered-mcp] ${req.method} /mcp  session=${sid}  accept=${accept}  bodyType=${typeof req.body}`);
    next();
  });

  app.post('/mcp', async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'] || randomUUID();
      const isNew = !transports[sessionId];
      let transport = transports[sessionId];

      if (isNew) {
        console.error(`[nodered-mcp] New session: ${sessionId}`);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });
        transports[sessionId] = transport;
        const server = serverFactory();
        await server.connect(transport);
        console.error(`[nodered-mcp] Session ${sessionId} connected`);
      }

      const method = req.body?.method ?? '(notification/unknown)';
      console.error(`[nodered-mcp] → ${method}  session=${sessionId}`);

      await transport.handleRequest(req, res, req.body);

      console.error(`[nodered-mcp] ← ${method} responded  status=${res.statusCode}`);
    } catch (err) {
      console.error('[nodered-mcp] HTTP transport error:', err.message);
      console.error(err.stack);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
      console.error(`[nodered-mcp] GET /mcp rejected - unknown session: ${sessionId}`);
      res.status(400).json({ error: 'Missing or invalid session ID' });
      return;
    }
    console.error(`[nodered-mcp] GET /mcp SSE stream opened  session=${sessionId}`);
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId && transports[sessionId]) {
      console.error(`[nodered-mcp] Session closed: ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    }
    res.status(200).end();
  });

  app.listen(port, () => {
    console.error(`[nodered-mcp] Server running on HTTP transport at http://localhost:${port}/mcp`);
  });
}
