## ADDED Requirements

### Requirement: import-flow MCP tool
The system SHALL expose an MCP tool named `import-flow` that accepts `flowJson` (required — a Node-RED flow JSON, either a JSON array string or a JSON object string with a `nodes` array), `conflictStrategy` (optional string, `"regenerate"` | `"overwrite"`, default `"regenerate"`), and `targetFlowId` (optional string — if provided, imports all non-tab nodes into this existing flow). It SHALL import all nodes into the running Node-RED instance and return a summary.

#### Scenario: Import a simple flow with regenerate strategy
- **WHEN** `import-flow` is invoked with a valid flow JSON array and `conflictStrategy: "regenerate"`
- **THEN** all node IDs and `z` references are remapped to new UUIDs, nodes are merged into the existing flows, Node-RED is redeployed, and the tool returns `{ imported: { flows: N, nodes: N, configNodes: N }, conflicts: 0, strategy: "regenerate", targetFlowId: null }`

#### Scenario: Import with overwrite strategy
- **WHEN** `import-flow` is invoked with `conflictStrategy: "overwrite"` and the JSON contains nodes whose IDs already exist
- **THEN** existing nodes with those IDs are replaced by the imported ones, and the tool returns the summary with `conflicts` equal to the number of replaced nodes

#### Scenario: Import into an existing flow
- **WHEN** `import-flow` is invoked with a valid `targetFlowId` pointing to an existing flow
- **THEN** all non-tab nodes from the JSON have their `z` remapped to `targetFlowId`, tab nodes in the JSON are discarded, and the tool returns `{ imported: { flows: 0, nodes: N, configNodes: N }, targetFlowId: "<id>" }`

#### Scenario: targetFlowId not found
- **WHEN** `targetFlowId` is provided but does not match any existing flow tab
- **THEN** the tool returns an error: `Target flow '<targetFlowId>' not found`

#### Scenario: targetFlowId is locked
- **WHEN** `targetFlowId` points to a flow with `locked: true`
- **THEN** the tool returns an error: `Target flow '<targetFlowId>' is locked`

#### Scenario: Accept object format with nodes property
- **WHEN** `flowJson` is a JSON object string with a `nodes` array (e.g. `{ "nodes": [...] }`)
- **THEN** the tool extracts the array and proceeds as if it were passed directly

#### Scenario: Invalid JSON input
- **WHEN** `flowJson` is not valid JSON
- **THEN** the tool returns an error: `Invalid flowJson: not valid JSON`

#### Scenario: Empty flow array
- **WHEN** `flowJson` is an empty array `[]`
- **THEN** the tool returns an error: `flowJson is empty — nothing to import`

#### Scenario: Unknown conflictStrategy
- **WHEN** `conflictStrategy` is set to an unrecognised value
- **THEN** the tool returns an error: `Unknown conflictStrategy '<value>'. Use "regenerate" or "overwrite"`

### Requirement: import-flow returns import summary
The tool SHALL return an object with `imported` (counts of `flows`, `nodes`, `configNodes`), `conflicts` (number of ID collisions resolved), and `strategy` (the strategy that was applied).

#### Scenario: Summary counts are accurate
- **WHEN** a flow JSON with 1 tab, 5 regular nodes, and 1 config node is imported
- **THEN** the response contains `imported: { flows: 1, nodes: 5, configNodes: 1 }`
