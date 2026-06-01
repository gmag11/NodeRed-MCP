## Why

The existing `get-flow-nodes` tool intentionally omits large text fields (`func`, `template`) to avoid wasting LLM context tokens. However, when an AI agent needs to read or understand the logic inside a specific node, there is no way to retrieve that content. A dedicated `get-node-detail` tool fills this gap by returning the full content of a single node, including its text fields.

## What Changes

- Introduce a new MCP tool `get-node-detail` that accepts a `nodeId` and returns the full detail of a single node, including large text fields (`func`, `template`, `format`, `html`, `css`) that are normally excluded from `get-flow-nodes`.
- The tool returns all node properties: `id`, `type`, `name`, `z` (flow), `disabled` state, `x`/`y` position, `wires`, and the complete configuration including text fields.

## Capabilities

### New Capabilities

- `tool-get-node-detail`: MCP tool that retrieves the full detail of a single Node-RED node by its ID, including text content fields such as `func` (function nodes) and `template` (template nodes).

### Modified Capabilities

<!-- No existing capability requirements are changing. -->

## Impact

- **New file**: `src/tools/get-node-detail.js`
- **New test**: `tests/tools/get-node-detail.test.js`
- **Modified**: `src/server.js` — register the new tool
- **Modified**: `openspec/specs/mcp-server-core/spec.md` — add `get-node-detail` to registered tools list
- No breaking changes. No new dependencies required.
