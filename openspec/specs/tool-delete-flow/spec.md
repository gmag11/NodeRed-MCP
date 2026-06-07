## Requirements

### Requirement: delete-flow MCP tool
The system SHALL expose an MCP tool named `delete-flow` that accepts `flowId` (required string). It SHALL fetch the current flow state, validate the deletion against business rules, then stage the deletion, and return the full previous state (tab metadata and contained nodes).

#### Scenario: Delete an existing flow
- **WHEN** `delete-flow` is invoked with a valid `flowId`
- **THEN** the flow tab and all its nodes are deleted from Node-RED

#### Scenario: Flow not found
- **WHEN** `flowId` does not match any flow in Node-RED
- **THEN** the tool returns an error: `Flow '<flowId>' not found`

#### Scenario: Flow is locked
- **WHEN** the flow exists but has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any DELETE call

#### Scenario: Last flow cannot be deleted
- **WHEN** the flow exists, is not locked, but is the only remaining flow tab in the Node-RED instance
- **THEN** the tool returns an error: `"Cannot delete the last flow — at least one flow tab must exist"` without staging any deletion

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

### Requirement: Last-flow deletion guard
The system SHALL prevent deletion of the last remaining flow tab. Before staging a deletion, the tool SHALL count all nodes with `type: "tab"` in the current flow state. If the count is 1 and the target flow is that sole tab, the tool SHALL reject the deletion with an error.

#### Scenario: Single flow exists, deletion attempted
- **WHEN** the Node-RED instance has exactly one flow tab and `delete-flow` is called with that tab's `flowId`
- **THEN** the tool returns an error: `"Cannot delete the last flow — at least one flow tab must exist"`
- **THEN** no changes are staged

#### Scenario: Multiple flows exist, one is deleted
- **WHEN** the Node-RED instance has two or more flow tabs and `delete-flow` is called with a valid, unlocked `flowId`
- **THEN** the deletion proceeds normally without triggering the last-flow guard
