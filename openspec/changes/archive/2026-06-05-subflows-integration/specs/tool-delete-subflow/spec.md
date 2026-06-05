## ADDED Requirements

### Requirement: delete-subflow MCP tool
The system SHALL expose an MCP tool named `delete-subflow` that accepts `subflowId` (required string) and `deleteInstances` (optional boolean, default `true`). It SHALL remove the subflow definition and all its internal nodes from the flows, and optionally remove all its instances.

#### Scenario: Delete subflow with cascade (default)
- **WHEN** `delete-subflow` is invoked with a valid `subflowId` and `deleteInstances` is not specified (defaults to `true`)
- **THEN** the subflow definition, all internal nodes (`z === subflowId`), and all instances (`type === "subflow:<subflowId>"`) SHALL be removed

#### Scenario: Delete subflow keeping instances
- **WHEN** `delete-subflow` is invoked with `deleteInstances: false`
- **THEN** the subflow definition and internal nodes SHALL be removed, but instances SHALL remain (as orphan nodes)

#### Scenario: Previous state enables undo
- **WHEN** a subflow is successfully deleted
- **THEN** the response SHALL contain `subflowId` and `previousState` with `definition`, `internalNodes`, and `instances` arrays, enabling recovery via `import-flow`

#### Scenario: Unknown subflowId
- **WHEN** `delete-subflow` is invoked with a `subflowId` that does not match any `type: "subflow"` node
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' not found`

#### Scenario: Refuse to delete locked subflow
- **WHEN** `delete-subflow` is invoked on a locked subflow
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' is locked`

#### Scenario: No orphan internal nodes
- **WHEN** a subflow is deleted with `deleteInstances: true`
- **THEN** no node with `z === subflowId` or `type === "subflow:<subflowId>"` SHALL remain in the flows array
