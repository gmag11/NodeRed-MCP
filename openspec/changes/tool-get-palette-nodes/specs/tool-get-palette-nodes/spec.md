## ADDED Requirements

### Requirement: get-palette-nodes MCP tool
The system SHALL expose an MCP tool named `get-palette-nodes` that returns a paginated list of all node types installed in the Node-RED palette. It SHALL accept optional input parameters `page` (integer, default 1) and `pageSize` (integer, default 50, max 200). The response SHALL include `page`, `pageSize`, `totalTypes`, `totalPages`, and a `nodes` array of objects with `{ type, module, version, category, enabled }`.

#### Scenario: List palette nodes with defaults
- **WHEN** an MCP client invokes `get-palette-nodes` with no parameters
- **THEN** the tool calls `GET /nodes` on the Node-RED Admin API and returns the first page of up to 50 node type entries

#### Scenario: Paginated results
- **WHEN** the palette has 120 node types and `pageSize` is 50
- **THEN** `totalTypes` is 120, `totalPages` is 3, and `page: 2` returns types 51–100

#### Scenario: Last page with fewer items
- **WHEN** requesting `page: 3` of a 120-type palette with `pageSize: 50`
- **THEN** the `nodes` array contains 20 items

#### Scenario: pageSize exceeds maximum
- **WHEN** the client requests `pageSize: 500`
- **THEN** the tool clamps `pageSize` to 200 and returns accordingly

#### Scenario: page out of range
- **WHEN** the client requests a `page` beyond `totalPages`
- **THEN** the tool returns an empty `nodes` array with correct `totalTypes` and `totalPages`

#### Scenario: Disabled node modules excluded from listing
- **WHEN** a node module is installed but disabled in Node-RED
- **THEN** its node types are included in the list with `enabled: false`

### Requirement: Palette response transformation for LLMs
The `get-palette-nodes` tool SHALL flatten the Node-RED module/set/types hierarchy into a per-type list before returning. Each entry SHALL contain `type` (string), `module` (string), `version` (string), `category` (string), and `enabled` (boolean). Entries SHALL be sorted alphabetically by `type`.

#### Scenario: Multiple types in one module
- **WHEN** a module provides node types `["inject", "debug", "complete"]`
- **THEN** each appears as a separate entry in the `nodes` array

#### Scenario: Alphabetical ordering
- **WHEN** modules are installed in arbitrary order
- **THEN** the flattened list is sorted alphabetically by `type` before pagination is applied
