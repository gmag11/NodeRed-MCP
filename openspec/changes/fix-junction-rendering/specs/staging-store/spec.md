# staging-store Specification (Delta)

## MODIFIED Requirements

### Requirement: getStagingSummary returns status
The staging store SHALL provide a `getStagingSummary()` method that returns `{ pendingChanges: number, dirtyNodeIds: string[], dirtyFlowIds: string[], deployed: boolean }`. The `deployed` field SHALL be `true` when there are no pending changes (both dirty sets are empty).

#### Scenario: Summary with pending changes
- **WHEN** `getStagingSummary()` is called and the dirty nodes set has 3 IDs and the dirty flows set has 2 IDs
- **THEN** the method SHALL return `{ pendingChanges: 5, dirtyNodeIds: ["id1", "id2", "id3"], dirtyFlowIds: ["f1", "f2"], deployed: false }`

#### Scenario: Summary without pending changes
- **WHEN** `getStagingSummary()` is called and both dirty sets are empty
- **THEN** the method SHALL return `{ pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true }`

## ADDED Requirements

### Requirement: Staging renderer resolves wires through junctions
When the staging renderer (via `renderStaging()`) produces a diagram of the staged flows, wire paths through junction nodes SHALL be resolved so that connectivity is correctly represented. Junctions SHALL remain invisible in the rendered output.

#### Scenario: Staging visualization preserves junction topology
- **WHEN** `renderStaging()` is called for flows containing junctions
- **THEN** the resulting diagram (SVG, Mermaid, or HTML) SHALL show correct wire connections that transit through junctions
