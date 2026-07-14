## Requirements

### Requirement: update-subflow MCP tool
The system SHALL expose an MCP tool named `update-subflow` that accepts `subflowId` (required string) and `updates` (required object). It SHALL merge the provided fields into the existing subflow definition and deploy immediately. Allowed fields SHALL be: `name`, `info`, `category`, `color`, `icon`, `in`, `out`. This tool ONLY operates on subflow definitions (`type: "subflow"`). For editing subflow instances placed on flow tabs (nodes with `type: "subflow:<uuid>"`), agents SHALL use `update-node` instead.

#### Scenario: Update subflow name
- **WHEN** `update-subflow` is invoked with `updates: { name: "New Name" }`
- **THEN** the subflow's name SHALL be updated and all other fields preserved

#### Scenario: Update info description
- **WHEN** `update-subflow` is invoked with `updates: { info: "Updated description" }`
- **THEN** the subflow's `info` SHALL be updated

#### Scenario: Update output ports
- **WHEN** `update-subflow` is invoked with `updates: { out: [{ x: 600, y: 80, wires: [{ id: "node1", port: 0 }] }] }`
- **THEN** the subflow's `out` array SHALL be replaced with the new value

#### Scenario: Partial merge preserves unspecified fields
- **WHEN** `update-subflow` is invoked with only `updates: { name: "Renamed" }`
- **THEN** fields like `info`, `in`, `out`, `category`, `color`, `icon` SHALL retain their existing values

#### Scenario: Unknown subflowId
- **WHEN** `update-subflow` is invoked with a `subflowId` that does not match any `type: "subflow"` node
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' not found`

#### Scenario: Refuse to update locked subflow
- **WHEN** `update-subflow` is invoked on a locked subflow
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' is locked`

#### Scenario: Empty updates rejected
- **WHEN** `update-subflow` is invoked with an empty `updates` object
- **THEN** the tool SHALL return an error: `No properties to update`

#### Scenario: Response includes previous and current state
- **WHEN** a subflow is successfully updated
- **THEN** the response SHALL contain `subflowId`, `previousState`, and `currentState`

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`

### Requirement: update-subflow detects type mismatch on instances
When `update-subflow` receives a `subflowId` that matches a node whose `type` starts with `"subflow:"` (a subflow instance) rather than exactly `"subflow"` (a definition), the tool SHALL return a specific error message that explains the distinction and redirects to `update-node`.

#### Scenario: Subflow instance passed as subflowId
- **WHEN** `update-subflow` is invoked with a `subflowId` matching a node with `type: "subflow:<uuid>"`
- **THEN** the tool SHALL return an error: `Node '<subflowId>' is a subflow instance (type: 'subflow:...'), not a subflow definition. Use update-node to edit subflow instances.`

#### Scenario: Subflow definition passed correctly
- **WHEN** `update-subflow` is invoked with a `subflowId` matching a node with `type: "subflow"`
- **THEN** the tool SHALL proceed with the normal update flow (no type-mismatch error)
