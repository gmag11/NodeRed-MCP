## Context

The MCP server is transport-agnostic: `createMcpServer()` builds the server, and transports (`stdio`, `http`) wire it. The HTTP transport uses Express 5 and `StreamableHTTPServerTransport` from the MCP SDK. Currently there is zero authentication at the MCP server boundary — the `AuthManager` in `src/nodered/auth.js` handles only the Node-RED Admin API backend, not the MCP protocol surface.

The `@modelcontextprotocol/sdk` v1.12.1 ships a complete OAuth 2.0 module (`server/auth/`) with:
- `requireBearerAuth({ verifier, requiredScopes, resourceMetadataUrl })` — Express middleware that validates `Authorization: Bearer <token>` headers
- `mcpAuthRouter({ provider, issuerUrl, ... })` — Full Express router with `/authorize`, `/token`, `/register`, `/revoke`, and `.well-known` endpoints
- `mcpAuthMetadataRouter(...)` — RFC 8414 and RFC 9728 metadata endpoints
- Client-side: `ClientCredentialsProvider`, `createPrivateKeyJwtAuth`, `auth()` orchestrator, and `withOAuth` fetch middleware

## Goals / Non-Goals

**Goals:**
- Add API key authentication that requires zero code changes in existing deployments (opt-in via env var)
- Add optional OAuth 2.0 authorization server using the SDK's built-in machinery
- Both methods share the same middleware pipeline (single `requireBearerAuth` call)
- Backward compatible: deployments without `MCP_API_KEY` or `MCP_OAUTH_ENABLED` work unchanged
- Stdio transport remains unaffected by any auth configuration

**Non-Goals:**
- User/password authentication for MCP clients
- Integration with external identity providers (Authentik, Keycloak, etc.)
- OAuth client UI (consent screen) — the SDK's default authorization handler is sufficient for v1
- Auth for the WebSocket staging viewer or `/staging-snapshot` endpoints (these are debug/admin surfaces, deferred)

## Decisions

### Decision 1: Use SDK's `requireBearerAuth` as the single auth middleware

**Rationale**: The SDK's `requireBearerAuth` is battle-tested, handles `WWW-Authenticate` headers correctly, supports OAuth error types (`InvalidTokenError`, `InsufficientScopeError`), and works with both API keys and OAuth tokens through a common `verifier` interface. Writing a custom middleware would duplicate this logic and make OAuth integration harder later.

**Alternatives considered**:
- Custom Express middleware: Simpler for API-key-only, but would need to be replaced when OAuth is added. SDK middleware handles both.
- `passport.js` / `express-jwt`: Unnecessary dependency. SDK already provides what we need.

### Decision 2: Composite verifier for dual auth mode

When both API key and OAuth are active, a composite verifier wraps both:

```
┌─────────────────────────────────────┐
│         CompositeVerifier           │
│                                     │
│  verifyAccessToken(token) {         │
│    // Try API key first (fast path) │
│    if (token === apiKey)            │
│      return { clientId: 'api-key',  │
│               scopes: ['*'],        │
│               expiresAt: Infinity } │
│    // Fall through to OAuth         │
│    return oauthVerifier.verify...   │
│  }                                  │
└─────────────────────────────────────┘
```

**Rationale**: The SDK's `requireBearerAuth` expects a single `verifier`. A composite lets us keep the middleware call site clean while supporting both auth sources.

**Alternatives considered**:
- Two separate middleware calls chained: More code at call site, harder to produce consistent error responses.
- Fork the SDK middleware: Maintenance burden, defeats the purpose.

### Decision 3: File-based OAuth stores (JSON)

**Rationale**: Node-RED MCP is a single-instance server, not a distributed system. JSON files are zero-dependency, human-readable for debugging, and trivially replaceable with a database later (the SDK's `clientsStore` and verifier interfaces are the same regardless).

**Alternatives considered**:
- SQLite: Adds a native dependency. Overkill for ~tens of clients.
- In-memory only: Tokens and clients lost on restart. Unacceptable.
- Redis: Unnecessary infrastructure dependency.

### Decision 4: OAuth authorization code flow with PKCE (no client_credentials in v1)

**Rationale**: The authorization code flow with PKCE is the MCP spec's recommended flow. It supports both interactive clients (browser-based authorization) and automated clients (via dynamic client registration + programmatic token exchange). The `client_credentials` grant (machine-to-machine) is available in the SDK but adds complexity around client secret management that we defer.

### Decision 5: Module structure under `src/auth/`

```
src/auth/
├── api-key-verifier.js    # Verifies MCP_API_KEY tokens
├── oauth-provider.js      # SDK Provider impl (clientsStore + token verifier)
├── oauth-clients-store.js # JSON file-backed client registry
├── oauth-token-store.js   # JSON file-backed token store
├── composite-verifier.js  # Tries API key, then OAuth
└── config.js              # Reads and validates auth env vars
```

### Decision 6: Auth middleware applied at Express router level, not per-session

The auth middleware wraps the `/mcp` route in Express, running BEFORE `StreamableHTTPServerTransport.handleRequest()`. This means auth is checked once per HTTP request, not per MCP message. The SDK's `requireBearerAuth` is designed for this exact pattern.

**Rationale**: Checking auth once per HTTP request is more efficient and aligns with how the MCP spec defines authentication (at the transport layer, not the protocol layer).

## Risks / Trade-offs

- **[Risk] OAuth authorization endpoint has no custom consent UI** → The SDK's default handler returns a simple JSON response with the authorization code. For interactive clients using `response_mode=query`, this is sufficient. If a browser-based consent screen is needed later, the SDK supports custom authorization handlers. **Mitigation**: Document that v1 uses programmatic authorization; browser consent is deferred.

- **[Risk] JSON file corruption under concurrent writes** → The current Node.js process is single-threaded, and token/client writes are sequential. However, if the server is restarted while writing, partial JSON could occur. **Mitigation**: Use atomic writes (write to temp file + rename).

- **[Risk] API key in environment variable is less secure than a secrets manager** → True for all env-var-based secrets. **Mitigation**: Document that for production, users should use a secrets injection system (Docker secrets, Kubernetes secrets, HashiCorp Vault) to set `MCP_API_KEY`.

- **[Trade-off] OAuth adds complexity for simple deployments** → Mitigated by making OAuth fully optional. Deployments that don't set `MCP_OAUTH_ENABLED=true` see zero additional code paths.

## Migration Plan

1. **Deploy without auth** (current state): No env vars set. Zero behavior change.
2. **Enable API key**: Set `MCP_API_KEY=<generated-key>`. Update MCP client config to include the `Authorization` header. All existing tools continue to work.
3. **Enable OAuth** (optional, later): Set `MCP_OAUTH_ENABLED=true` and `MCP_OAUTH_ISSUER_URL=https://...`. Clients discover OAuth automatically via well-known endpoints. API key continues to work alongside.
4. **Rollback**: Remove env vars and restart. Server returns to open mode. OAuth client/token JSON files can be deleted or kept.

## Open Questions

- Should the `/staging` and `/staging-ws` debug endpoints also be protected by auth? Currently deferring to keep scope tight — these are local-dev/debug surfaces.
- Should OAuth scopes be used to restrict specific MCP tools (e.g., `deploy` requires `write` scope)? Deferred — all tokens get `*` scope in v1.
