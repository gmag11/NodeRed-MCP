## Purpose
MCP tools that add and remove wires between Node-RED nodes.

## Requirements

### Requirement: connect-nodes MCP tool
The system SHALL expose an MCP tool named `connect-nodes` that accepts `fromNodeId` (required string), `outputPort` (optional integer, default 0), `toNodeId` (required string), and `connections` (optional array of `{ outputPort: integer, toNodeId: string }` objects). When `connections` is provided, the tool SHALL apply all listed output-port→target pairs in a single operation and deploy once. When `connections` is absent, the tool SHALL behave as before: add `toNodeId` to `fromNode.wires[outputPort]` if not already present, then deploy with `Node-RED-Deployment-Type: flows`.

#### Scenario: Add a new wire
- **WHEN** `connect-nodes` is called with `fromNodeId: "a"`, `outputPort: 0`, `toNodeId: "b"` and no such wire exists
- **THEN** `"b"` is added to `node_a.wires[0]` and the flows are deployed

#### Scenario: Idempotent — wire already exists
- **WHEN** `connect-nodes` is called and the wire already exists
- **THEN** the tool returns success without duplicating the wire or re-deploying

#### Scenario: Multi-output node — non-zero output port
- **WHEN** `connect-nodes` is called with `outputPort: 1`
- **THEN** `toNodeId` is added to `fromNode.wires[1]`; `wires[0]` is padded with `[]` if it did not exist

#### Scenario: Batch connect multiple output ports
- **WHEN** `connect-nodes` is called with `fromNodeId: "sw"` and `connections: [{ outputPort: 0, toNodeId: "n1" }, { outputPort: 1, toNodeId: "n2" }, { outputPort: 2, toNodeId: "n3" }]`
- **THEN** `"n1"` is added to `wires[0]`, `"n2"` to `wires[1]`, `"n3"` to `wires[2]`, and the flows are deployed exactly once

#### Scenario: Batch connect — idempotent entries
- **WHEN** `connect-nodes` is called with `connections` that includes a pair already wired
- **THEN** the existing wire is not duplicated; only new wires are added; deployment still occurs once

#### Scenario: Batch connect — `outputPort` / `toNodeId` ignored when `connections` provided
- **WHEN** `connect-nodes` is called with both `toNodeId: "x"` and `connections: [{ outputPort: 1, toNodeId: "y" }]`
- **THEN** only `"y"` on port 1 is added; `"x"` is not wired

#### Scenario: Source node not found
- **WHEN** `fromNodeId` does not match any node
- **THEN** the tool returns an error: `Node '<fromNodeId>' not found`

#### Scenario: Target node not found
- **WHEN** `toNodeId` does not match any node
- **THEN** the tool returns an error: `Node '<toNodeId>' not found`

#### Scenario: Batch connect — target node not found
- **WHEN** `connections` references a `toNodeId` that does not exist
- **THEN** the tool returns an error: `Node '<toNodeId>' not found` and no changes are deployed

#### Scenario: Source node's parent flow is locked
- **WHEN** `fromNodeId` exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

### Requirement: connect-nodes returns wire state
The tool SHALL return `fromNodeId`, `previousWires` (the full `wires` array before the operation), and `currentWires` (after). When called in batch mode via `connections`, `outputPort` and `toNodeId` are omitted from the response; `connections` is echoed instead.

#### Scenario: Single-wire response shape
- **WHEN** `connect-nodes` is called with `fromNodeId`, `outputPort`, and `toNodeId`
- **THEN** the response includes `fromNodeId`, `outputPort`, `toNodeId`, `previousWires`, and `currentWires`

#### Scenario: Batch response shape
- **WHEN** `connect-nodes` is called with `connections`
- **THEN** the response includes `fromNodeId`, `connections`, `previousWires`, and `currentWires`

### Requirement: disconnect-nodes MCP tool
The system SHALL expose an MCP tool named `disconnect-nodes` that accepts `fromNodeId` (required string), `outputPort` (optional integer, default 0), `toNodeId` (optional string), `clearPort` (optional boolean, default false), and `connections` (optional array of `{ outputPort: integer, toNodeId: string }` objects). Modes of operation: (1) **single**: `toNodeId` provided — remove that one wire from `wires[outputPort]`; (2) **clear-port**: `clearPort: true`, `toNodeId` omitted — remove all wires from `wires[outputPort]`; (3) **batch**: `connections` provided — remove each listed wire; `clearPort` and `toNodeId` are ignored. All modes deploy once.

#### Scenario: Remove an existing wire
- **WHEN** `disconnect-nodes` is called with `fromNodeId`, `outputPort`, and `toNodeId` and the wire exists
- **THEN** `toNodeId` is removed from `fromNode.wires[outputPort]` and the flows are deployed

#### Scenario: Wire does not exist
- **WHEN** `disconnect-nodes` is called in single mode and the wire does not exist in `wires[outputPort]`
- **THEN** the tool returns an error: `Wire from '<fromNodeId>'[<outputPort>] to '<toNodeId>' does not exist`

#### Scenario: Clear all wires on an output port
- **WHEN** `disconnect-nodes` is called with `outputPort: 1` and `clearPort: true`
- **THEN** all targets are removed from `fromNode.wires[1]`; other ports are unchanged; flows are deployed

#### Scenario: Clear-port — port is already empty
- **WHEN** `disconnect-nodes` is called with `clearPort: true` on a port with no wires
- **THEN** the tool returns success without deploying

#### Scenario: Batch disconnect multiple wires
- **WHEN** `disconnect-nodes` is called with `fromNodeId: "sw"` and `connections: [{ outputPort: 0, toNodeId: "n1" }, { outputPort: 1, toNodeId: "n2" }]`
- **THEN** `"n1"` is removed from `wires[0]`, `"n2"` from `wires[1]`, and the flows are deployed once

#### Scenario: Batch disconnect — wire does not exist
- **WHEN** `connections` references a wire that does not exist
- **THEN** the tool returns an error: `Wire from '<fromNodeId>'[<outputPort>] to '<toNodeId>' does not exist` and no changes are deployed

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
The tool SHALL return `fromNodeId`, `previousWires`, and `currentWires`. In single mode `outputPort` and `toNodeId` are also included. In clear-port mode `outputPort` and `clearPort: true` are included. In batch mode `connections` is included.

#### Scenario: Single-wire response shape
- **WHEN** `disconnect-nodes` is called in single mode
- **THEN** the response includes `fromNodeId`, `outputPort`, `toNodeId`, `previousWires`, and `currentWires`

#### Scenario: Clear-port response shape
- **WHEN** `disconnect-nodes` is called with `clearPort: true`
- **THEN** the response includes `fromNodeId`, `outputPort`, `clearPort: true`, `previousWires`, and `currentWires`

#### Scenario: Batch response shape
- **WHEN** `disconnect-nodes` is called with `connections`
- **THEN** the response includes `fromNodeId`, `connections`, `previousWires`, and `currentWires`
