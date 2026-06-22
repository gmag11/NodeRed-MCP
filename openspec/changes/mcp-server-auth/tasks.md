## 1. Configuration module

- [x] 1.1 Create `src/auth/config.js` that reads and validates `MCP_API_KEY`, `MCP_OAUTH_ENABLED`, `MCP_OAUTH_ISSUER_URL`, `MCP_OAUTH_CLIENTS_FILE`, `MCP_OAUTH_TOKENS_FILE` from environment
- [x] 1.2 Validate that `MCP_OAUTH_ISSUER_URL` is set and has `https` scheme when `MCP_OAUTH_ENABLED=true` (allow `http://localhost` for dev)
- [x] 1.3 Export a frozen config object used by all auth modules

## 2. API Key authentication

- [x] 2.1 Create `src/auth/api-key-verifier.js` implementing the SDK's `verifyAccessToken(token)` interface
- [x] 2.2 Compare token against `MCP_API_KEY` env var; return `{ clientId: 'api-key', scopes: ['*'], expiresAt: Infinity }` on match
- [x] 2.3 Throw `InvalidTokenError` from SDK on mismatch

## 3. OAuth client store

- [x] 3.1 Create `src/auth/oauth-clients-store.js` implementing `getClient(clientId)` and `registerClient(clientData)`
- [x] 3.2 Back with JSON file at configurable path; load on startup, write atomically (temp file + rename)
- [x] 3.3 `registerClient` generates `client_id` via `crypto.randomUUID()` and `client_secret` via `crypto.randomBytes(32).toString('hex')`
- [x] 3.4 `getClient` returns the stored client object or `null`

## 4. OAuth token store

- [x] 4.1 Create `src/auth/oauth-token-store.js` implementing `verifyAccessToken(token)` and `revokeToken(token)`
- [x] 4.2 Back with JSON file at configurable path; load on startup, write atomically
- [x] 4.3 Store token metadata: `accessToken`, `clientId`, `scopes`, `expiresAt`, `refreshToken` (if issued)
- [x] 4.4 `verifyAccessToken` returns SDK `AuthInfo` object with `clientId`, `scopes`, and `expiresAt`; throws `InvalidTokenError` for unknown/expired tokens
- [x] 4.5 `revokeToken` removes the token entry

## 5. OAuth provider

- [x] 5.1 Create `src/auth/oauth-provider.js` assembling the SDK provider interface
- [x] 5.2 Wire `clientsStore` (from oauth-clients-store), `verifyAccessToken` (from oauth-token-store), and optional `revokeToken`
- [x] 5.3 Pass `scopesSupported: ['*']` and `issuerUrl` to `mcpAuthRouter`

## 6. Composite verifier

- [x] 6.1 Create `src/auth/composite-verifier.js` wrapping both API key and OAuth verifiers
- [x] 6.2 Try API key match first (fast path); on mismatch, delegate to OAuth `verifyAccessToken`
- [x] 6.3 When OAuth is disabled, skip OAuth verifier entirely

## 7. HTTP transport middleware integration

- [x] 7.1 In `src/transport/http.js`, import `requireBearerAuth` from SDK
- [x] 7.2 Create the composite verifier based on auth config
- [x] 7.3 When any auth method is active, apply `requireBearerAuth` middleware on `/mcp` routes (GET, POST, DELETE) BEFORE the session handler
- [x] 7.4 When OAuth is enabled, mount `mcpAuthRouter` and `mcpAuthMetadataRouter` at the Express app root
- [x] 7.5 Ensure 401 responses include proper `WWW-Authenticate` headers with `resource_metadata` URL when OAuth is enabled

## 8. Entry point wiring

- [x] 8.1 In `index.js`, call `loadAuthConfig()` from the config module early in startup
- [x] 8.2 Log auth mode on startup: `[nodered-mcp] Auth: api-key` / `[nodered-mcp] Auth: oauth` / `[nodered-mcp] Auth: api-key + oauth` / `[nodered-mcp] Auth: none`
- [x] 8.3 Pass auth config through to `startHttpTransport` so middleware can be applied
- [x] 8.4 Verify stdio transport startup is unaffected when auth env vars are set

## 9. Tests

- [x] 9.1 Unit test `api-key-verifier.js` — valid key accepted, invalid key rejected, missing Authorization header
- [x] 9.2 Unit test `oauth-clients-store.js` — register, retrieve, missing client
- [x] 9.3 Unit test `oauth-token-store.js` — verify valid token, expired token, revoked token, unknown token
- [x] 9.4 Unit test `composite-verifier.js` — API key takes priority, falls through to OAuth, both absent
- [x] 9.5 Integration test: HTTP transport with API key — valid request passes, invalid gets 401
- [x] 9.6 Integration test: HTTP transport with OAuth — token flow end to end (register → token → authorized request → 401 on bad token)
- [x] 9.7 Integration test: HTTP transport with both — either auth method grants access
- [x] 9.8 Integration test: HTTP transport with no auth configured — all requests pass (backward compat)

## 10. Documentation

- [x] 10.1 Add `MCP_API_KEY` to `.env.example` with generation instructions
- [x] 10.2 Add OAuth configuration section to `.env.example` (commented out by default)
- [x] 10.3 Create README with Authentication section covering both API key and OAuth setup
