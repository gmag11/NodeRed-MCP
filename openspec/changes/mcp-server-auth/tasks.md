## 1. Configuration module

- [ ] 1.1 Create `src/auth/config.js` that reads and validates `MCP_API_KEY`, `MCP_OAUTH_ENABLED`, `MCP_OAUTH_ISSUER_URL`, `MCP_OAUTH_CLIENTS_FILE`, `MCP_OAUTH_TOKENS_FILE` from environment
- [ ] 1.2 Validate that `MCP_OAUTH_ISSUER_URL` is set and has `https` scheme when `MCP_OAUTH_ENABLED=true` (allow `http://localhost` for dev)
- [ ] 1.3 Export a frozen config object used by all auth modules

## 2. API Key authentication

- [ ] 2.1 Create `src/auth/api-key-verifier.js` implementing the SDK's `verifyAccessToken(token)` interface
- [ ] 2.2 Compare token against `MCP_API_KEY` env var; return `{ clientId: 'api-key', scopes: ['*'], expiresAt: Infinity }` on match
- [ ] 2.3 Throw `InvalidTokenError` from SDK on mismatch

## 3. OAuth client store

- [ ] 3.1 Create `src/auth/oauth-clients-store.js` implementing `getClient(clientId)` and `registerClient(clientData)`
- [ ] 3.2 Back with JSON file at configurable path; load on startup, write atomically (temp file + rename)
- [ ] 3.3 `registerClient` generates `client_id` via `crypto.randomUUID()` and `client_secret` via `crypto.randomBytes(32).toString('hex')`
- [ ] 3.4 `getClient` returns the stored client object or `null`

## 4. OAuth token store

- [ ] 4.1 Create `src/auth/oauth-token-store.js` implementing `verifyAccessToken(token)` and `revokeToken(token)`
- [ ] 4.2 Back with JSON file at configurable path; load on startup, write atomically
- [ ] 4.3 Store token metadata: `accessToken`, `clientId`, `scopes`, `expiresAt`, `refreshToken` (if issued)
- [ ] 4.4 `verifyAccessToken` returns SDK `AuthInfo` object with `clientId`, `scopes`, and `expiresAt`; throws `InvalidTokenError` for unknown/expired tokens
- [ ] 4.5 `revokeToken` removes the token entry

## 5. OAuth provider

- [ ] 5.1 Create `src/auth/oauth-provider.js` assembling the SDK provider interface
- [ ] 5.2 Wire `clientsStore` (from oauth-clients-store), `verifyAccessToken` (from oauth-token-store), and optional `revokeToken`
- [ ] 5.3 Pass `scopesSupported: ['*']` and `issuerUrl` to `mcpAuthRouter`

## 6. Composite verifier

- [ ] 6.1 Create `src/auth/composite-verifier.js` wrapping both API key and OAuth verifiers
- [ ] 6.2 Try API key match first (fast path); on mismatch, delegate to OAuth `verifyAccessToken`
- [ ] 6.3 When OAuth is disabled, skip OAuth verifier entirely

## 7. HTTP transport middleware integration

- [ ] 7.1 In `src/transport/http.js`, import `requireBearerAuth` from SDK
- [ ] 7.2 Create the composite verifier based on auth config
- [ ] 7.3 When any auth method is active, apply `requireBearerAuth` middleware on `/mcp` routes (GET, POST, DELETE) BEFORE the session handler
- [ ] 7.4 When OAuth is enabled, mount `mcpAuthRouter` and `mcpAuthMetadataRouter` at the Express app root
- [ ] 7.5 Ensure 401 responses include proper `WWW-Authenticate` headers with `resource_metadata` URL when OAuth is enabled

## 8. Entry point wiring

- [ ] 8.1 In `index.js`, call `validateAuthConfig()` from the config module early in startup
- [ ] 8.2 Log auth mode on startup: `[nodered-mcp] Auth: api-key` / `[nodered-mcp] Auth: oauth` / `[nodered-mcp] Auth: api-key + oauth` / `[nodered-mcp] Auth: none`
- [ ] 8.3 Pass auth config through to `startHttpTransport` so middleware can be applied
- [ ] 8.4 Verify stdio transport startup is unaffected when auth env vars are set

## 9. Tests

- [ ] 9.1 Unit test `api-key-verifier.js` — valid key accepted, invalid key rejected, missing Authorization header
- [ ] 9.2 Unit test `oauth-clients-store.js` — register, retrieve, missing client
- [ ] 9.3 Unit test `oauth-token-store.js` — verify valid token, expired token, revoked token, unknown token
- [ ] 9.4 Unit test `composite-verifier.js` — API key takes priority, falls through to OAuth, both absent
- [ ] 9.5 Integration test: HTTP transport with API key — valid request passes, invalid gets 401
- [ ] 9.6 Integration test: HTTP transport with OAuth — token flow end to end (register → token → authorized request → 401 on bad token)
- [ ] 9.7 Integration test: HTTP transport with both — either auth method grants access
- [ ] 9.8 Integration test: HTTP transport with no auth configured — all requests pass (backward compat)

## 10. Documentation

- [ ] 10.1 Add `MCP_API_KEY` to `.env.example` with generation instructions
- [ ] 10.2 Add OAuth configuration section to `.env.example` (commented out by default)
- [ ] 10.3 Update README with Authentication section covering both API key and OAuth setup
