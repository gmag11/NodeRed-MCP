## ADDED Requirements

### Requirement: get-subflows MCP tool
The system SHALL expose an MCP tool named `get-subflows` that returns a list of all subflow definitions from the Node-RED instance, with enriched summary information. It SHALL accept no parameters.

#### Scenario: List all subflows
- **WHEN** `get-subflows` is invoked
- **THEN** the tool returns a JSON array of subflow objects, each containing `id`, `name`, `info`, `inputCount`, `outputCount`, `internalNodeCount`, `internalNodeTypes`, `instanceCount`, and `instances`

#### Scenario: Empty result when no subflows exist
- **WHEN** `get-subflows` is invoked and no subflow definitions exist in the instance
- **THEN** the tool returns an empty JSON array `[]`

#### Scenario: Subflow with instances
- **WHEN** a subflow has one or more instances placed in flow tabs
- **THEN** its entry SHALL include `instanceCount` matching the number of instances and `instances` array containing each instance's `id`, `name`, and `flowId`

#### Scenario: Subflow with no instances
- **WHEN** a subflow definition exists but has never been instantiated
- **THEN** its entry SHALL have `instanceCount: 0` and `instances: []`

#### Scenario: Internal node type summary
- **WHEN** a subflow contains internal nodes of various types
- **THEN** its `internalNodeTypes` SHALL be a deduplicated array of those node types

### Requirement: get-subflows excludes flow tabs
The tool SHALL only return nodes with `type: "subflow"`. Nodes with `type: "tab"` or any other type SHALL NOT appear in the response.

#### Scenario: Flow tabs are not included
- **WHEN** `get-subflows` is invoked and the instance has both flow tabs and subflows
- **THEN** only subflow definitions appear in the response; flow tabs are excluded
