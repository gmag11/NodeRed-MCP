## Why

Working with large Node-RED instances requires finding specific nodes across many flows. Currently the LLM must call `get-flow-nodes` for each flow individually and scan results manually. A `search-nodes` tool enables finding nodes by name, type, or property value across all flows in a single call.

## What Changes

- Add `search-nodes` MCP tool that searches all nodes across all flows with filters for name, type, and property values

## Capabilities

### New Capabilities
- `tool-search-nodes`: MCP tool that searches nodes across all flows by name, type, and/or property value

### Modified Capabilities

## Impact

- New file: `src/tools/search-nodes.js`
- New test file: `tests/tools/search-nodes.test.js`
- `src/server.js`: register the new tool
- Uses existing `GET /flows` endpoint (same pattern as all other tools)
