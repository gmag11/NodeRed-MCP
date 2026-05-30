## Why

LLMs and AI agents have no standardized, programmatic way to interact with Node-RED instances. This project creates an MCP (Model Context Protocol) server in Node.js that exposes Node-RED's Admin API capabilities as MCP tools, allowing any compatible MCP client (Claude, Cursor, Antigravity, etc.) to control flows, inspect nodes, and operate Node-RED instances without a browser.

## What Changes

- **New Node.js project** (ESM) with a modular structure for the MCP server.
- **Dual transport support**: `stdio` (for local integration as a child process) and `Streamable HTTP` (for remote multi-client access via Express).
- **HTTP client for the Node-RED Admin API** with automatic authentication mode detection (no auth / classic credentials / OIDC via static API key).
- **First MCP tool `get-flows`**: returns a summarized, LLM-optimized list of flows (tabs and subflows) from the Node-RED instance.
- **Environment variable configuration** (`.env`): instance URL, credentials or API key.

## Capabilities

### New Capabilities

- `mcp-server-core`: MCP server structure, transport system (stdio/HTTP), and entry point with mode selection.
- `nodered-auth`: Authentication client for the Node-RED Admin API; supports three modes: no auth, credentials (user/pass → Bearer token), and OIDC/strategy (static API key as Bearer).
- `nodered-client`: Generic HTTP client for the Node-RED Admin API; handles auth headers, API version (`Node-RED-API-Version: v2`), and 401 retry.
- `tool-get-flows`: MCP tool `get-flows` that calls `GET /flows` and transforms the flat response into a summarized list `[{ id, label, disabled, nodeCount, nodeTypes[] }]` optimized for LLMs.

### Modified Capabilities

## Impact

- **New repository/project**: `NodeRed-MCP` (Node.js, ESM).
- **Dependencies**: `@modelcontextprotocol/sdk`, `express`, `zod`, `dotenv`.
- **Node-RED**: Requires `tokens` configuration in `settings.js` for OIDC instances; instances without auth or with standard credentials need no changes.
- **Compatibility**: Node.js 18+ (native fetch, ESM).
