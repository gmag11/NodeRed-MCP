## ADDED Requirements

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
