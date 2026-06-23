# Spec: MCP Skills Integration

## Files
- `src/skills/loader.js`
- `src/server.js`

## Description
This specification covers the implementation of a hybrid MCP skill integration. We will create a loader that parses `.github/skills/*/SKILL.md` files for frontmatter and body. Then, in `src/server.js`, we will map these into `server.prompt`, `server.resource`, and a custom `get-skill` tool. This ensures any MCP client can consume these Node-RED skills regardless of its specific capability support.
## Requirements
### Requirement: Tool descriptions reference skill resource URIs
Tool descriptions in `src/server.js` that reference skills (currently `create-node` and `create-subflow-instance` referencing `nodered-flow-layout`) SHALL point to the `nodered://skills/{name}` resource URI instead of a bare skill name, and SHALL instruct the LLM to read the resource.

#### Scenario: create-node references layout resource
- **WHEN** the LLM reads the `create-node` tool description
- **THEN** the description references `nodered://skills/nodered-flow-layout` with instructions to read that resource for positioning rules

#### Scenario: create-subflow-instance references layout resource
- **WHEN** the LLM reads the `create-subflow-instance` tool description
- **THEN** the description references `nodered://skills/nodered-flow-layout` with instructions to read that resource for positioning rules

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

