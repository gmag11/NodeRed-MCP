/**
 * Streamable HTTP transport for the MCP server.
 */

import express from 'express';
import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { randomUUID } from 'node:crypto';
import { WSServer } from './ws-server.js';
import { buildHTML } from '../renderer/html-builder.js';
import { createCompositeVerifier } from '../auth/composite-verifier.js';

/**
 * Start the MCP server using Streamable HTTP transport via Express.
 *
 * @param {() => import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} serverFactory
 * @param {number} port
 * @param {import('../staging-store.js').StagingStore} [initialStaging] - eagerly-loaded staging for the viewer/WS
 * @param {object} [authOptions] - Authentication configuration
 * @param {string|null} [authOptions.apiKey] - API key for Bearer token auth
 * @param {import('../auth/oauth-provider.js').OAuthProvider} [authOptions.oauthProvider] - OAuth provider (when OAuth is enabled)
 * @param {string} [authOptions.oauthIssuerUrl] - Base issuer URL for OAuth
 */
export async function startHttpTransport(serverFactory, port, initialStaging, authOptions) {
  const app = express();
  app.use(express.json());

  // Map of sessionId -> transport
  const transports = {};

  // ── Authentication middleware ─────────────────────────────────────

  const hasAuth = !!(authOptions?.apiKey || authOptions?.oauthProvider);

  if (hasAuth) {
    // Build the composite verifier: API key first, then OAuth
    const verifier = createCompositeVerifier({
      apiKey: authOptions.apiKey,
      oauthVerifier: authOptions.oauthProvider || null,
    });

    // Determine resource metadata URL for WWW-Authenticate header
    const resourceMetadataUrl = authOptions.oauthProvider && authOptions.oauthIssuerUrl
      ? getOAuthProtectedResourceMetadataUrl(new URL('/mcp', authOptions.oauthIssuerUrl))
      : undefined;

    const authMiddleware = requireBearerAuth({
      verifier,
      requiredScopes: [],
      resourceMetadataUrl,
    });

    // Apply auth BEFORE the logging middleware so unauthorized requests
    // are rejected early. The SDK middleware handles 401/403 responses.
    app.use('/mcp', authMiddleware);
  }

  // Log every incoming request (runs after auth middleware if active)
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
  let activeStaging = initialStaging || null;

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

  // ── Staging refresh endpoint (re-fetches from Node-RED backend) ───

  app.post('/staging-refresh', async (_req, res) => {
    try {
      if (!activeStaging) {
        res.status(503).json({ error: 'No staging session active yet' });
        return;
      }
      await activeStaging.invalidate();
      await activeStaging.ensureLoaded();
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
      const html = buildHTML(flows, { highlightDirty: true, dirtyNodeIds, dirtyFlowIds });
      res.type('html').send(html);
    } catch (err) {
      res.status(500).type('html').send(`<html><body><h2>Error</h2><pre>${err.message}</pre></body></html>`);
    }
  });

  // ── OAuth 2.0 authorization server (optional) ─────────────────────

  if (authOptions?.oauthProvider && authOptions?.oauthIssuerUrl) {
    const issuerUrl = new URL(authOptions.oauthIssuerUrl);

    // Mount the full OAuth authorization server router
    const authRouter = mcpAuthRouter({
      provider: authOptions.oauthProvider,
      issuerUrl,
      baseUrl: issuerUrl, // Authorization server is at the same origin
      scopesSupported: ['*'],
      resourceName: 'Node-RED MCP Server',
    });

    app.use(authRouter);

    console.error(`[nodered-mcp] OAuth authorization server mounted at ${issuerUrl.href}`);
    console.error(`[nodered-mcp] OAuth discovery: ${issuerUrl.href}.well-known/oauth-authorization-server`);
  }

  // ── WebSocket server ──────────────────────────────────────────────

  const wsServer = new WSServer();

  // ── Create HTTP server explicitly for WebSocket upgrade support ────

  const httpServer = http.createServer(app);

  wsServer.attach(httpServer, async () => {
    if (!activeStaging) return { flows: [], dirtyNodeIds: new Set(), dirtyFlowIds: new Set() };
    const flows = await activeStaging.getFlows();
    return { flows, dirtyNodeIds: activeStaging.getDirtyNodeIds(), dirtyFlowIds: activeStaging.getDirtyFlowIds() };
  });

  // If we have an eagerly-loaded staging, subscribe to changes for WebSocket broadcast
  if (initialStaging) {
    initialStaging.on('staging:changed', () => {
      if (activeStaging === initialStaging) {
        initialStaging.getFlows().then((flows) => {
          wsServer.broadcast({
            flows,
            dirtyNodeIds: initialStaging.getDirtyNodeIds(),
            dirtyFlowIds: initialStaging.getDirtyFlowIds(),
          });
        }).catch(() => { /* ignore */ });
      }
    });
  }

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
        const server = await serverFactory();
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
