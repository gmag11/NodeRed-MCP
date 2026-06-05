## MODIFIED Requirements

### Requirement: get-flows MCP tool
The system SHALL expose an MCP tool named `get-flows` that requires no input parameters and returns the list of flow tabs from the connected Node-RED instance in a format optimized for LLMs.

#### Scenario: Successful invocation without parameters
- **WHEN** an MCP client invokes the `get-flows` tool
- **THEN** the system calls `GET /flows` on the Node-RED Admin API and returns a transformed list

#### Scenario: Instance with no flows
- **WHEN** the Node-RED instance has no tabs
- **THEN** the tool returns an empty list `[]`

### Requirement: Response transformation for LLMs
The `get-flows` tool SHALL transform Node-RED's flat response into an array of objects with the structure `{ id, label, type, disabled, locked, info, nodeCount, nodeTypes }`. It SHALL only include objects of type `"tab"`. Subflow definitions (`type: "subflow"`) SHALL NOT appear in the response. `nodeCount` SHALL be the number of nodes whose `z` property matches the flow's `id`. `nodeTypes` SHALL be an array of unique strings from the `type` field of those nodes (no duplicates, excluding `"tab"` and `"subflow"`). `locked` SHALL default to `false` when absent. `info` SHALL default to `''` when absent.

#### Scenario: Tab with nodes
- **WHEN** a tab with id `"abc"` exists and has 5 nodes with `z: "abc"` of types `["inject", "function", "debug"]`
- **THEN** the response includes `{ id: "abc", label: "Flow 1", type: "tab", disabled: false, locked: false, info: '', nodeCount: 5, nodeTypes: ["inject", "function", "debug"] }`

#### Scenario: Locked tab
- **WHEN** a tab has `locked: true`
- **THEN** the response includes `locked: true` for that flow

#### Scenario: Tab with info description
- **WHEN** a tab has `info: "Handles MQTT ingestion"`
- **THEN** the response includes `info: "Handles MQTT ingestion"` for that flow

#### Scenario: Tab without locked or info fields
- **WHEN** a tab object does not have `locked` or `info` fields
- **THEN** the response includes `locked: false` and `info: ''`

#### Scenario: Subflow definitions excluded
- **WHEN** an object with `type: "subflow"` exists in the Node-RED instance
- **THEN** it SHALL NOT appear in the `get-flows` response; subflows are queried via `get-subflows`

#### Scenario: Global config nodes excluded
- **WHEN** nodes without a `z` property exist (global configuration nodes)
- **THEN** they are not counted in any flow's `nodeCount` and their types do not appear in `nodeTypes`

#### Scenario: Disabled tab
- **WHEN** a tab has `disabled: true`
- **THEN** it appears in the response with `disabled: true` (it is not filtered out)
