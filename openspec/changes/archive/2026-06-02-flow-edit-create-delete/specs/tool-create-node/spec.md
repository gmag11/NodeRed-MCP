## Purpose
MCP tool that creates a new node of any installed palette type inside a specified Node-RED flow.

## Requirements

### Requirement: create-node MCP tool
The system SHALL expose an MCP tool named `create-node` that accepts `type` (required string), `flowId` (required string), `properties` (optional object), `x` (optional number, default 200), and `y` (optional number, default 200). It SHALL assemble a valid node object, append it to the flows, and deploy with `Node-RED-Deployment-Type: flows`.

#### Scenario: Create a minimal node
- **WHEN** `create-node` is invoked with `type: "debug"` and `flowId: "flow1"`
- **THEN** a new node with a generated UUID, `type: "debug"`, `z: "flow1"`, `x: 200`, `y: 200`, and `wires: [[]]` is added to the flows and deployed

#### Scenario: Create a node with properties
- **WHEN** `create-node` is invoked with `type: "function"`, `flowId: "flow1"`, and `properties: { name: "My Fn", func: "return msg;" }`
- **THEN** the new node includes `name: "My Fn"` and `func: "return msg;"` alongside the structural fields

#### Scenario: Properties cannot override structural fields
- **WHEN** `properties` contains `id`, `z`, or `wires`
- **THEN** those fields are silently stripped and the tool's own values are used

#### Scenario: Flow not found
- **WHEN** `flowId` does not match any tab or subflow
- **THEN** the tool returns an error: `Flow '<flowId>' not found`

#### Scenario: Target flow is locked
- **WHEN** `flowId` matches a tab that has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

#### Scenario: Custom position
- **WHEN** `x: 500` and `y: 300` are provided
- **THEN** the new node has `x: 500` and `y: 300`

### Requirement: create-node returns new node state
The tool SHALL return `nodeId` (the generated ID) and `currentState` (the full node object as stored) in its response.
