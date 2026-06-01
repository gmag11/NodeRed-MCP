## Why

With the `flow-edit-existing` change, agents can modify nodes and wires. The next step is allowing agents to create brand-new nodes from the palette and delete nodes that are no longer needed. These capabilities complete the core flow editing lifecycle: inspect → modify → create → delete.

The palette tools (`get-palette-nodes`, `get-node-type-detail`) are already implemented and provide agents with the information they need to know what node types are available and what properties to supply when creating them.

## What Changes

- **New MCP tool `create-node`**: Creates a new node in a specified flow. Accepts `type` (palette node type, required), `flowId` (required), `properties` (optional object with type-specific configuration), `x` (optional, default 200), `y` (optional, default 200). Generates a unique node ID, assembles the node object (with `wires: [[]]`), appends it to the flows, and deploys. Returns the new `nodeId` and `currentState` so the agent can immediately wire it using `connect-nodes`.
- **New MCP tool `delete-node`**: Removes a node from the flows by `nodeId`. Node-RED automatically removes dangling wires to the deleted node on `PUT /flows`, so no cleanup of other nodes' `wires` is needed. Returns the `previousState` of the deleted node so the agent can reason about what was removed.

## Capabilities

### New Capabilities
- `tool-create-node`: MCP tool that instantiates a new node of any palette type into a flow
- `tool-delete-node`: MCP tool that removes a node from a flow

### Modified Capabilities
- `mcp-server-core`: Two new tools must be registered in the MCP server

## Impact

- **New files**: `src/tools/create-node.js`, `src/tools/delete-node.js`
- **Modified files**: `src/server.js` (register two new tools)
- **New tests**: `tests/tools/create-node.test.js`, `tests/tools/delete-node.test.js`
- **API dependency**: Uses `GET /flows` and `PUT /flows` (introduced in `flow-edit-existing`)
- **Dependencies**: Requires `flow-edit-existing` to be implemented first (for `putFlows` client method)
- **ID generation**: Uses `crypto.randomUUID()` (Node.js built-in, no new dependency)
