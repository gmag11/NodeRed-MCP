## Why

The MCP server can already inspect and edit nodes within flows, but has no way to manage flow tabs themselves — the containers that group nodes. An agent cannot create a new flow, delete an old one, or modify a flow's properties (name, enabled state, description, environment variables).

## What Changes

- **New MCP tool `create-flow`**: Creates a new flow tab with a given label and optional properties (`disabled`, `info`, `env`). Uses `POST /flow` on the Node-RED Admin API. Returns the new flow's `id` and full state.
- **New MCP tool `delete-flow`**: Deletes a flow tab and all its nodes by `flowId`. Uses `DELETE /flow/:id`. Returns the `previousState` of the deleted flow. The agent can discover `flowId` values via the existing `get-flows` tool.
- **New MCP tool `update-flow`**: Modifies properties of an existing flow tab. Supports updating `label` (rename), `disabled` (enable/disable the whole flow), `info` (description text), and `env` (environment variables). Uses `PUT /flow/:id`. Returns `previousState` and `currentState`.

## Capabilities

### New Capabilities
- `tool-create-flow`: MCP tool that creates a new Node-RED flow tab
- `tool-delete-flow`: MCP tool that deletes a Node-RED flow tab and all its nodes
- `tool-update-flow`: MCP tool that modifies flow tab properties (label, disabled, info, env)

### Modified Capabilities
- `mcp-server-core`: Three new tools must be registered in the MCP server

## Impact

- **New files**: `src/tools/create-flow.js`, `src/tools/delete-flow.js`, `src/tools/update-flow.js`
- **Modified files**: `src/server.js` (register three new tools)
- **New tests**: `tests/tools/create-flow.test.js`, `tests/tools/delete-flow.test.js`, `tests/tools/update-flow.test.js`
- **API dependency**: Uses individual flow endpoints (`POST /flow`, `GET /flow/:id`, `PUT /flow/:id`, `DELETE /flow/:id`) — distinct from the bulk `GET /flows` and `PUT /flows` used by node-editing tools. No new Node-RED API version requirements.
- **Dependencies**: No new npm dependencies required. Does not depend on `flow-edit-existing` (uses different endpoints).
