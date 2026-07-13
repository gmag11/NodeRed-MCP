# junction-rendering Specification

## Purpose
Junction nodes SHALL be rendered as small circles in all visualizer formats (SVG, Mermaid, HTML), matching their appearance in the Node-RED editor. Wire paths through junctions SHALL be resolved so that connectivity is correctly represented.

## ADDED Requirements

### Requirement: Junctions rendered as small circles
In all renderer output formats, junction nodes SHALL be drawn as small filled circles (~12px radius, neutral gray fill) rather than as full node rectangles. Junctions SHALL have no label text and no port indicators.

#### Scenario: Junction in SVG output
- **WHEN** `renderStaging()` produces SVG output for a flow containing a junction
- **THEN** the junction SHALL appear as a `<circle>` element with r=12, fill=#999999 or equivalent neutral gray, and no text label

#### Scenario: Junction in Mermaid output
- **WHEN** `renderStaging()` produces Mermaid output for a flow containing a junction
- **THEN** the junction SHALL appear as a circle-shaped node with no label text and minimal styling

#### Scenario: Junction in HTML output
- **WHEN** `renderStaging()` produces HTML output for a flow containing a junction
- **THEN** the junction SHALL appear as a small circle element in the D3.js canvas with no label

#### Scenario: Junction excluded from bounding box computation
- **WHEN** computing the bounding box for a flow diagram
- **THEN** junction nodes SHALL still contribute to the bounding box calculation (they occupy canvas space)

### Requirement: Wire paths resolve through junctions
When building the IR link list, the system SHALL traverse through junction nodes to resolve wire paths. Wires SHALL appear to connect THROUGH junctions to their true source and destination nodes.

#### Scenario: Node → junction → node wire path
- **WHEN** node A wires to junction J, and junction J wires to node B
- **THEN** the IR link list SHALL contain a link from node A to node B, and junction J SHALL remain as a visible circle in the node list

#### Scenario: Junction split (1 → N)
- **WHEN** node A wires to junction J, and junction J wires to nodes B, C, and D
- **THEN** the IR link list SHALL contain three links: A→B, A→C, A→D

#### Scenario: Junction join (N → 1)
- **WHEN** nodes A and B both wire to junction J, and junction J wires to node C
- **THEN** the IR link list SHALL contain two links: A→C and B→C

#### Scenario: Junction-to-junction chain
- **WHEN** node A wires to junction J1, J1 wires to junction J2, and J2 wires to node B
- **THEN** the IR link list SHALL contain a single link A→B, and both J1 and J2 SHALL appear as visible circles

#### Scenario: Circular junction references handled safely
- **WHEN** two junctions form a circular wire reference (J1→J2 and J2→J1)
- **THEN** the resolver SHALL terminate without infinite recursion and SHALL produce links only to non-junction destinations reachable without revisiting nodes

### Requirement: Junction styling is consistent across formats
Junctions SHALL have the same visual appearance (circle, neutral gray, no label) in SVG, Mermaid, and HTML output formats. The junction color SHALL be defined in `colors.js` as a single source of truth.

#### Scenario: Consistent junction color
- **WHEN** a flow with junctions is rendered in SVG, Mermaid, and HTML
- **THEN** all three formats SHALL use the same fill color for junction circles, sourced from `colors.js`

### Requirement: Junction nodes carry isJunction flag in IR
The intermediate representation SHALL distinguish junctions from regular nodes via an `isJunction: true` property on each junction IR node.

#### Scenario: Junction IR node has flag
- **WHEN** `buildIR()` processes a junction node
- **THEN** the resulting IR node SHALL have `isJunction: true` and SHALL be included in the `nodes[]` array (not filtered into a separate `junctions[]` array)
