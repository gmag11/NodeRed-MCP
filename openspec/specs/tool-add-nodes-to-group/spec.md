## Purpose
MCP tool that adds nodes to a Node-RED group. If the group does not exist, it is created with a bounding rectangle that encloses all specified nodes.

## Requirements

### Requirement: add-nodes-to-group MCP tool
The system SHALL expose an MCP tool named `add-nodes-to-group` that accepts `flowId` (required string), `nodeIds` (required array of strings), and optional `groupId` (string), `groupName` (string), and `style` (object). The tool SHALL assign the specified nodes to a group, creating a new group if one does not exist.

#### Scenario: Add nodes to an existing group
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["A","B"]`, and `groupId: "grp1"`
- **THEN** nodes A and B have their `g` property set to `"grp1"`, and `"grp1"`'s `nodes[]` array is updated to include A and B

#### Scenario: Create a new group with default style
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["C","D"]`, and no `groupId`
- **THEN** a new `type: "group"` node is created with a generated UUID, default style, and a bounding rectangle that encloses all member nodes with 20px padding

#### Scenario: Create a new group with custom name and style
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["E"]`, `groupName: "Inputs"`, and `style: { fill: "#aaccff", stroke: "#0000ff" }`
- **THEN** the new group node has `name: "Inputs"` and the specified style properties are merged onto the default style

#### Scenario: Node already belongs to a different group
- **WHEN** a node has `g: "grp2"` and is added to `groupId: "grp1"`
- **THEN** the node is first removed from `"grp2"` (its ID removed from that group's `nodes[]`), then added to `"grp1"`

#### Scenario: All nodes must belong to the same flow
- **WHEN** any node in `nodeIds` has a `z` property that does not equal `flowId`
- **THEN** the tool returns an error: `All nodes must belong to flow '<flowId>'`

#### Scenario: Flow is locked
- **WHEN** `flowId` matches a tab that has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

### Requirement: add-nodes-to-group returns group and member state
The tool SHALL return `groupId`, `nodeIds` (members after the operation), `boundingBox`, and `created` (boolean indicating whether the group was newly created) in its response.

#### Scenario: Response for new group
- **WHEN** a new group is created
- **THEN** the response includes `created: true`, the new `groupId`, and the computed `boundingBox`
