# mcp-server-auth Specification

## Purpose
TBD - created by archiving change mcp-server-auth. Update Purpose after archive.
## Requirements
### Requirement: API Key authentication via environment variable
When the `MCP_API_KEY` environment variable is set to a non-empty value, the server SHALL require all requests to `/mcp` to include an `Authorization: Bearer <key>` header matching that value. The server SHALL NOT require authentication when `MCP_API_KEY` is unset or empty.

#### Scenario: API key configured and valid
- **WHEN** `MCP_API_KEY` is set and a request to `/mcp` includes `Authorization: Bearer <correct key>`
- **THEN** the request is processed normally

#### Scenario: API key configured but missing
- **WHEN** `MCP_API_KEY` is set and a request to `/mcp` has no `Authorization` header
- **THEN** the server responds with `401 Unauthorized` and a `WWW-Authenticate: Bearer` header

#### Scenario: API key configured but wrong
- **WHEN** `MCP_API_KEY` is set and a request to `/mcp` includes `Authorization: Bearer <wrong key>`
- **THEN** the server responds with `401 Unauthorized`

#### Scenario: API key not configured
- **WHEN** `MCP_API_KEY` is not set and a request is made to `/mcp`
- **THEN** the request is processed without authentication (backward compatible)

#### Scenario: API key must use Bearer scheme
- **WHEN** `MCP_API_KEY` is set and a request to `/mcp` uses `Authorization: Basic <key>` or another non-Bearer scheme
- **THEN** the server responds with `401 Unauthorized`

### Requirement: OAuth 2.0 authorization server (optional)
When `MCP_OAUTH_ENABLED=true` is set, the server SHALL expose OAuth 2.0 endpoints as defined by RFC 8414 and RFC 6749. The OAuth layer SHALL be independent from the API Key layer: either or both can be active. When both are active, a valid token from either source grants access.

#### Scenario: OAuth enabled and client registration
- **WHEN** `MCP_OAUTH_ENABLED=true` and a client sends `POST /register` with valid `client_name` and `redirect_uris`
- **THEN** the server responds with `201 Created` containing `client_id`, `client_secret`, and `client_id_issued_at`

#### Scenario: OAuth authorization code flow
- **WHEN** `MCP_OAUTH_ENABLED=true` and a client completes the PKCE authorization code flow via `/authorize` and `/token`
- **THEN** the server issues a valid access token and optional refresh token

#### Scenario: OAuth token validation
- **WHEN** `MCP_OAUTH_ENABLED=true` and a request to `/mcp` includes a valid OAuth access token
- **THEN** the request is processed normally

#### Scenario: OAuth token expired
- **WHEN** an OAuth access token has expired
- **THEN** the server responds with `401 Unauthorized` and a `WWW-Authenticate` header pointing to the authorization server metadata URL

#### Scenario: OAuth token refresh
- **WHEN** a client with a valid refresh token sends `POST /token` with `grant_type=refresh_token`
- **THEN** the server issues a new access token

#### Scenario: OAuth token revocation
- **WHEN** a client sends `POST /revoke` with a valid token
- **THEN** the token is invalidated and subsequent requests with it receive `401 Unauthorized`

#### Scenario: OAuth disabled
- **WHEN** `MCP_OAUTH_ENABLED` is not set to `true`
- **THEN** the OAuth endpoints (`/authorize`, `/token`, `/register`, `/revoke`, `/.well-known/oauth-authorization-server`) are NOT exposed

#### Scenario: OAuth discovery via well-known
- **WHEN** `MCP_OAUTH_ENABLED=true`
- **THEN** `GET /.well-known/oauth-authorization-server` returns an RFC 8414 metadata document with issuer, authorization_endpoint, token_endpoint, and supported grant types

#### Scenario: OAuth resource metadata
- **WHEN** `MCP_OAUTH_ENABLED=true`
- **THEN** `GET /.well-known/oauth-protected-resource/mcp` returns an RFC 9728 protected resource metadata document pointing to the authorization server

### Requirement: Combined API Key and OAuth mode
When both `MCP_API_KEY` and `MCP_OAUTH_ENABLED=true` are configured, the server SHALL accept requests authenticated with either a valid API key or a valid OAuth access token. An invalid token or key SHALL be rejected regardless of the other method being available.

#### Scenario: Valid OAuth token when API key is also configured
- **WHEN** both auth methods are active and a request includes a valid OAuth access token (but not the API key)
- **THEN** the request is processed normally

#### Scenario: Valid API key when OAuth is also configured
- **WHEN** both auth methods are active and a request includes the correct `MCP_API_KEY`
- **THEN** the request is processed normally

#### Scenario: Neither valid
- **WHEN** both auth methods are active and a request includes neither a valid API key nor a valid OAuth token
- **THEN** the server responds with `401 Unauthorized`

### Requirement: Stdio transport unaffected
The stdio transport SHALL NOT be affected by any authentication configuration. Authentication only applies to the HTTP transport.

#### Scenario: Stdio transport with API key configured
- **WHEN** `MCP_API_KEY` is set and the server runs in stdio mode
- **THEN** the server operates without requiring any authentication headers

#### Scenario: Stdio transport with OAuth enabled
- **WHEN** `MCP_OAUTH_ENABLED=true` and the server runs in stdio mode
- **THEN** the OAuth endpoints are not exposed and the server operates normally

### Requirement: Configuration environment variables
The server SHALL recognize the following environment variables for authentication configuration:

| Variable | Required | Default | Description |
|---|---|---|---|
| `MCP_API_KEY` | No | (empty) | Static API key for Bearer token auth. Empty = no auth. |
| `MCP_OAUTH_ENABLED` | No | `false` | Enable OAuth 2.0 authorization server endpoints. |
| `MCP_OAUTH_ISSUER_URL` | Conditional | — | Required when `MCP_OAUTH_ENABLED=true`. The base issuer URL for OAuth metadata (e.g., `https://nodered-mcp.example.com`). |
| `MCP_OAUTH_CLIENTS_FILE` | No | `./oauth-clients.json` | Path to the JSON file storing registered OAuth clients. |
| `MCP_OAUTH_TOKENS_FILE` | No | `./oauth-tokens.json` | Path to the JSON file storing issued tokens. |

#### Scenario: OAuth enabled without issuer URL
- **WHEN** `MCP_OAUTH_ENABLED=true` but `MCP_OAUTH_ISSUER_URL` is not set
- **THEN** the server fails to start with a descriptive error message

#### Scenario: OAuth stores default to working directory
- **WHEN** `MCP_OAUTH_ENABLED=true` and store file paths are not explicitly set
- **THEN** the server creates `oauth-clients.json` and `oauth-tokens.json` in the current working directory if they do not exist

