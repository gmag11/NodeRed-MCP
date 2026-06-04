## ADDED Requirements

### Requirement: search-nodes MCP tool
The system SHALL expose an MCP tool named `search-nodes` that accepts `query` (required string, the search term), `regex` (optional boolean, default false, treats query as a regex pattern), `flowId` (optional string, limits search to nodes in that flow), and `limit` (optional number, default 50). It SHALL deep-search all regular nodes across all flows (or a single flow if `flowId` is provided) by serializing each node with `JSON.stringify` and matching the query against the resulting string. Plain text mode is case-insensitive substring match; regex mode uses `new RegExp(query)`.

#### Scenario: Plain text search matches node name
- **WHEN** `search-nodes` is called with `query: "sensor"`
- **THEN** all nodes whose serialized JSON contains "sensor" (case-insensitive) are returned — this includes nodes named "sensor1", "temperature_sensor", and any node with "sensor" anywhere in its fields

#### Scenario: Plain text search matches deep content
- **WHEN** `search-nodes` is called with `query: "test"`
- **THEN** nodes whose `func` body contains `var test = ...`, nodes named `test1`, nodes with a `topic` property set to `test/+/data`, and any node with "test" anywhere in its serialized fields are all returned

#### Scenario: Plain text search is case-insensitive
- **WHEN** `search-nodes` is called with `query: "MQTT"`
- **THEN** nodes with `type: "mqtt in"`, nodes named "MQTT Broker", and any node containing "mqtt" (any case) are returned

#### Scenario: Regex search
- **WHEN** `search-nodes` is called with `query: "^sensor_\\d+"` and `regex: true`
- **THEN** all nodes whose serialized JSON matches the regex `^sensor_\d+` are returned

#### Scenario: Invalid regex pattern
- **WHEN** `search-nodes` is called with `query: "[invalid"` and `regex: true`
- **THEN** the tool returns an error indicating the regex pattern is invalid

#### Scenario: No results found
- **WHEN** no nodes match the query
- **THEN** the tool returns `{ results: [], total: 0 }`

#### Scenario: Missing or empty query
- **WHEN** `search-nodes` is called with no `query` or an empty string
- **THEN** the tool returns an error: `The "query" parameter is required and must be non-empty`

#### Scenario: Limit is respected
- **WHEN** more nodes match than the `limit` value
- **THEN** only the first `limit` results are returned, and `total` reflects the actual match count

#### Scenario: Results include flow context
- **WHEN** nodes match the query
- **THEN** each result includes `{ flowId, flowLabel, nodeId, type, name, x, y }`

#### Scenario: Search scoped to a single flow
- **WHEN** `search-nodes` is called with `query: "sensor"` and `flowId: "abc123"`
- **THEN** only nodes belonging to flow `abc123` whose serialized JSON contains "sensor" are returned

#### Scenario: Invalid flowId
- **WHEN** `search-nodes` is called with `flowId: "nonexistent"`
- **THEN** the tool returns an error indicating the flow was not found
