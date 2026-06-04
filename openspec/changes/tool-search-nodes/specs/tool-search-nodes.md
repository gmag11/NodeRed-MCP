## ADDED Requirements

### Requirement: search-nodes MCP tool
The system SHALL expose an MCP tool named `search-nodes` that accepts `name` (optional string, substring match), `type` (optional string, substring match), `property` (optional string, property name), `value` (optional string, property value for equality match), `pattern` (optional string, regex pattern applied to name or specified property), and `limit` (optional number, default 50). At least one filter must be provided. It SHALL search all regular nodes across all flows and return matching results.

#### Scenario: Search by name
- **WHEN** `search-nodes` is called with `name: "sensor"`
- **THEN** all nodes whose `name` contains "sensor" (case-insensitive) are returned, each with `{ flowId, flowLabel, nodeId, type, name, x, y }`

#### Scenario: Search by type
- **WHEN** `search-nodes` is called with `type: "function"`
- **THEN** all nodes with `type === "function"` are returned

#### Scenario: Search by type substring
- **WHEN** `search-nodes` is called with `type: "mqtt"`
- **THEN** all nodes whose type contains "mqtt" (e.g., `mqtt in`, `mqtt out`) are returned

#### Scenario: Search by property value
- **WHEN** `search-nodes` is called with `property: "url"` and `value: "/api/data"`
- **THEN** all nodes with a top-level `url` property equal to `"/api/data"` are returned

#### Scenario: Combined filters (AND)
- **WHEN** `search-nodes` is called with `type: "function"` and `name: "transform"`
- **THEN** only nodes matching both filters are returned

#### Scenario: Search by regex pattern on name
- **WHEN** `search-nodes` is called with `pattern: "^sensor_\\d+"`
- **THEN** all nodes whose `name` matches the regex `^sensor_\d+` are returned

#### Scenario: Search by regex pattern on a specific property
- **WHEN** `search-nodes` is called with `pattern: "/api/v[12]"` and `property: "url"`
- **THEN** all nodes whose `url` property matches the regex `/api/v[12]` are returned

#### Scenario: Invalid regex pattern
- **WHEN** `search-nodes` is called with `pattern: "[invalid"`
- **THEN** the tool returns an error indicating the regex pattern is invalid

#### Scenario: No results found
- **WHEN** no nodes match the filters
- **THEN** the tool returns `{ results: [], total: 0 }`

#### Scenario: No filters provided
- **WHEN** `search-nodes` is called with no parameters
- **THEN** the tool returns an error: `At least one filter (name, type, or property+value) must be provided`

#### Scenario: Limit is respected
- **WHEN** more nodes match than the `limit` value
- **THEN** only the first `limit` results are returned, and `total` reflects the actual match count
