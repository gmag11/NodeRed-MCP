#!/usr/bin/env node

/**
 * Entry point for the Node-RED MCP server.
 *
 * Usage:
 *   node index.js                          → stdio (default)
 *   node index.js --transport=stdio        → stdio
 *   node index.js --transport=http         → HTTP on port 3000
 *   node index.js --transport=http --port=8080
 */

import 'dotenv/config';
import { AuthManager } from './src/nodered/auth.js';
import { createNodeRedClient } from './src/nodered/client.js';
import { CommsClient } from './src/nodered/comms-client.js';
import { createMcpServer } from './src/server.js';
import { startStdioTransport } from './src/transport/stdio.js';
import { startHttpTransport } from './src/transport/http.js';
import { loadAuthConfig } from './src/auth/config.js';

// --- Parse CLI arguments ---

function parseArgs(argv) {
  const args = { transport: 'stdio', port: 3000 };

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--transport=')) {
      args.transport = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      args.port = parseInt(arg.split('=')[1], 10);
    }
  }

  return args;
}

// --- Main ---

async function main() {
  const args = parseArgs(process.argv);

  // Validate required configuration
  const baseUrl = process.env.NODERED_URL;
  if (!baseUrl) {
    console.error('Error: NODERED_URL environment variable is required.');
    console.error('Set it in your .env file or environment. Example: NODERED_URL=http://localhost:1880');
    process.exit(1);
  }

  // Initialize authentication
  const authManager = new AuthManager({
    baseUrl,
    username: process.env.NODERED_USERNAME,
    password: process.env.NODERED_PASSWORD,
    apiKey: process.env.NODERED_API_KEY,
  });

  await authManager.init();
  console.error(`[nodered-mcp] Connected to ${baseUrl} (Node-RED auth mode: ${authManager.mode})`);

  // Load MCP server authentication configuration
  const { config: authConfig, mode: authMode } = loadAuthConfig();
  console.error(`[nodered-mcp] MCP server auth: ${authMode}`);

  // Create Node-RED client and MCP server
  const nodeRedClient = createNodeRedClient(baseUrl, authManager);

  // Create and connect the comms client for real-time debug messages
  const commsClient = new CommsClient({
    baseUrl,
    username: process.env.NODERED_USERNAME,
    password: process.env.NODERED_PASSWORD,
    // Pre-obtained token from auth manager takes precedence
    token: authManager.mode === 'credentials' || authManager.mode === 'apikey'
      ? authManager.getAuthHeader()?.replace('Bearer ', '')
      : undefined,
  });
  // connect() is async (may fetch token); fire-and-forget — errors are
  // emitted on the 'error' event and auto-reconnect handles the rest.
  commsClient.connect().catch((err) => {
    console.error(`[nodered-mcp] CommsClient initial connect failed: ${err.message}`);
  });

  // Start the selected transport
  const port = process.env.MCP_HTTP_PORT
    ? parseInt(process.env.MCP_HTTP_PORT, 10)
    : args.port;

  if (args.transport === 'http') {
    // Build auth options for the HTTP transport
    /** @type {object|undefined} */
    let authOptions;

    if (authConfig.apiKey || authConfig.oauthEnabled) {
      authOptions = {
        apiKey: authConfig.apiKey,
        oauthProvider: null,
        oauthIssuerUrl: authConfig.oauthIssuerUrl,
      };

      // Set up OAuth if enabled
      if (authConfig.oauthEnabled) {
        const { createClientsStore } = await import('./src/auth/oauth-clients-store.js');
        const { createTokenStore } = await import('./src/auth/oauth-token-store.js');
        const { createOAuthProvider } = await import('./src/auth/oauth-provider.js');

        const clientsStore = await createClientsStore(authConfig.oauthClientsFile);
        const tokenStore = await createTokenStore(authConfig.oauthTokensFile);
        authOptions.oauthProvider = createOAuthProvider({ clientsStore, tokenStore });

        console.error(`[nodered-mcp] OAuth clients store: ${authConfig.oauthClientsFile || 'oauth-clients.json'}`);
        console.error(`[nodered-mcp] OAuth tokens store: ${authConfig.oauthTokensFile || 'oauth-tokens.json'}`);
      }
    }

    // Eagerly create one MCP server to load staging for the viewer/WS
    const bootstrapServer = await createMcpServer(nodeRedClient, commsClient);
    const staging = bootstrapServer.__staging;
    await startHttpTransport(() => createMcpServer(nodeRedClient, commsClient), port, staging, authOptions);
  } else if (args.transport === 'stdio') {
    const mcpServer = await createMcpServer(nodeRedClient, commsClient);
    await startStdioTransport(mcpServer);
  } else {
    console.error(`Error: Unknown transport "${args.transport}". Use "stdio" or "http".`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[nodered-mcp] Fatal error:', err.message);
  process.exit(1);
});
