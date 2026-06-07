## Purpose
MCP tool that returns the full detail of a specific node by ID, including large text fields excluded from `get-flow-nodes`.

## Requirements

### Requirement: get-node-detail MCP tool
The system SHALL expose an MCP tool named `get-node-detail` that accepts a `nodeId` (required string) and returns the full detail of the matching node, including all configuration fields (including large text fields such as `func` and `template` that are excluded from `get-flow-nodes`).

For config nodes (nodes that may have credentials), the tool SHALL additionally query `GET /credentials/:type/:id` and include the response as a `_credentials` field containing credential metadata: field names and `has_<field>: true/false` for password-type fields. Password values are never exposed.

#### Scenario: Retrieve detail of a function node
- **WHEN** an MCP client invokes `get-node-detail` with `nodeId: "abc123"`
- **THEN** the system returns the node object with all fields including `id`, `type`, `name`, `z`, `x`, `y`, `wires`, and the full `func` JavaScript source

#### Scenario: Retrieve detail of a template node
- **WHEN** an MCP client invokes `get-node-detail` with the ID of a `template` node
- **THEN** the system returns the node object including the full `template` Mustache/HTML content

#### Scenario: Retrieve detail of a standard node
- **WHEN** an MCP client invokes `get-node-detail` with the ID of a `debug` node
- **THEN** the system returns the node object with all its configuration fields (e.g., `active`, `tosidebar`, `complete`)

#### Scenario: Retrieve detail of a config node with credentials
- **WHEN** an MCP client invokes `get-node-detail` with the ID of an `mqtt-broker` node that has credentials configured
- **THEN** the response includes `_credentials: { user: "test67", has_password: true }` showing the credential field names and whether password-type fields are set (password values are never exposed)

#### Scenario: Retrieve detail of a config node without credentials
- **WHEN** an MCP client invokes `get-node-detail` with the ID of a config node that has no credentials registered
- **THEN** the `_credentials` field is absent from the response

### Requirement: Node not found error
When `get-node-detail` is invoked with a `nodeId` that does not match any node in the Node-RED instance, the tool SHALL return an error response indicating the node was not found.

#### Scenario: Unknown node ID
- **WHEN** `get-node-detail` is invoked with `nodeId: "does-not-exist"`
- **THEN** the tool returns an error: `Node 'does-not-exist' not found`

### Requirement: Credential metadata
For nodes that support credentials, the tool SHALL include a `_credentials` object with credential metadata obtained from `GET /credentials/:type/:id`. Password-type fields are masked: the actual password value is never returned, only `has_<field>: true/false`. Non-password credential fields (e.g., `username`, `user`) are returned with their actual values. If the credentials endpoint returns an empty object or fails, the `_credentials` field is absent.

#### Scenario: Credential metadata shows password presence
- **WHEN** `get-node-detail` is invoked on an `mqtt-broker` with a configured password
- **THEN** `_credentials.has_password` is `true` and the actual password value is NOT present

#### Scenario: Credential metadata absent for non-config nodes
- **WHEN** `get-node-detail` is invoked on a `function` or `debug` node
- **THEN** the `_credentials` field is absent (these node types don't have credentials)

### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.
