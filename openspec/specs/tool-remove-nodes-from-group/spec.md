## Purpose
MCP tool that removes nodes from a Node-RED group. Optionally repositions detached nodes outside the group's bounding rectangle.

## Requirements

### Requirement: remove-nodes-from-group MCP tool
The system SHALL expose an MCP tool named `remove-nodes-from-group` that accepts `groupId` (required string) and optional `nodeIds` (array of strings) and `reposition` (boolean). The tool SHALL detach the specified nodes from the group and optionally reposition them outside the group's bounding rectangle.

#### Scenario: Remove specific nodes from a group
- **WHEN** `remove-nodes-from-group` is invoked with `groupId: "grp1"` and `nodeIds: ["A","B"]`
- **THEN** nodes A and B have their `g` property removed, and their IDs are removed from the group's `nodes[]` array

#### Scenario: Remove all nodes from a group
- **WHEN** `remove-nodes-from-group` is invoked with `groupId: "grp1"` and no `nodeIds`
- **THEN** all member nodes have their `g` property removed, and the group's `nodes[]` array is emptied

#### Scenario: Reposition nodes outside group bounds
- **WHEN** `remove-nodes-from-group` is invoked with `groupId: "grp1"`, `nodeIds: ["A"]`, and `reposition: true`
- **THEN** node A is moved to `x = group.x + group.w + 40` (right of the group), keeping its `y` position

#### Scenario: Node not in group
- **WHEN** a specified `nodeId` is not a member of the group (its `g` does not equal `groupId`)
- **THEN** the node is silently skipped, but a warning is included in the response

#### Scenario: Locked flow
- **WHEN** the group's parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

### Requirement: remove-nodes-from-group returns updated state
The tool SHALL return `removedNodeIds`, `remainingNodeIds`, and `repositionedNodes` in its response.

#### Scenario: Response includes removal details
- **WHEN** nodes are successfully removed from a group
- **THEN** the response lists which nodes were removed and which remain

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
