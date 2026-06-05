## ADDED Requirements

### Requirement: update-group MCP tool
The system SHALL expose an MCP tool named `update-group` that accepts `groupId` (required string) and `properties` (required object). The tool SHALL shallow-merge `properties` onto the group node's configuration and deploy. It SHALL validate that the target node is a `type: "group"` node.

#### Scenario: Update group name
- **WHEN** `update-group` is invoked with `groupId: "grp1"` and `properties: { name: "Core Processing" }`
- **THEN** the group's `name` is changed to `"Core Processing"` and all other fields are preserved

#### Scenario: Update group style
- **WHEN** `update-group` is invoked with `properties: { style: { fill: "#ffcccc", "label-position": "se" } }`
- **THEN** the group's `style.fill` becomes `"#ffcccc"` and `style.label-position` becomes `"se"`, while `style.stroke` and `style.label` are preserved

#### Scenario: Update bounding box
- **WHEN** `update-group` is invoked with `properties: { x: 50, y: 50, w: 400, h: 200 }`
- **THEN** the group's position and dimensions are updated without affecting member nodes

#### Scenario: Target is not a group
- **WHEN** `groupId` matches a node that is not `type: "group"` (e.g., a regular node or a tab)
- **THEN** the tool returns an error: `Node '<groupId>' is not a group`

#### Scenario: Group not found
- **WHEN** `groupId` does not match any node
- **THEN** the tool returns an error: `Group '<groupId>' not found`

#### Scenario: Locked flow
- **WHEN** the group's parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked`

#### Scenario: Reject wires in properties
- **WHEN** `properties` contains a `wires` key
- **THEN** the tool returns an error directing the agent to use `connect-nodes` or `disconnect-nodes`

### Requirement: update-group returns previous and current state
The tool SHALL return `groupId`, `previousState` (the full group node before update), and `currentState` (the full group node after update) in its response.

#### Scenario: Response shape
- **WHEN** a group is successfully updated
- **THEN** the response contains `groupId`, `previousState`, and `currentState` as a JSON object
