## Purpose
MCP tool that modifies the configuration properties of an existing Node-RED node.

## Requirements

### Requirement: update-node MCP tool
The system SHALL expose an MCP tool named `update-node` that accepts a `nodeId` (required string) and a `properties` (required object) and shallow-merges `properties` onto the existing node's configuration, then deploys the updated flows with `Node-RED-Deployment-Type: flows`.

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

### Requirement: update-node returns previous and current state
The tool SHALL include `previousState` (the full node object before the update) and `currentState` (the full node object after the update) in its response alongside `nodeId`.

#### Scenario: Response shape
- **WHEN** a node is successfully updated
- **THEN** the response contains `nodeId`, `previousState`, and `currentState` as a JSON object

### Requirement: update-node round-trips the revision token
The tool SHALL include the `rev` field from `GET /flows` in the `PUT /flows` request body to prevent overwriting concurrent changes.

#### Scenario: Conflict on stale revision
- **WHEN** Node-RED returns a 409 response (revision mismatch)
- **THEN** the tool returns an error indicating the flows were modified concurrently and the agent should retry
