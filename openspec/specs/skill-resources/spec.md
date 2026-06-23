# skill-resources Specification

## Purpose
TBD - created by archiving change skills-as-resources. Update Purpose after archive.
## Requirements
### Requirement: Skills exposed as MCP resources
The system SHALL register each loaded nodered-* skill as an MCP resource with URI `nodered://skills/{name}`, mime type `text/markdown`, and the skill's YAML frontmatter description as the resource description.

#### Scenario: Skill resource is readable
- **WHEN** the client reads resource `nodered://skills/nodered-flow-builder`
- **THEN** the response contains the full Markdown body of the skill, with mime type `text/markdown`

#### Scenario: Non-existent skill resource
- **WHEN** the client reads resource `nodered://skills/nonexistent`
- **THEN** the MCP server returns a resource-not-found error

### Requirement: Skill discovery via list-skills
The system SHALL expose a `list-skills` MCP tool that returns an array of all available nodered-* skills, each with `name`, `description`, and `uri` fields.

#### Scenario: List skills with URIs
- **WHEN** the client calls `list-skills`
- **THEN** the response contains a JSON array where each entry has `name`, `description`, and `uri` (e.g., `"nodered://skills/nodered-flow-builder"`) fields

### Requirement: No prompts for skills
The system SHALL NOT register skills as MCP prompts.

#### Scenario: Prompt list excludes skills
- **WHEN** the client lists available MCP prompts
- **THEN** no nodered-* skill names appear in the prompt list

### Requirement: No get-skill tool
The system SHALL NOT expose a `get-skill` MCP tool.

#### Scenario: Tool list excludes get-skill
- **WHEN** the client lists available MCP tools
- **THEN** `get-skill` does not appear in the tool list

### Requirement: Skill metadata SHALL include category
The skill metadata contract (as returned by `loadSkills()` and exposed via `get-skill` and `list-skills`) SHALL include a `category` field in addition to `name`, `description`, `content`, and `path`.

#### Scenario: get-skill returns category
- **WHEN** an agent calls `get-skill` with a valid skill name
- **THEN** the response SHALL include the skill's `category` in its metadata

