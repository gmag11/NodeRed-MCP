## Why

Some MCP clients (e.g., Cursor, continue.dev) do not support MCP Resources — the `resources/list` and `resources/read` capabilities are unavailable. Since the Node-RED MCP server currently exposes skills exclusively as MCP resources (`nodered://skills/{name}`), these clients have no way to retrieve skill content. Adding a `get-skill` MCP tool ensures all clients, regardless of resource support, can access domain-specific guidance for building Node-RED flows.

## What Changes

- Add a new `get-skill` MCP tool that accepts a `name` parameter and returns the full skill content (body + frontmatter)
- Update the `list-skills` tool description to reference `get-skill` as the retrieval mechanism when resources are unavailable
- Keep existing MCP resources for clients that support them (no breaking changes)

## Capabilities

### New Capabilities
- `tool-get-skill`: MCP tool that accepts a skill name and returns the full skill Markdown content, enabling clients without resource support to access skill documentation

### Modified Capabilities
- `tool-list-skills`: Update description to mention `get-skill` tool alongside resource URIs, so clients can discover the retrieval path that works for their capabilities

## Impact

- `src/server.js`: Register new `get-skill` tool in the skills integration block; update `list-skills` description
- No changes to skill loader, resources, or any other tool
- Existing resource-based workflow continues unchanged for clients that support it
- Tests needed for `get-skill` handler logic (found + not found scenarios)
