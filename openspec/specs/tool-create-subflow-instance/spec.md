## ADDED Requirements

### Requirement: create-subflow-instance MCP tool
The system SHALL expose an MCP tool named `create-subflow-instance` that accepts `subflowId` (required string), `flowId` (required string), `name` (optional string), `env` (optional array of `{ name, value, type }`), `x` (optional number, default 200), and `y` (optional number, default 200). It SHALL create a new node of type `subflow:<subflowId>` in the specified flow tab and deploy immediately.

#### Scenario: Create a minimal instance
- **WHEN** `create-subflow-instance` is invoked with a valid `subflowId` and `flowId`
- **THEN** a new instance node is created with auto-sized empty `wires` matching the subflow's output count, and the response includes `nodeId` and `currentState`

#### Scenario: Create instance with custom name
- **WHEN** `create-subflow-instance` is invoked with `name: "My Processor"`
- **THEN** the created instance SHALL have `name: "My Processor"`

#### Scenario: Create instance with environment variables
- **WHEN** `create-subflow-instance` is invoked with `env: [{ name: "THRESHOLD", value: "42", type: "num" }]`
- **THEN** the created instance SHALL have the specified `env` array

#### Scenario: Unknown subflowId
- **WHEN** `create-subflow-instance` is invoked with a `subflowId` that does not match any `type: "subflow"` node
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' not found`

#### Scenario: Unknown flowId
- **WHEN** `create-subflow-instance` is invoked with a `flowId` that does not match any `type: "tab"` node
- **THEN** the tool SHALL return an error: `Flow '<flowId>' not found`

#### Scenario: Refuse to instantiate in a locked flow
- **WHEN** `create-subflow-instance` is invoked with a `flowId` pointing to a locked flow tab
- **THEN** the tool SHALL return an error: `Flow '<flowId>' is locked`

#### Scenario: Auto-size wires to match output count
- **WHEN** a subflow has 4 output ports (`out` array length 4)
- **THEN** the created instance SHALL have `wires: [[], [], [], []]`

#### Scenario: Position defaults
- **WHEN** `create-subflow-instance` is invoked without `x` or `y`
- **THEN** the instance SHALL be placed at `x: 200, y: 200`
