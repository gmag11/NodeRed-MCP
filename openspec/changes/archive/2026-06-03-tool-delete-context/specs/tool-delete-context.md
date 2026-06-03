## ADDED Requirements

### Requirement: delete-context MCP tool
The system SHALL expose an MCP tool named `delete-context` that accepts `scope` (required string, enum `"node"|"flow"|"global"`), `id` (required string for `node` and `flow` scopes; unused for `global`), and `key` (required string). It SHALL call the Node-RED Admin API `DELETE /context/{scope}/{id}/{key}` and return a confirmation response.

#### Scenario: Delete a key from global context
- **WHEN** `delete-context` is called with `scope: "global"` and `key: "counter"`
- **THEN** the tool calls `DELETE /context/global/counter` and returns `{ scope: "global", key: "counter", deleted: true }`

#### Scenario: Delete a key from flow context (with id)
- **WHEN** `delete-context` is called with `scope: "flow"`, `id: "<flowId>"`, and `key: "cache"`
- **THEN** the tool calls `DELETE /context/flow/<flowId>/cache` and returns `{ scope: "flow", id: "<flowId>", key: "cache", deleted: true }`

#### Scenario: Delete a key from node context (with id)
- **WHEN** `delete-context` is called with `scope: "node"`, `id: "<nodeId>"`, and `key: "state"`
- **THEN** the tool calls `DELETE /context/node/<nodeId>/state` and returns `{ scope: "node", id: "<nodeId>", key: "state", deleted: true }`

#### Scenario: Key does not exist
- **WHEN** the requested key does not exist in the context store
- **THEN** the tool still returns `{ scope: "<scope>", key: "<key>", deleted: true }` — Node-RED returns 204 regardless of whether the key existed

#### Scenario: id required for node/flow scope
- **WHEN** `scope` is `"node"` or `"flow"` and `id` is not provided
- **THEN** the tool returns an error: `id is required for scope "<scope>"`

#### Scenario: key is required
- **WHEN** `delete-context` is called without a `key` parameter
- **THEN** the tool returns an error indicating `key` is required
