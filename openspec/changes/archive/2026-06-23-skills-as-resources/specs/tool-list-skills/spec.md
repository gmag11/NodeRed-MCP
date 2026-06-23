## ADDED Requirements

### Requirement: list-skills returns resource URIs
The system SHALL include a `uri` field in each entry returned by `list-skills`, containing the resource URI `nodered://skills/{name}` for that skill.

#### Scenario: Skill entry includes URI
- **WHEN** the client calls `list-skills` and `nodered-flow-builder` is an available skill
- **THEN** the entry for `nodered-flow-builder` includes `"uri": "nodered://skills/nodered-flow-builder"`

## MODIFIED Requirements

### Requirement: Tool description guides LLM usage
The system SHALL provide a tool description for `list-skills` that instructs the LLM to call this tool to discover available skill names and their resource URIs, then read the desired skill resources directly.

#### Scenario: Tool discoverable by LLM
- **WHEN** the LLM reads the MCP tool list
- **THEN** the `list-skills` tool description indicates it should be called to discover available skill names and resource URIs, without referencing a `get-skill` tool
