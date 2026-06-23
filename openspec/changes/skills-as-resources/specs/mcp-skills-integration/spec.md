## MODIFIED Requirements

### Requirement: Skill loader feeds resources only
The system SHALL load skills from `.github/skills/*/SKILL.md` files and register them exclusively as MCP resources with `nodered://skills/{name}` URIs and `text/markdown` mime type. The system SHALL NOT register skills as MCP prompts or as a `get-skill` tool.

#### Scenario: Skills available as resources
- **WHEN** the server starts and `.github/skills/` contains valid SKILL.md files
- **THEN** each nodered-* skill is accessible as an MCP resource at `nodered://skills/{name}` with `text/markdown` mime type

#### Scenario: Skills not available as prompts
- **WHEN** the server starts and `.github/skills/` contains valid SKILL.md files
- **THEN** no nodered-* skill is registered as an MCP prompt

#### Scenario: No get-skill tool registered
- **WHEN** the server starts
- **THEN** no `get-skill` tool is registered in the MCP tool list
