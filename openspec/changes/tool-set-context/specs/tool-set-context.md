## ADDED Requirements

### Requirement: set-context MCP tool
The system SHALL expose an MCP tool named `set-context` that accepts `scope` (required string, enum `"node"|"flow"|"global"`), `id` (required string for `node` and `flow` scopes), `key` (required string), and `value` (required, any JSON-serializable value). It SHALL write the value to the Node-RED context store and return confirmation.

#### Scenario: Set a global context value
- **WHEN** `set-context` is called with `scope: "global"`, `key: "counter"`, `value: 0`
- **THEN** the global context key `counter` is set to `0` and the tool returns `{ scope: "global", key: "counter", value: 0, success: true }`

#### Scenario: Set a flow context value
- **WHEN** `set-context` is called with `scope: "flow"`, `id: "<flowId>"`, `key: "cache"`, `value: {}`
- **THEN** the flow context key `cache` is set and the tool returns confirmation

#### Scenario: Set a node context value
- **WHEN** `set-context` is called with `scope: "node"`, `id: "<nodeId>"`, `key: "count"`, `value: 42`
- **THEN** the node context key `count` is set to `42`

#### Scenario: id required for node/flow scope
- **WHEN** `scope` is `"node"` or `"flow"` and `id` is not provided
- **THEN** the tool returns an error: `id is required for scope "<scope>"`

#### Scenario: Non-JSON value rejected
- **WHEN** `value` cannot be serialized to JSON (e.g., a function string)
- **THEN** the tool proceeds with the raw value as Node-RED handles serialization; any API error is surfaced
