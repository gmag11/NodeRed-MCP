## Why

The MCP server currently exposes all its tools (deploy, create-node, inject-message, etc.) without any authentication. Any client that can reach the HTTP endpoint has full control over the connected Node-RED instance. This is unacceptable for anything beyond local development. We need a layered auth scheme that starts simple (API key) and scales to full OAuth 2.0 without rewriting the server.

## What Changes

- **New**: API key authentication via `MCP_API_KEY` environment variable. When set, all `/mcp` requests require `Authorization: Bearer <key>`. When unset, the server remains open (backward compatible).
- **New**: Optional OAuth 2.0 authorization server, enabled via `MCP_OAUTH_ENABLED=true`. Provides dynamic client registration, authorization code flow with PKCE, token issuance/refresh/revocation, and `.well-known` discovery endpoints.
- **New**: `mcp-server-auth` spec defining the auth capabilities and configuration surface.
- **No breaking changes**: existing deployments without auth env vars continue to work unchanged.

## Capabilities

### New Capabilities

- `mcp-server-auth`: API key and OAuth 2.0 authentication for the MCP server HTTP transport. Covers bearer token validation middleware, OAuth authorization server endpoints, client registration, and token lifecycle.

### Modified Capabilities

<!-- None — this is a new cross-cutting concern, not a modification of existing specs. -->

## Impact

- **`src/transport/http.js`**: Add auth middleware pipeline before MCP route handlers.
- **`index.js`**: Read new env vars (`MCP_API_KEY`, `MCP_OAUTH_ENABLED`, `MCP_OAUTH_ISSUER_URL`); conditionally wire auth middleware and OAuth router.
- **`src/nodered/auth.js`**: No changes. MCP-server auth is separate from Node-RED backend auth.
- **`package.json`**: No new dependencies. The OAuth machinery already ships in `@modelcontextprotocol/sdk` v1.12.1.
- **New files**: `src/auth/` module (api-key verifier, OAuth clients store, token store, provider).
