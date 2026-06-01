## Why

MCP clients working with Node-RED flows need to discover what node types are available to build or understand flows, but there is currently no way to query the installed palette. Without palette introspection, an AI agent cannot know what node types exist, what properties they accept, or how to construct valid flows.

## What Changes

- Introduce a new MCP tool `get-palette-nodes` that returns all installed node types from the Node-RED palette, with pagination support to handle large palettes without overwhelming LLM context.
- Introduce a new MCP tool `get-node-type-detail` that accepts a node type name and returns its full documentation, input/output port definitions, and configuration parameters.

## Capabilities

### New Capabilities

- `tool-get-palette-nodes`: MCP tool that lists all available node types in the Node-RED palette. Supports pagination via `page` and `pageSize` parameters. Returns module, type name, category, and a brief description for each node type.
- `tool-get-node-type-detail`: MCP tool that returns detailed information about a specific node type, including its module, version, category, description, and configuration parameters (with types and defaults).

### Modified Capabilities

- `mcp-server-core`: Register the two new tools (`get-palette-nodes`, `get-node-type-detail`) in the server's tool registry.

## Impact

- **New file**: `src/tools/get-palette-nodes.js`
- **New file**: `src/tools/get-node-type-detail.js`
- **New test**: `tests/tools/get-palette-nodes.test.js`
- **New test**: `tests/tools/get-node-type-detail.test.js`
- **Modified**: `src/server.js` — register the two new tools
- **Modified**: `openspec/specs/mcp-server-core/spec.md` — add both tools to registered tools list
- No breaking changes. No new runtime dependencies required.
