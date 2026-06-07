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
The system SHALL provide a tool description for `list-skills` that instructs the LLM to call this tool before `get-skill` to discover available topic names.

#### Scenario: Tool discoverable by LLM
- **WHEN** the LLM reads the MCP tool list
- **THEN** the `list-skills` tool description indicates it should be called to discover available skill names before using `get-skill`
