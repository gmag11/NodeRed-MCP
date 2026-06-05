## ADDED Requirements

### Requirement: add-nodes-to-group MCP tool
The system SHALL expose an MCP tool named `add-nodes-to-group` that accepts `flowId` (required string), `nodeIds` (required array of strings), and optional `groupId` (string), `groupName` (string), and `style` (object). The tool SHALL assign the specified nodes to a group, creating a new group if one does not exist.

#### Scenario: Add nodes to an existing group
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["A","B"]`, and `groupId: "grp1"`
- **THEN** nodes A and B have their `g` property set to `"grp1"`, and `"grp1"`'s `nodes[]` array is updated to include A and B

#### Scenario: Create a new group with default style
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["C","D"]`, and no `groupId`
- **THEN** a new `type: "group"` node is created with a generated UUID, `name` derived from members or defaulting to `"Group"`, default style (`fill: "#ffff7f"`, `fill-opacity: "0.5"`, `stroke: "#000000"`, `label: true`, `label-position: "nw"`, `color: "#000000"`), and a bounding rectangle that encloses all member nodes with 20px padding

#### Scenario: Create a new group with custom name and style
- **WHEN** `add-nodes-to-group` is invoked with `flowId: "tab1"`, `nodeIds: ["E"]`, `groupName: "Inputs"`, and `style: { fill: "#aaccff", stroke: "#0000ff" }`
- **THEN** the new group node has `name: "Inputs"` and the specified style properties are merged onto the default style

#### Scenario: New group encloses all members
- **WHEN** a new group is created for nodes at positions (100,100), (300,100), and (100,300)
- **THEN** the group's bounding rectangle has `x ≤ 80` (minX - 20), `y ≤ 80` (minY - 20), `w ≥ 240` (maxX - minX + 40), and `h ≥ 240` (maxY - minY + 40)

#### Scenario: All nodes must belong to the same flow
- **WHEN** any node in `nodeIds` has a `z` property that does not equal `flowId`
- **THEN** the tool returns an error: `All nodes must belong to flow '<flowId>'`

#### Scenario: Node not found
- **WHEN** any node in `nodeIds` does not exist in the flows
- **THEN** the tool returns an error: `Node '<nodeId>' not found`

#### Scenario: Existing group not found
- **WHEN** `groupId` is provided but does not match any `type: "group"` node
- **THEN** the tool returns an error: `Group '<groupId>' not found`

#### Scenario: Idempotent addition
- **WHEN** a node is already a member of the target group
- **THEN** the node's `g` property and the group's `nodes[]` array are unchanged (no duplicate entries)

#### Scenario: Node already belongs to a different group
- **WHEN** a node has `g: "grp2"` and is added to `groupId: "grp1"`
- **THEN** the node is first removed from `"grp2"` (its ID removed from that group's `nodes[]`), then added to `"grp1"`

#### Scenario: Flow is locked
- **WHEN** `flowId` matches a tab that has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

### Requirement: add-nodes-to-group returns group and member state
The tool SHALL return `groupId` (the group's ID), `groupName`, `nodeIds` (members after the operation), `boundingBox` (`{ x, y, w, h }`), and `created` (boolean indicating whether the group was newly created) in its response.

#### Scenario: Response for existing group
- **WHEN** nodes are added to an existing group
- **THEN** the response includes `created: false` and the updated `nodeIds` list

#### Scenario: Response for new group
- **WHEN** a new group is created
- **THEN** the response includes `created: true`, the new `groupId`, and the computed `boundingBox`
