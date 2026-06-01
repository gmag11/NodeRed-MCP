## ADDED Requirements

### Requirement: get-palette-nodes MCP tool
The system SHALL expose an MCP tool named `get-palette-nodes` that returns a paginated list of node sets from the Node-RED palette, exactly as returned by `GET /nodes`. It SHALL accept optional input parameters `page` (integer, default 1) and `pageSize` (integer, default 50, max 200). The response SHALL include `page`, `pageSize`, `total`, `totalPages`, and a `nodes` array of raw node set objects.

#### Scenario: List palette nodes with defaults
- **WHEN** an MCP client invokes `get-palette-nodes` with no parameters
- **THEN** the tool calls `GET /nodes` on the Node-RED Admin API and returns the first page of up to 50 node set entries

#### Scenario: Paginated results
- **WHEN** the palette has 120 node sets and `pageSize` is 50
- **THEN** `total` is 120, `totalPages` is 3, and `page: 2` returns node sets 51–100

#### Scenario: Last page with fewer items
- **WHEN** requesting `page: 3` of a 120-set palette with `pageSize: 50`
- **THEN** the `nodes` array contains 20 items

#### Scenario: pageSize exceeds maximum
- **WHEN** the client requests `pageSize: 500`
- **THEN** the tool clamps `pageSize` to 200 and returns accordingly

#### Scenario: page out of range
- **WHEN** the client requests a `page` beyond `totalPages`
- **THEN** the tool returns an empty `nodes` array with correct `total` and `totalPages`

#### Scenario: Disabled node sets included in listing
- **WHEN** a node set is installed but disabled in Node-RED
- **THEN** it is included in the results with `enabled: false`

### Requirement: Node set objects returned verbatim
The `get-palette-nodes` tool SHALL return node set objects exactly as provided by the Node-RED Admin API, without transformation. Each node set SHALL contain at minimum `id`, `name`, `module`, `version`, `types`, and `enabled` fields as defined by the Node-RED Admin API Node Set type.

#### Scenario: Raw node set shape preserved
- **WHEN** the API returns a node set with fields `{ id, name, types, enabled, module, version }`
- **THEN** the same object appears unmodified in the `nodes` array of the response
