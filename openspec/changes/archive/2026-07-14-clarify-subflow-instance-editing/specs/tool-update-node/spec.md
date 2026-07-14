## MODIFIED Requirements

### Requirement: update-node MCP tool
The system SHALL expose an MCP tool named `update-node` that accepts a `nodeId` (required string) and a `properties` (required object) and shallow-merges `properties` onto the existing node's configuration, then deploys the updated flows with `Node-RED-Deployment-Type: flows`. This tool works on ANY node type: regular flow nodes, subflow instances (`type: "subflow:<uuid>"`), and subflow definitions (`type: "subflow"`).

#### Scenario: Update a single property
- **WHEN** `update-node` is invoked with `nodeId: "abc"` and `properties: { name: "New Name" }`
- **THEN** the node's `name` is changed to `"New Name"` and all other fields are preserved

#### Scenario: Update multiple properties
- **WHEN** `properties` contains multiple keys
- **THEN** all specified fields are updated and unmentioned fields are preserved

#### Scenario: Node not found
- **WHEN** `nodeId` does not match any node in the flows
- **THEN** the tool returns an error: `Node '<nodeId>' not found`

#### Scenario: `wires` in properties is rejected
- **WHEN** `properties` contains a `wires` key
- **THEN** the tool returns an error directing the agent to use `connect-nodes` or `disconnect-nodes`

#### Scenario: Node's parent flow is locked
- **WHEN** the node exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

## ADDED Requirements

### Requirement: update-node edits subflow instances
The `update-node` tool SHALL successfully edit subflow instance nodes (nodes with `type: "subflow:<uuid>"`) using the same shallow-merge mechanism as regular nodes.

#### Scenario: Edit subflow instance name
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { name: "My Instance" }`
- **THEN** the instance's `name` SHALL be updated and the `type` SHALL remain `"subflow:<uuid>"`

#### Scenario: Edit subflow instance environment variables
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { env: [{ name: "VAR", value: "val", type: "str" }] }`
- **THEN** the instance's `env` array SHALL be replaced with the new value

#### Scenario: Edit subflow instance position
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { x: 500, y: 300 }`
- **THEN** the instance's canvas position SHALL be updated
