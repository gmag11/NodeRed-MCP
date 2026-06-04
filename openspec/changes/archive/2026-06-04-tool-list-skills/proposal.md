## Why

Currently, the MCP client has no way to discover which skills are available without guessing a `topic` name and handling the "not found" error from `get-skill`. The `get-skill` tool description only gives examples, and the available skills are only revealed in the error message. This is a poor discovery experience — the LLM should be able to query "what skills do you have?" and get a structured list with names and descriptions.

## What Changes

- Add a new `list-skills` MCP tool that returns all available nodered-* skills with their names and descriptions
- The tool requires no parameters — it lists every skill the server knows about
- No breaking changes

## Capabilities

### New Capabilities
- `tool-list-skills`: A zero-parameter MCP tool that returns the name and description of every available nodered-* skill, enabling client-side discovery before calling `get-skill`

### Modified Capabilities
<!-- None -->

## Impact

- `src/server.js`: Register new `list-skills` tool alongside existing `get-skill`
- `src/skills/loader.js`: No changes needed (already exposes names and descriptions)
