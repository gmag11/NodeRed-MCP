# skill-resources Specification

## Purpose
Skills are loaded from `resources/skills/` and exposed as MCP resources and tools (`list-skills`, `get-skill`).
## Requirements
### Requirement: Skills exposed as MCP resources
The system SHALL register each loaded skill from `resources/skills/` as an MCP resource with URI `nodered://skills/{name}`, mime type `text/markdown`, and the skill's YAML frontmatter description as the resource description.

#### Scenario: Skill resource is readable
- **WHEN** the client reads resource `nodered://skills/nodered-flow-builder`
- **THEN** the response contains the full Markdown body of the skill, with mime type `text/markdown`

#### Scenario: Non-existent skill resource
- **WHEN** the client reads resource `nodered://skills/nonexistent`
- **THEN** the MCP server returns a resource-not-found error

### Requirement: Skill discovery via list-skills
The system SHALL expose a `list-skills` MCP tool that returns an array of all available skills, each with `name`, `description`, and `uri` fields.

#### Scenario: List skills with URIs
- **WHEN** the client calls `list-skills`
- **THEN** the response contains a JSON array where each entry has `name`, `description`, and `uri` (e.g., `"nodered://skills/nodered-flow-builder"`) fields

### Requirement: Skill metadata SHALL include category
The skill metadata contract (as returned by `loadSkills()` and exposed via `get-skill` and `list-skills`) SHALL include a `category` field in addition to `name`, `description`, `content`, and `path`.

#### Scenario: get-skill returns category
- **WHEN** an agent calls `get-skill` with a valid skill name
- **THEN** the response SHALL include the skill's `category` in its metadata

