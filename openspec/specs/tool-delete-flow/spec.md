## Requirements

### Requirement: delete-flow MCP tool
The system SHALL expose an MCP tool named `delete-flow` that accepts `flowId` (required string). It SHALL fetch the current flow state via `GET /flow/:id`, then delete it via `DELETE /flow/:id`, and return the full previous state (tab metadata and contained nodes).

#### Scenario: Delete an existing flow
- **WHEN** `delete-flow` is invoked with a valid `flowId`
- **THEN** the flow tab and all its nodes are deleted from Node-RED

#### Scenario: Flow not found
- **WHEN** `flowId` does not match any flow in Node-RED
- **THEN** the tool returns an error: `Flow '<flowId>' not found`

#### Scenario: Flow is locked
- **WHEN** the flow exists but has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any DELETE call

#### Scenario: Other flows unaffected
- **WHEN** a flow is deleted
- **THEN** all other flows and their nodes remain unchanged

### Requirement: delete-flow returns previous state
The tool SHALL return `flowId` and `previousState` (the full `GET /flow/:id` response, including the `nodes` array) before deletion.

#### Scenario: previousState includes nodes
- **WHEN** a flow containing three nodes is deleted
- **THEN** `previousState.nodes` contains all three node objects as they were before deletion

### Requirement: Stage flow operations locally
The tool SHALL modify the local staging store using a pure `apply*` function on the flows array, rather than calling the individual Node-RED flow API endpoints (`POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`).

#### Scenario: Flow operation is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store flows array
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
