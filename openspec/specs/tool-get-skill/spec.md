# tool-get-skill Specification

## Purpose
TBD - created by archiving change tool-get-skill. Update Purpose after archive.
## Requirements
### Requirement: Get skill by name
The system SHALL expose a `get-skill` MCP tool that accepts a `name` parameter and returns the full content of the requested nodered-* skill, including its YAML frontmatter metadata and Markdown body.

#### Scenario: Get existing skill
- **WHEN** the client calls `get-skill` with `name: "nodered-flow-builder"`
- **THEN** the response contains a JSON object with `name`, `description`, and `content` fields, where `content` is the full Markdown body of the skill

#### Scenario: Get non-existent skill
- **WHEN** the client calls `get-skill` with `name: "nonexistent"`
- **THEN** the response contains an error message indicating the skill was not found and lists the available skill names

#### Scenario: Get skill with no content
- **WHEN** the client calls `get-skill` with a valid skill name that has an empty body
- **THEN** the response contains a JSON object with the skill's metadata and an empty `content` string

### Requirement: Tool description guides dual-path access
The `get-skill` tool description SHALL instruct the LLM to call `list-skills` first to discover available skill names, then use `get-skill` to retrieve the full content. It SHALL also mention that clients supporting MCP Resources can read `nodered://skills/{name}` directly.

#### Scenario: Tool discoverable by LLM
- **WHEN** the LLM reads the MCP tool list
- **THEN** the `get-skill` tool description indicates it should be called with a skill name obtained from `list-skills`, and notes the alternative resource URI for clients that support resources

