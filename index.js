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
import { createMcpServer } from './src/server.js';
import { startStdioTransport } from './src/transport/stdio.js';
import { startHttpTransport } from './src/transport/http.js';

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
  console.error(`[nodered-mcp] Connected to ${baseUrl} (auth mode: ${authManager.mode})`);

  // Create Node-RED client and MCP server
  const nodeRedClient = createNodeRedClient(baseUrl, authManager);
  const mcpServer = createMcpServer(nodeRedClient);

  // Start the selected transport
  const port = process.env.MCP_HTTP_PORT
    ? parseInt(process.env.MCP_HTTP_PORT, 10)
    : args.port;

  if (args.transport === 'http') {
    await startHttpTransport(mcpServer, port);
  } else if (args.transport === 'stdio') {
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
