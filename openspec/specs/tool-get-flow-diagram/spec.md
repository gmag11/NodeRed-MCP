# tool-get-flow-diagram Specification

## Purpose
TBD - created by archiving change tool-get-flow-nodes. Update Purpose after archive.
## Requirements
### Requirement: get-flow-diagram MCP tool
The system SHALL expose an MCP tool named `get-flow-diagram` that accepts a `flowId` (required) and returns a Mermaid flowchart (`flowchart TD`) representing the topology of nodes and their connections within that flow.

#### Scenario: Diagram of a simple flow
- **WHEN** a flow contains nodes A (inject) → B (function) → C (debug) connected via wires
- **THEN** the tool returns a valid Mermaid `flowchart TD` string with nodes labeled by their name or type and edges representing wire connections

#### Scenario: Flow not found
- **WHEN** `get-flow-diagram` is invoked with a `flowId` that does not match any tab or subflow
- **THEN** the tool returns an error indicating the flow was not found

#### Scenario: Empty flow
- **WHEN** a flow exists but contains no nodes
- **THEN** the tool returns a Mermaid diagram with only a comment indicating the flow is empty

### Requirement: Disabled node styling
Disabled nodes SHALL be visually distinguished in the Mermaid diagram using a dashed border style and a CSS class `disabled`.

#### Scenario: Mix of enabled and disabled nodes
- **WHEN** a flow has nodes A (enabled), B (disabled), and C (enabled)
- **THEN** node B is rendered with `:::disabled` class and the diagram includes a `classDef disabled` style with dashed stroke

### Requirement: Node labels in diagram
Each node in the Mermaid diagram SHALL be labeled with its `name` if available, otherwise with its `type`. The node ID SHALL be used as the Mermaid node identifier.

#### Scenario: Node with name
- **WHEN** a node has `name: "Parse JSON"` and `type: "json"`
- **THEN** the Mermaid node label displays `"Parse JSON"`

#### Scenario: Node without name
- **WHEN** a node has `type: "inject"` and no `name` field
- **THEN** the Mermaid node label displays `"inject"`

### Requirement: Multiple output ports
The diagram SHALL correctly represent nodes with multiple output ports. Each output port index SHALL be reflected in the edge labels when a node has more than one output.

#### Scenario: Switch node with two outputs
- **WHEN** a `switch` node has `wires: [["nodeA"], ["nodeB"]]`
- **THEN** the diagram shows two edges: one from switch to nodeA (labeled "out1") and one from switch to nodeB (labeled "out2")

#### Scenario: Single output port
- **WHEN** a node has `wires: [["nodeA"]]` (single output)
- **THEN** the edge has no output port label (clean connection)

### Requirement: Diagram filtering
The `get-flow-diagram` tool SHALL accept the same optional filter parameters as `get-flow-nodes`: `disabledOnly`, `nodeType`, `fromNodeId`, and `direction`. Filters SHALL be applied before generating the Mermaid diagram. The `direction` parameter (`"downstream"`, `"upstream"`, or `"both"`, default `"both"`) SHALL control the traversal direction when `fromNodeId` is provided.

#### Scenario: Diagram filtered by connected subgraph (downstream)
- **WHEN** `fromNodeId` is provided with `direction: "downstream"`
- **THEN** only the downstream nodes reachable from that node are rendered in the diagram

#### Scenario: Diagram filtered by connected subgraph (default both)
- **WHEN** `fromNodeId` is provided without `direction`
- **THEN** the full connected component containing that node is rendered in the diagram

#### Scenario: Diagram filtered by node type
- **WHEN** `nodeType: "function"` is provided
- **THEN** only function nodes and their mutual connections are shown

### Requirement: Diagram pagination
The tool SHALL accept optional `offset` (default 0) and `limit` (default 50) parameters. When paginating, the diagram SHALL render only the nodes in the current page. The response SHALL include `totalCount`, `offset`, `limit`, and `hasMore` metadata alongside the Mermaid string.

#### Scenario: Large flow paginated diagram
- **WHEN** a flow has 200 nodes and `limit: 50` is set
- **THEN** the diagram shows only the first 50 nodes and their interconnections, with `hasMore: true`

### Requirement: Group rendering in Mermaid diagrams
The `get-flow-diagram` tool SHALL render group nodes as Mermaid `subgraph` containers. Nodes belonging to a group SHALL be rendered inside the subgraph. Group style properties SHALL be reflected in the subgraph styling.

#### Scenario: Single group with members
- **WHEN** a flow has a group `"grp1"` named `"Inputs"` containing nodes A and B
- **THEN** the Mermaid diagram includes a `subgraph grp1 ["Inputs"]` block containing nodes A and B, with style annotations reflecting the group's fill color

#### Scenario: Group with custom color
- **WHEN** a group has `style: { fill: "#aaccff", color: "#000000" }`
- **THEN** the subgraph is rendered with `style grp1 fill:#aaccff,color:#000000`

#### Scenario: Multiple groups in one flow
- **WHEN** a flow has two groups `"grp1"` and `"grp2"`
- **THEN** both groups are rendered as separate Mermaid subgraphs, each containing their respective member nodes

#### Scenario: Nodes outside any group
- **WHEN** a flow has ungrouped nodes alongside grouped nodes
- **THEN** ungrouped nodes are rendered outside any subgraph block, at the top level of the diagram

#### Scenario: Group with no members
- **WHEN** a group exists but has an empty `nodes[]` array
- **THEN** an empty subgraph is rendered with a comment indicating the group is empty

#### Scenario: Node belongs to a group not on the current page
- **WHEN** a group node is excluded by pagination but a member node of that group is on the current page
- **THEN** the member node is rendered outside any subgraph (no broken subgraph references)

### Requirement: Group style-to-Mermaid mapping
The tool SHALL map group `style` properties to Mermaid `style` attributes as follows: `fill` → `fill`, `stroke` → `stroke`, `color` → `color`, `fill-opacity` → `fill-opacity`. The `label` and `label-position` properties SHALL be ignored in the diagram.

#### Scenario: Full style mapping
- **WHEN** a group has `style: { fill: "#ffff7f", "fill-opacity": "0.52", stroke: "#000000", color: "#aa0000" }`
- **THEN** the Mermaid style string includes `fill:#ffff7f,fill-opacity:0.52,stroke:#000000,color:#aa0000`


### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.
