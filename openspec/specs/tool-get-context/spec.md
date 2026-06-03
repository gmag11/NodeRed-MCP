# tool-get-context Specification

## Purpose
TBD - created by archiving change tool-get-context. Update Purpose after archive.

## Requirements
### Requirement: get-context MCP tool
The system SHALL expose an MCP tool named `get-context` that accepts `scope` (required string, enum `"node"|"flow"|"global"`), `id` (required string for `node` and `flow` scopes; unused for `global`), and `key` (optional string). It SHALL call the appropriate Node-RED context API and return the value(s).

#### Scenario: Read a specific key from global context
- **WHEN** `get-context` is called with `scope: "global"` and `key: "counter"`
- **THEN** the tool returns `{ scope: "global", key: "counter", value: <current value> }`

#### Scenario: Read all keys from a flow context
- **WHEN** `get-context` is called with `scope: "flow"`, `id: "<flowId>"`, and no `key`
- **THEN** the tool returns `{ scope: "flow", id: "<flowId>", values: { <all key-value pairs> } }`

#### Scenario: Read a key from a node context
- **WHEN** `get-context` is called with `scope: "node"`, `id: "<nodeId>"`, and `key: "state"`
- **THEN** the tool returns the node's `state` context value

#### Scenario: Key does not exist
- **WHEN** the requested key has no value in the context store
- **THEN** the tool returns `{ value: null }` (not an error — absence is a valid state)

#### Scenario: id required for node/flow scope
- **WHEN** `scope` is `"node"` or `"flow"` and `id` is not provided
- **THEN** the tool returns an error: `id is required for scope "<scope>"`
