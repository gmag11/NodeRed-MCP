## MODIFIED Requirements

### Requirement: MCP tool registration
The server SHALL register all available MCP tools centrally and independently of the active transport. Registered tools SHALL be identical in both transport modes.

#### Scenario: Tools available in stdio
- **WHEN** an MCP client connects via stdio
- **THEN** it can invoke all registered tools (e.g., `get-flows`, `get-flow-nodes`, `get-flow-diagram`, `get-config-nodes`, `get-node-detail`, `get-palette-nodes`, `get-node-type-detail`)

#### Scenario: Tools available in HTTP
- **WHEN** an MCP client connects via Streamable HTTP
- **THEN** it can invoke the same registered tools
