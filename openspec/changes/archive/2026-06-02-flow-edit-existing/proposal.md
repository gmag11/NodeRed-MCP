## Why

The MCP server currently exposes only read tools. An LLM working with Node-RED needs to be able to modify existing flows — updating a node's configuration and managing wires between nodes — to automate flow development and maintenance tasks. Without write capabilities, the agent can inspect and understand flows but cannot act on them.

## What Changes

- **New MCP tool `update-node`**: Modifies the configuration properties of an existing node identified by its `nodeId`. Accepts a `properties` object that is shallow-merged onto the existing node. Wiring (`wires`) is explicitly excluded — agents must use `connect-nodes`/`disconnect-nodes` for that. Deploys the change immediately using `Node-RED-Deployment-Type: flows`. Returns both the previous and current node state to enable the agent to reason about and reverse the change.
- **New MCP tool `connect-nodes`**: Adds a wire from one node's output port to another node's input. Accepts `fromNodeId`, `outputPort` (default 0), and `toNodeId`. Idempotent — if the wire already exists, it is a no-op. Deploys immediately. Returns previous and current wires state of the source node.
- **New MCP tool `disconnect-nodes`**: Removes a wire between two nodes. Accepts `fromNodeId`, `outputPort` (default 0), and `toNodeId`. If the wire does not exist, returns an error. Deploys immediately. Returns previous and current wires state of the source node.

## Capabilities

### New Capabilities
- `tool-update-node`: MCP tool that modifies node configuration properties (excluding wiring)
- `tool-connect-nodes`: MCP tool that adds a wire between two nodes
- `tool-disconnect-nodes`: MCP tool that removes a wire between two nodes

### Modified Capabilities
- `mcp-server-core`: Three new tools must be registered in the MCP server
- `nodered-client`: Requires a write method (`PUT /flows`) in the client

## Impact

- **New files**: `src/tools/update-node.js`, `src/tools/connect-nodes.js`, `src/tools/disconnect-nodes.js`
- **Modified files**: `src/server.js` (register three new tools), `src/nodered/client.js` (add `putFlows()` or extend `request()` — already supports arbitrary methods)
- **New tests**: `tests/tools/update-node.test.js`, `tests/tools/connect-nodes.test.js`, `tests/tools/disconnect-nodes.test.js`
- **API dependency**: Uses `GET /flows` (already in use) and `PUT /flows` with `Node-RED-Deployment-Type` header (new write path)
- **Dependencies**: No new dependencies required
