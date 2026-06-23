## Why

Skills are currently exposed through three redundant mechanisms: MCP Prompts, MCP Resources, and a `get-skill` tool. This creates unnecessary complexity in the server code, bloats the MCP tool list, and forces clients to navigate multiple pathways to access the same content. MCP Resources are the most appropriate mechanism for reference/documentation content — they provide structured URIs, mime types, and are purpose-built for content retrieval. Consolidating to resources-only simplifies the API surface without losing any capability.

## What Changes

- **BREAKING**: Remove skill registration as MCP Prompts (`server.prompt()` loop)
- **BREAKING**: Remove the `get-skill` MCP tool
- Keep `list-skills` MCP tool for resource discovery
- Keep skill registration as MCP Resources (`server.resource()` loop) — this becomes the sole content delivery mechanism
- Update `list-skills` tool description to reference resources instead of `get-skill`
- No changes to `src/skills/loader.js` or the SKILL.md files themselves

## Capabilities

### New Capabilities
- `skill-resources`: Skills exposed exclusively as MCP resources with `nodered://skills/{name}` URIs, each with `text/markdown` mime type. Discovery via `list-skills` tool.

### Modified Capabilities
- `mcp-skills-integration`: Remove the requirement to register skills as prompts and as a `get-skill` tool. Skills SHALL be registered only as MCP resources plus the `list-skills` discovery tool.
- `tool-list-skills`: Update tool description to reference resource URIs (`nodered://skills/{name}`) instead of the removed `get-skill` tool.

## Impact

- **Code**: `src/server.js` — remove `server.prompt()` loop and `get-skill` tool registration; update `list-skills` tool description
- **Specs**: `mcp-skills-integration/spec.md` and `tool-list-skills/spec.md` require delta updates
- **API**: Breaking change for any MCP client that invokes skills via prompts or the `get-skill` tool
- **Tests**: Update tests that verify prompt registration, `get-skill` tool behavior, and `list-skills` description
- **No impact** on: `src/skills/loader.js`, SKILL.md files, other MCP tools, transport layer
