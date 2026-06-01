## Purpose
MCP tool that returns the full detail of a specific node by ID, including large text fields excluded from `get-flow-nodes`.

## Requirements

### Requirement: get-node-detail MCP tool
The system SHALL expose an MCP tool named `get-node-detail` that accepts a `nodeId` (required string) and returns the full detail of the matching node, including all configuration fields (including large text fields such as `func` and `template` that are excluded from `get-flow-nodes`).

#### Scenario: Retrieve detail of a function node
- **WHEN** an MCP client invokes `get-node-detail` with `nodeId: "abc123"`
- **THEN** the system returns the node object with all fields including `id`, `type`, `name`, `z`, `x`, `y`, `wires`, and the full `func` JavaScript source

#### Scenario: Retrieve detail of a template node
- **WHEN** an MCP client invokes `get-node-detail` with the ID of a `template` node
- **THEN** the system returns the node object including the full `template` Mustache/HTML content

#### Scenario: Retrieve detail of a standard node
- **WHEN** an MCP client invokes `get-node-detail` with the ID of a `debug` node
- **THEN** the system returns the node object with all its configuration fields (e.g., `active`, `tosidebar`, `complete`)

### Requirement: Node not found error
When `get-node-detail` is invoked with a `nodeId` that does not match any node in the Node-RED instance, the tool SHALL return an error response indicating the node was not found.

#### Scenario: Unknown node ID
- **WHEN** `get-node-detail` is invoked with `nodeId: "does-not-exist"`
- **THEN** the tool returns an error: `Node 'does-not-exist' not found`
