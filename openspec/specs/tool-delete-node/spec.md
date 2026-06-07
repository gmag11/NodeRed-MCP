## Purpose
MCP tool that removes an existing node from a Node-RED flow.

## Requirements

### Requirement: delete-node MCP tool
The system SHALL expose an MCP tool named `delete-node` that accepts `nodeId` (required string). It SHALL remove the matching node from the flows array and deploy with `Node-RED-Deployment-Type: flows`. Dangling wire references to the deleted node in other nodes' `wires` arrays are handled automatically by Node-RED on deploy.

#### Scenario: Delete an existing node
- **WHEN** `delete-node` is invoked with a valid `nodeId`
- **THEN** the node is removed from the flows and the result is deployed

#### Scenario: Node not found
- **WHEN** `nodeId` does not match any node
- **THEN** the tool returns an error: `Node '<nodeId>' not found`

#### Scenario: Node's parent flow is locked
- **WHEN** the node exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

#### Scenario: Other nodes are unaffected
- **WHEN** a node is deleted
- **THEN** all other nodes in the flows array remain unchanged

### Requirement: delete-node returns previous state
The tool SHALL return `nodeId` and `previousState` (the full node object as it was before deletion) in its response.

#### Scenario: Response shape
- **WHEN** a node is successfully deleted
- **THEN** the response contains `nodeId` and `previousState` as a JSON object

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
