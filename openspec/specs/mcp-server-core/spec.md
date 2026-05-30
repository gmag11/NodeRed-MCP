## ADDED Requirements

### Requirement: Transport selection via CLI argument
The system SHALL start in `stdio` or `http` mode based on the `--transport=<mode>` argument passed to the process. If not specified, it SHALL default to `stdio`. In `http` mode, it SHALL accept `--port=<number>` (default `3000`).

#### Scenario: Start in stdio mode
- **WHEN** the process is launched with `--transport=stdio` (or without any argument)
- **THEN** the server uses `StdioServerTransport` from the MCP SDK and communicates via stdin/stdout

#### Scenario: Start in http mode
- **WHEN** the process is launched with `--transport=http`
- **THEN** the server starts an Express server with `StreamableHTTPServerTransport` on the configured port

#### Scenario: Custom port in http mode
- **WHEN** the process is launched with `--transport=http --port=8080`
- **THEN** the Express server listens on port `8080`

### Requirement: MCP tool registration
The server SHALL register all available MCP tools centrally and independently of the active transport. Registered tools SHALL be identical in both transport modes.

#### Scenario: Tools available in stdio
- **WHEN** an MCP client connects via stdio
- **THEN** it can invoke all registered tools (e.g., `get-flows`)

#### Scenario: Tools available in HTTP
- **WHEN** an MCP client connects via Streamable HTTP
- **THEN** it can invoke the same registered tools

### Requirement: Environment variable configuration
The system SHALL read Node-RED configuration from environment variables at startup: `NODERED_URL` (required), `NODERED_USERNAME`, `NODERED_PASSWORD`, `NODERED_API_KEY`.

#### Scenario: Instance URL required
- **WHEN** `NODERED_URL` is not defined
- **THEN** the process exits with a descriptive error

#### Scenario: Minimum configuration without auth
- **WHEN** only `NODERED_URL` is defined
- **THEN** the client operates without authentication headers
