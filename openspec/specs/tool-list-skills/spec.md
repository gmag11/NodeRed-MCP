## Purpose
Enable LLM clients to discover the set of Node-RED skill guides available on the MCP server, so the model can decide which skill content to retrieve before performing Node-RED work.
## Requirements
### Requirement: List available skills
The system SHALL expose a `list-skills` MCP tool that accepts no parameters and returns an array of all available nodered-* skills, each containing its name and description.

#### Scenario: List all skills when skills exist
- **WHEN** the client calls `list-skills`
- **THEN** the response contains a JSON array with one entry per available nodered-* skill, each with `name` and `description` fields

#### Scenario: List skills when no skills exist
- **WHEN** the client calls `list-skills` and the server has loaded no nodered-* skills
- **THEN** the response contains an empty JSON array

### Requirement: Skill description reflects YAML frontmatter
The system SHALL use the `description` field from each skill's YAML frontmatter as the description value returned by `list-skills`. If a skill has no description, the field SHALL be an empty string.

#### Scenario: Skill with description
- **WHEN** a skill has `description: "Step-by-step operational guide..."` in its YAML frontmatter
- **THEN** `list-skills` returns that exact description string for that skill

#### Scenario: Skill without description
- **WHEN** a skill has no `description` field in its YAML frontmatter
- **THEN** `list-skills` returns an empty string `""` as the description for that skill

### Requirement: Tool description guides LLM usage
The system SHALL provide a tool description for `list-skills` that instructs the LLM to call this tool to discover available skill names and their resource URIs, then read the desired skill resources directly or use the `get-skill` tool as an alternative for clients without resource support.

#### Scenario: Tool discoverable by LLM
- **WHEN** the LLM reads the MCP tool list
- **THEN** the `list-skills` tool description indicates it should be called to discover available skill names and resource URIs, and references `get-skill` as an alternative retrieval method for clients that do not support MCP Resources

### Requirement: list-skills returns resource URIs
The system SHALL include a `uri` field in each entry returned by `list-skills`, containing the resource URI `nodered://skills/{name}` for that skill.

#### Scenario: Skill entry includes URI
- **WHEN** the client calls `list-skills` and `nodered-flow-builder` is an available skill
- **THEN** the entry for `nodered-flow-builder` includes `"uri": "nodered://skills/nodered-flow-builder"`

