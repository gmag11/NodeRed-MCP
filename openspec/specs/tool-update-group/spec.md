## Purpose
MCP tool that modifies a Node-RED group's metadata (name, style, bounding box). Validates the target is a group node before applying changes.

## Requirements

### Requirement: update-group MCP tool
The system SHALL expose an MCP tool named `update-group` that accepts `groupId` (required string) and `properties` (required object). The tool SHALL shallow-merge `properties` onto the group node's configuration and deploy. It SHALL validate that the target node is a `type: "group"` node.

#### Scenario: Update group name
- **WHEN** `update-group` is invoked with `groupId: "grp1"` and `properties: { name: "Core Processing" }`
- **THEN** the group's `name` is changed to `"Core Processing"` and all other fields are preserved

#### Scenario: Update group style
- **WHEN** `update-group` is invoked with `properties: { style: { fill: "#ffcccc", "label-position": "se" } }`
- **THEN** the group's `style` is replaced with the provided object (shallow merge)

#### Scenario: Target is not a group
- **WHEN** `groupId` matches a node that is not `type: "group"` (e.g., a regular node or a tab)
- **THEN** the tool returns an error: `Node '<groupId>' is not a group`

#### Scenario: Locked flow
- **WHEN** the group's parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

### Requirement: update-group returns previous and current state
The tool SHALL return `previousState` and `currentState` in its response.

#### Scenario: Response shape
- **WHEN** a group is successfully updated
- **THEN** the response contains `groupId`, `previousState`, and `currentState`

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
