## Purpose
MCP tools that add and remove wires between Node-RED nodes.

## Requirements

### Requirement: connect-nodes MCP tool
The system SHALL expose an MCP tool named `connect-nodes` that accepts `fromNodeId` (required string), `outputPort` (optional integer, default 0), and `toNodeId` (required string). It SHALL add `toNodeId` to `fromNode.wires[outputPort]` if not already present, then deploy with `Node-RED-Deployment-Type: flows`.

#### Scenario: Add a new wire
- **WHEN** `connect-nodes` is called with `fromNodeId: "a"`, `outputPort: 0`, `toNodeId: "b"` and no such wire exists
- **THEN** `"b"` is added to `node_a.wires[0]` and the flows are deployed

#### Scenario: Idempotent — wire already exists
- **WHEN** `connect-nodes` is called and the wire already exists
- **THEN** the tool returns success without duplicating the wire or re-deploying

#### Scenario: Multi-output node — non-zero output port
- **WHEN** `connect-nodes` is called with `outputPort: 1`
- **THEN** `toNodeId` is added to `fromNode.wires[1]`; `wires[0]` is padded with `[]` if it did not exist

#### Scenario: Source node not found
- **WHEN** `fromNodeId` does not match any node
- **THEN** the tool returns an error: `Node '<fromNodeId>' not found`

#### Scenario: Target node not found
- **WHEN** `toNodeId` does not match any node
- **THEN** the tool returns an error: `Node '<toNodeId>' not found`

#### Scenario: Source node's parent flow is locked
- **WHEN** `fromNodeId` exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

### Requirement: connect-nodes returns wire state
The tool SHALL return `fromNodeId`, `outputPort`, `toNodeId`, `previousWires` (the full `wires` array before), and `currentWires` (after) in its response.

### Requirement: disconnect-nodes MCP tool
The system SHALL expose an MCP tool named `disconnect-nodes` that accepts `fromNodeId` (required string), `outputPort` (optional integer, default 0), and `toNodeId` (required string). It SHALL remove `toNodeId` from `fromNode.wires[outputPort]`, then deploy.

#### Scenario: Remove an existing wire
- **WHEN** `disconnect-nodes` is called and the wire exists
- **THEN** `toNodeId` is removed from `fromNode.wires[outputPort]` and the flows are deployed

#### Scenario: Wire does not exist
- **WHEN** `disconnect-nodes` is called and the wire does not exist in `wires[outputPort]`
- **THEN** the tool returns an error: `Wire from '<fromNodeId>'[<outputPort>] to '<toNodeId>' does not exist`

#### Scenario: Source node not found
- **WHEN** `fromNodeId` does not match any node
- **THEN** the tool returns an error: `Node '<fromNodeId>' not found`

#### Scenario: Source node's parent flow is locked
- **WHEN** `fromNodeId` exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

#### Scenario: Other ports unaffected
- **WHEN** a wire is removed from `outputPort: 1`
- **THEN** `wires[0]` and any other ports are unchanged

### Requirement: disconnect-nodes returns wire state
The tool SHALL return `fromNodeId`, `outputPort`, `toNodeId`, `previousWires`, and `currentWires` in its response.
