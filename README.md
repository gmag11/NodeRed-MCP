# NodeRed-MCP

MCP (Model Context Protocol) server for controlling Node-RED instances via the Admin API. Connects LLM-powered tools to Node-RED flows.

## Quick Start

```bash
cp .env.example .env
# Edit .env with your Node-RED URL
npm install
npm run start:http
```

## Authentication

The MCP server supports two authentication methods for the HTTP transport. Both are optional — if neither is configured, the server runs open (backward compatible).

### API Key (recommended for most deployments)

Set the `MCP_API_KEY` environment variable:

```bash
# Generate a secure key
openssl rand -hex 32

# Add to .env
MCP_API_KEY=your-generated-key
```

Clients must include the key as a Bearer token:

```
Authorization: Bearer your-generated-key
```

### OAuth 2.0 (for multi-client deployments)

Enable OAuth 2.0 with dynamic client registration and PKCE:

```bash
MCP_OAUTH_ENABLED=true
MCP_OAUTH_ISSUER_URL=https://your-server.example.com
```

The server exposes standard OAuth endpoints:

| Endpoint | Description |
|---|---|
| `POST /register` | Dynamic client registration |
| `GET /authorize` | Authorization code flow (PKCE) |
| `POST /token` | Token issuance and refresh |
| `POST /revoke` | Token revocation |
| `GET /.well-known/oauth-authorization-server` | RFC 8414 metadata |
| `GET /.well-known/oauth-protected-resource/mcp` | RFC 9728 metadata |

MCP clients discover OAuth automatically via the well-known endpoints — no manual configuration needed beyond the server URL.

### Both methods

When both `MCP_API_KEY` and `MCP_OAUTH_ENABLED=true` are configured, either a valid API key or a valid OAuth access token grants access.

### No authentication

When neither `MCP_API_KEY` nor `MCP_OAUTH_ENABLED` is configured, the server operates without authentication (useful for local development).

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODERED_URL` | **Yes** | — | Node-RED instance URL |
| `NODERED_USERNAME` | No | — | Node-RED credentials auth |
| `NODERED_PASSWORD` | No | — | Node-RED credentials auth |
| `NODERED_API_KEY` | No | — | Node-RED API key auth |
| `MCP_HTTP_PORT` | No | `3000` | HTTP transport port |
| `MCP_API_KEY` | No | — | API key for MCP server auth |
| `MCP_OAUTH_ENABLED` | No | `false` | Enable OAuth 2.0 server |
| `MCP_OAUTH_ISSUER_URL` | Conditional | — | OAuth issuer base URL |
| `MCP_OAUTH_CLIENTS_FILE` | No | `./oauth-clients.json` | OAuth client registry |
| `MCP_OAUTH_TOKENS_FILE` | No | `./oauth-tokens.json` | OAuth token store |

## Transports

- **stdio** (default): `npm run start:stdio` — for local MCP client integration
- **HTTP**: `npm run start:http` — Streamable HTTP with optional auth, WebSocket staging viewer at `/staging-ws`

## License

MIT
