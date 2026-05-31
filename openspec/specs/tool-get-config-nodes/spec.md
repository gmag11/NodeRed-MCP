# tool-get-config-nodes Specification

## Purpose
TBD - created by archiving change tool-get-flow-nodes. Update Purpose after archive.
## Requirements
### Requirement: get-config-nodes MCP tool
The system SHALL expose an MCP tool named `get-config-nodes` that returns a paginated list of global configuration nodes (nodes without a `z` property) from the Node-RED instance.

#### Scenario: List config nodes
- **WHEN** an MCP client invokes `get-config-nodes`
- **THEN** the system returns all nodes from `GET /flows` that have no `z` property and whose type is not `tab` or `subflow`, including each node's `id`, `type`, `name`, and sanitized configuration

#### Scenario: No config nodes exist
- **WHEN** the Node-RED instance has no global configuration nodes
- **THEN** the tool returns an empty `nodes` array with `totalCount: 0`

### Requirement: Config node sanitization
The tool SHALL apply the same field sanitization blocklist as `get-flow-nodes`, excluding large text fields from the configuration output.

#### Scenario: Config node with credentials
- **WHEN** an `mqtt-broker` config node has fields `broker`, `port`, `clientid`
- **THEN** all fields are included since none are in the blocklist

### Requirement: Config node pagination
The tool SHALL accept optional `offset` (default 0) and `limit` (default 50) parameters. The response SHALL include `totalCount`, `offset`, `limit`, and `hasMore` fields.

#### Scenario: Paginated config nodes
- **WHEN** 15 config nodes exist and `limit: 10` is set
- **THEN** the first page returns 10 nodes with `hasMore: true`, and a second page with `offset: 10` returns 5 nodes with `hasMore: false`

### Requirement: Filter config nodes by type
The tool SHALL accept an optional `nodeType` string parameter. When provided, only config nodes whose `type` matches SHALL be returned.

#### Scenario: Filter by mqtt-broker type
- **WHEN** `get-config-nodes` is invoked with `nodeType: "mqtt-broker"`
- **THEN** only config nodes with `type: "mqtt-broker"` are returned

