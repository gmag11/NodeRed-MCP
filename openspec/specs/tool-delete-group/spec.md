## Purpose
MCP tool that deletes a Node-RED group and optionally its member nodes.

## Requirements

### Requirement: delete-group MCP tool
The system SHALL expose an MCP tool named `delete-group` that accepts `groupId` (required string) and optional `deleteMembers` (boolean, default `true`). The tool SHALL remove the group node from the flows and optionally delete its member nodes.

#### Scenario: Delete group with members
- **WHEN** `delete-group` is invoked with `groupId: "grp1"` and `deleteMembers: true` (or default)
- **THEN** all member nodes and the group node itself are removed from the flows and deployed

#### Scenario: Delete group without members
- **WHEN** `delete-group` is invoked with `groupId: "grp1"` and `deleteMembers: false`
- **THEN** the `g` property is removed from all member nodes, their IDs are removed from the group's `nodes[]` array, and only the group node is deleted

#### Scenario: Group not found
- **WHEN** `groupId` does not match any `type: "group"` node
- **THEN** the tool returns an error: `Group '<groupId>' not found`

#### Scenario: Locked flow
- **WHEN** the group's parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

### Requirement: delete-group returns deleted state for undo
The tool SHALL return `previousState` (an object containing `group` and `members`) in its response, enabling the agent to reconstruct the group if needed.

#### Scenario: Response includes full previous state
- **WHEN** a group with 3 members is deleted
- **THEN** `previousState.group` contains the full group node, and `previousState.members` contains all 3 member node objects as they were before deletion

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
