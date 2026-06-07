## Requirements

### Requirement: export-subflow MCP tool
The system SHALL expose an MCP tool named `export-subflow` that accepts `subflowId` (required string) and returns the subflow definition, all its internal nodes, and any referenced config nodes as a JSON array string compatible with `import-flow`.

#### Scenario: Export a subflow with internals
- **WHEN** `export-subflow` is invoked with a valid `subflowId`
- **THEN** the response SHALL contain `subflowId`, `name`, `nodeCount`, and `json` where `json` is a stringified array of the subflow definition node, all internal nodes, and any referenced config nodes

#### Scenario: Exported JSON is re-importable
- **WHEN** the returned `json` string is passed to `import-flow` with `conflictStrategy: "regenerate"`
- **THEN** the subflow SHALL be successfully imported as a duplicate

#### Scenario: Config nodes are included
- **WHEN** a subflow's internal nodes reference a config node (e.g., `mqtt-broker`)
- **THEN** the exported JSON SHALL include that config node

#### Scenario: Instances are NOT included
- **WHEN** a subflow has instances placed in flow tabs
- **THEN** the exported JSON SHALL NOT include those instance nodes

#### Scenario: Unknown subflowId
- **WHEN** `export-subflow` is invoked with a `subflowId` that does not match any `type: "subflow"` node
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' not found`

#### Scenario: Empty subflow export
- **WHEN** a subflow has no internal nodes
- **THEN** the exported JSON SHALL contain only the subflow definition node and any referenced config nodes

### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.
