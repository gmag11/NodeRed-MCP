## Requirements

### Requirement: get-subflow-detail MCP tool
The system SHALL expose an MCP tool named `get-subflow-detail` that accepts a `subflowId` (required string) and returns the full subflow definition, all internal nodes, all instances, and a Mermaid diagram of the internal flow.

#### Scenario: Retrieve full subflow detail
- **WHEN** `get-subflow-detail` is invoked with a valid `subflowId`
- **THEN** the response SHALL contain `definition` (the full subflow node), `internalNodes` (array of nodes with `z === subflowId`), `instances` (array of nodes with `type === "subflow:<subflowId>"`), and `diagram` (Mermaid flowchart string)

#### Scenario: Subflow with internal nodes
- **WHEN** the subflow contains internal nodes wired together
- **THEN** `internalNodes` SHALL include all those nodes with their full configuration, and `diagram` SHALL render them as a connected Mermaid flowchart

#### Scenario: Subflow with no internal nodes
- **WHEN** the subflow definition exists but has no internal nodes
- **THEN** `internalNodes` SHALL be an empty array and `diagram` SHALL render an empty flow

#### Scenario: Subflow with no instances
- **WHEN** the subflow has never been instantiated
- **THEN** `instances` SHALL be an empty array

#### Scenario: Unknown subflowId
- **WHEN** `get-subflow-detail` is invoked with a `subflowId` that does not match any `type: "subflow"` node
- **THEN** the tool SHALL return an error: `Subflow '<subflowId>' not found`

#### Scenario: Internal nodes exclude config nodes
- **WHEN** the subflow's internal nodes reference a config node (e.g., mqtt-broker)
- **THEN** the config node SHALL NOT appear in `internalNodes`; only nodes with `z === subflowId` and a `wires` property are included

### Requirement: get-subflow-detail reuses diagram logic
The Mermaid diagram SHALL be generated using the same logic as `get-flow-diagram`, applied to the subflow's internal nodes.

#### Scenario: Diagram structure matches flow diagrams
- **WHEN** a subflow has internal nodes connected in sequence
- **THEN** the `diagram` string SHALL follow the same `flowchart TD` Mermaid format as `get-flow-diagram` output

### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.
