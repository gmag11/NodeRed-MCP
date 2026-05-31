## Why

The MCP server currently only exposes `get-flows`, which returns a high-level summary of flows (tabs/subflows) without any detail about the individual nodes inside them. An LLM working with Node-RED needs to inspect the actual nodes of a flow — their types, configuration, connections, and state — to understand what a flow does, debug issues, or suggest changes. Additionally, visualizing the flow topology as a diagram is critical for understanding data flow paths and identifying isolated groups of nodes.

## What Changes

- **New MCP tool `get-flow-nodes`**: Returns a paginated list of all nodes within a given flow, including metadata (id, type, name, disabled state, position, wires/connections) and safe configuration (excluding long text fields like `func`, `template`, `format`). Supports filtering by:
  - **Disabled state**: Return only enabled or only disabled nodes
  - **Node type**: Return only nodes of a specific type (e.g., `function`, `http in`)
  - **Connected subgraph**: Given a node ID, return only the nodes connected to it. Supports a `direction` parameter (`"downstream"`, `"upstream"`, or `"both"`, default `"both"`) to control traversal direction and limit context
- **New MCP tool `get-flow-diagram`**: Returns a Mermaid flowchart representing the node topology of a flow. Shows node names/types, connections via wires, and visually distinguishes disabled nodes. Supports the same filtering options as `get-flow-nodes` and pagination for large flows.
- **New MCP tool `get-config-nodes`**: Returns global configuration nodes (nodes without a `z` property, e.g., `mqtt-broker`, `tls-config`) with their type, name, and sanitized configuration. Paginated.
- **Shared pagination**: Both `get-flow-nodes` and `get-flow-diagram` use cursor-based pagination with a configurable page size to handle flows with hundreds of nodes without exceeding context limits.

## Capabilities

### New Capabilities
- `tool-get-flow-nodes`: MCP tool that returns a detailed, paginated, filterable list of nodes within a specific flow, with their metadata, connections, and sanitized configuration
- `tool-get-flow-diagram`: MCP tool that returns a Mermaid flowchart diagram of a flow's node topology, with filtering and pagination support
- `tool-get-config-nodes`: MCP tool that returns global configuration nodes (mqtt-broker, tls-config, etc.) that don't belong to any specific flow

### Modified Capabilities
- `mcp-server-core`: New tools must be registered in the MCP server alongside `get-flows`

## Impact

- **New files**: `src/tools/get-flow-nodes.js`, `src/tools/get-flow-diagram.js`, `src/tools/get-config-nodes.js`
- **Modified files**: `src/server.js` (register three new tools with Zod input schemas)
- **New tests**: `tests/tools/get-flow-nodes.test.js`, `tests/tools/get-flow-diagram.test.js`, `tests/tools/get-config-nodes.test.js`
- **API dependency**: Uses the same `GET /flows` endpoint already used by `get-flows` — no new Node-RED API calls needed
- **Dependencies**: No new dependencies required (Zod already available for input validation)
