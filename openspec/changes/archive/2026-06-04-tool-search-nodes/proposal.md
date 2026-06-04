## Why

Working with large Node-RED instances requires finding specific nodes across many flows. Currently the LLM must call `get-flow-nodes` for each flow individually and scan results manually. A `search-nodes` tool enables finding nodes with a single search term that scans across all fields of every node in a single call.

## What Changes

- Add `search-nodes` MCP tool that performs a deep search across all node fields using a single `query` string, with optional regex mode and optional flow scoping via `flowId`

## Capabilities

### New Capabilities
- `tool-search-nodes`: MCP tool that deep-searches nodes across all flows (or a single flow via `flowId`) with a single query term (plain text or regex), scanning all node fields

### Modified Capabilities

## Impact

- New file: `src/tools/search-nodes.js`
- New test file: `tests/tools/search-nodes.test.js`
- `src/server.js`: register the new tool
- Uses existing `GET /flows` endpoint (same pattern as all other tools)
