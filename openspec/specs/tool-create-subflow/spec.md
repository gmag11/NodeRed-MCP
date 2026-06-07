## Requirements

### Requirement: create-subflow MCP tool
The system SHALL expose an MCP tool named `create-subflow` that accepts `name` (required string), `info` (optional string), `category` (optional string), `color` (optional string), `icon` (optional string), `in` (optional array of port definitions), and `out` (optional array of port definitions). It SHALL create a new `type: "subflow"` node and deploy immediately.

#### Scenario: Create a minimal subflow
- **WHEN** `create-subflow` is invoked with only `name: "My Subflow"`
- **THEN** a new subflow definition is created with `name: "My Subflow"`, empty `in` and `out` arrays, and the response includes `subflowId` and `currentState`

#### Scenario: Create with description
- **WHEN** `create-subflow` is invoked with `info: "Processes incoming sensor data"`
- **THEN** the created subflow SHALL have `info: "Processes incoming sensor data"`

#### Scenario: Create with palette metadata
- **WHEN** `create-subflow` is invoked with `category: "custom"`, `color: "#DDAA99"`, `icon: "node-red/subflow.svg"`
- **THEN** the created subflow SHALL include those palette metadata fields

#### Scenario: Create with input and output ports
- **WHEN** `create-subflow` is invoked with `in: [{ x: 100, y: 100, wires: [{ id: "node123", port: 0 }] }]` and `out: [{ x: 400, y: 100, wires: [{ id: "node456", port: 0 }] }]`
- **THEN** the created subflow SHALL have those `in` and `out` definitions

### Requirement: create-subflow generates a unique ID
The tool SHALL generate a UUID for the new subflow definition using `crypto.randomUUID()`.

#### Scenario: Generated ID is a valid UUID
- **WHEN** a subflow is created
- **THEN** the `subflowId` in the response SHALL be a valid UUID v4 string

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
