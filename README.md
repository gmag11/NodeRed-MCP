# NodeRed-MCP

> **⚠️ IMPORTANT DISCLAIMER**
>
> This MCP server provides **programmatic, unattended access** to a Node-RED instance's Admin API. An AI agent using this server can create, modify, delete flows, inject messages, and execute arbitrary code through Function nodes — including operations that can disrupt or permanently damage your Node-RED environment and its connected systems.
>
> **This software is NOT designed or tested for production environments.** It is intended for development, experimentation, and learning purposes only.
>
> By using this software you acknowledge that:
> - **Use at your own risk.** The authors and contributors provide NO warranty, express or implied, and accept NO liability for any direct or indirect damages, data loss, service disruption, or security incidents resulting from its use.
> - You are **solely responsible** for:
>   - Restricting network access to the MCP server
>   - Configuring authentication (`MCP_API_KEY` or `MCP_OAUTH_ENABLED`)
>   - Validating that the AI agent's actions are safe before deploying
>   - Maintaining backups of your flows
> - **Never expose this server to the public internet** without a reverse proxy, strong authentication, and TLS.
> - **Never grant this server access to a Node-RED instance that contains sensitive data, business-critical flows, or production infrastructure.**
>
> If you choose to run this server, you do so entirely at your own risk.

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

## Connecting to a Node-RED Instance

This section covers how the MCP server authenticates **to** the Node-RED Admin API — not to be confused with the [MCP server authentication](#authentication) section above, which protects access **to** the MCP server itself.

The client auto-detects the auth mode by calling `GET /auth/login` on startup, unless `NODERED_API_KEY` is set (which skips detection).

### No authentication

If your Node-RED instance has no `adminAuth` configured, no extra variables are needed.

### Standard credentials (`type: "credentials"`)

Set username and password. The client calls `POST /auth/token` with the `password` grant to obtain a Bearer token.

```env
NODERED_USERNAME=admin
NODERED_PASSWORD=your-password
```

### OIDC / custom strategies (`type: "oidc"` or similar)

OIDC uses the **authorization code flow with PKCE**, which requires a browser — the MCP server is headless and cannot complete that flow interactively.

The supported approach is to **add an API key alongside OIDC** in your Node-RED `settings.js` using the `tokens` function:

```js
adminAuth: {
  type: "oidc",
  // ... your OIDC provider config ...
  tokens: async (token) => {
    if (token === "mcp-server-secret-key-here") {
      return { username: "mcp-server", scope: "*" }
    }
    return null
  }
}
```

Then configure the MCP server:

```env
NODERED_API_KEY=mcp-server-secret-key-here
```

When `NODERED_API_KEY` is set, the client skips the auto-detection call and uses it directly as a Bearer token on every request.

### API key natively (`NODERED_API_KEY`)

If your Node-RED instance already exposes an API key (e.g., via the `tokens` function or a custom strategy), just set:

```env
NODERED_API_KEY=your-api-key
```

> **Note**: `NODERED_API_KEY` takes priority over `NODERED_USERNAME`/`NODERED_PASSWORD`. If both are set, the API key is used.

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODERED_URL` | **Yes** | — | Node-RED instance URL |
| `NODERED_USERNAME` | No | — | Node-RED credentials auth (`type: "credentials"`) |
| `NODERED_PASSWORD` | No | — | Node-RED credentials auth (`type: "credentials"`) |
| `NODERED_API_KEY` | No | — | Node-RED API key auth (OIDC, custom strategies, or native API key) |
| `MCP_HTTP_PORT` | No | `3000` | HTTP transport port |
| `MCP_API_KEY` | No | — | API key for MCP server auth |
| `MCP_OAUTH_ENABLED` | No | `false` | Enable OAuth 2.0 server |
| `MCP_OAUTH_ISSUER_URL` | Conditional | — | OAuth issuer base URL |
| `MCP_OAUTH_CLIENTS_FILE` | No | `./oauth-clients.json` | OAuth client registry |
| `MCP_OAUTH_TOKENS_FILE` | No | `./oauth-tokens.json` | OAuth token store |

## Transports

- **stdio** (default): `npm run start:stdio` — for local MCP client integration
- **HTTP**: `npm run start:http` — Streamable HTTP with optional auth, WebSocket staging viewer at `/staging-ws`

See [docs/deployment-guide.md](docs/deployment-guide.md) for a detailed deployment guide covering stdio, HTTP, and Docker Compose.

## Installation

You can configure the MCP in `mcp.json` file by pointing to npm package `@gmag11/nodered-mcp-server` and passing the required environment variables.

```json
{
    "servers": {
        "nodered-mcp": {
            "command": "npx",
            "args": ["-y", "@gmag11/nodered-mcp-server", "--transport=stdio"],
            "env": {
                "HOME": "/home/your-user",
                "NODERED_URL": "http://localhost:1880",
                "NODERED_API_KEY": "your-api-key"
            }
        }
    }
}
```

## License

Apache-2.0
