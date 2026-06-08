/**
 * Streamable HTTP transport for the MCP server.
 */

import express from 'express';
import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { WSServer } from './ws-server.js';
import { buildHTML } from '../renderer/html-builder.js';
import { buildIR } from '../renderer/ir-builder.js';

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

  // ── Staging snapshot endpoint ─────────────────────────────────────

  // Track the most recently created staging store for WebSocket/snapshot
  let activeStaging = null;

  app.get('/staging-snapshot', async (_req, res) => {
    try {
      if (!activeStaging) {
        res.json({ flows: [], dirtyNodeIds: [], dirtyFlowIds: [] });
        return;
      }
      const flows = await activeStaging.getFlows();
      const dirtyNodeIds = [...activeStaging.getDirtyNodeIds()];
      const dirtyFlowIds = [...activeStaging.getDirtyFlowIds()];
      res.json({ flows, dirtyNodeIds, dirtyFlowIds });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Staging visualization HTML endpoint ───────────────────────────

  app.get('/staging', async (_req, res) => {
    try {
      if (!activeStaging) {
        res.type('html').send('<html><body><h2>No staging session active yet</h2><p>Make a request to the MCP first to initialize staging.</p></body></html>');
        return;
      }
      const flows = await activeStaging.getFlows();
      const dirtyNodeIds = activeStaging.getDirtyNodeIds();
      const dirtyFlowIds = activeStaging.getDirtyFlowIds();
      const ir = buildIR(flows, { highlightDirty: true, dirtyNodeIds, dirtyFlowIds });
      const html = buildHTML(ir);
      res.type('html').send(html);
    } catch (err) {
      res.status(500).type('html').send(`<html><body><h2>Error</h2><pre>${err.message}</pre></body></html>`);
    }
  });

  // ── WebSocket server ──────────────────────────────────────────────

  const wsServer = new WSServer();

  // ── Create HTTP server explicitly for WebSocket upgrade support ────

  const httpServer = http.createServer(app);

  wsServer.attach(httpServer, async () => {
    if (!activeStaging) return { flows: [], dirtyNodeIds: new Set(), dirtyFlowIds: new Set() };
    const flows = await activeStaging.getFlows();
    return { flows, dirtyNodeIds: activeStaging.getDirtyNodeIds(), dirtyFlowIds: activeStaging.getDirtyFlowIds() };
  });

  // ── Start listening ────────────────────────────────────────────────

  httpServer.listen(port, () => {
    console.error(`[nodered-mcp] Server running on HTTP transport at http://localhost:${port}/mcp`);
    console.error(`[nodered-mcp] Staging viewer: http://localhost:${port}/staging`);
    console.error(`[nodered-mcp] WebSocket endpoint: ws://localhost:${port}/staging-ws`);
  });

  // ── MCP POST handler with staging capture for WebSocket/snapshot ──
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

        // Capture staging for WebSocket/snapshot
        if (server.__staging) {
          activeStaging = server.__staging;

          // Subscribe to staging changes → broadcast via WebSocket
          server.__staging.on('staging:changed', () => {
            if (activeStaging === server.__staging) {
              const dirtyNodeIds = server.__staging.getDirtyNodeIds();
              const dirtyFlowIds = server.__staging.getDirtyFlowIds();
              // We need to get flows - schedule async broadcast
              server.__staging.getFlows().then((flows) => {
                wsServer.broadcast({ flows, dirtyNodeIds, dirtyFlowIds });
              }).catch(() => { /* ignore */ });
            }
          });
        }
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
}
