## MODIFIED Requirements

### Requirement: Tool description guides LLM usage
The system SHALL provide a tool description for `list-skills` that instructs the LLM to call this tool to discover available skill names and their resource URIs, then read the desired skill resources directly or use the `get-skill` tool as an alternative for clients without resource support.

#### Scenario: Tool discoverable by LLM
- **WHEN** the LLM reads the MCP tool list
- **THEN** the `list-skills` tool description indicates it should be called to discover available skill names and resource URIs, and references `get-skill` as an alternative retrieval method for clients that do not support MCP Resources
