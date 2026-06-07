# tool-get-flow-nodes Specification

## Purpose
TBD - created by archiving change tool-get-flow-nodes. Update Purpose after archive.
## Requirements
### Requirement: get-flow-nodes MCP tool
The system SHALL expose an MCP tool named `get-flow-nodes` that accepts a `flowId` (required) and returns a paginated list of nodes within that flow, with metadata and sanitized configuration. The response SHALL include group nodes (`type: "group"`) alongside flow nodes, and each node object SHALL include a `g` property when the node belongs to a group.

#### Scenario: Retrieve nodes from a known flow
- **WHEN** an MCP client invokes `get-flow-nodes` with `flowId: "abc"`
- **THEN** the system returns all nodes whose `z` property equals `"abc"` and that have a `wires` property (flow-level nodes), plus all group nodes (`type: "group"`) whose `z` equals `"abc"`. Each node includes its `id`, `type`, `name`, `disabled` state, `x`/`y` position, `wires`, and `g` (groupId, `null` if ungrouped)

#### Scenario: Group nodes are included in flow results
- **WHEN** a flow contains 3 debug nodes, 1 group node, and 1 config node
- **THEN** `get-flow-nodes` returns the 3 debug nodes and the 1 group node (but not the config node, which lacks `wires` and is not a group)

#### Scenario: Group node response shape
- **WHEN** a group node is returned in results
- **THEN** the node object includes `id`, `type: "group"`, `name`, `style` (object with `label`, `fill`, `fill-opacity`, `stroke`, `label-position`, `color`), `nodes` (array of member node IDs), `x`, `y`, `w`, `h`, `disabled`, and `g: null`

#### Scenario: Member nodes expose groupId
- **WHEN** a debug node belongs to group `"grp1"`
- **THEN** the node object includes `g: "grp1"`

#### Scenario: Ungrouped nodes have null groupId
- **WHEN** a node does not belong to any group
- **THEN** the node object includes `g: null`

#### Scenario: Flow not found
- **WHEN** `get-flow-nodes` is invoked with a `flowId` that does not match any tab or subflow
- **THEN** the tool returns an error indicating the flow was not found

#### Scenario: Empty flow
- **WHEN** a flow exists but contains no nodes
- **THEN** the tool returns an empty `nodes` array with `totalCount: 0`

### Requirement: Node configuration sanitization
The `get-flow-nodes` tool SHALL include node configuration fields in the response, excluding known large text fields (`func`, `template`, `format`, `html`, `css`) to avoid wasting LLM context tokens. The `g` property SHALL be exposed as a top-level metadata field. All other configuration fields SHALL be preserved.

#### Scenario: Function node configuration
- **WHEN** a `function` node has fields `func` (JavaScript code), `outputs`, and `name`
- **THEN** the response includes `outputs` and `name` but omits `func`

#### Scenario: Template node configuration
- **WHEN** a `template` node has fields `template` (Mustache template), `field`, and `syntax`
- **THEN** the response includes `field` and `syntax` but omits `template`

#### Scenario: Standard node configuration
- **WHEN** a `debug` node has fields `active`, `tosidebar`, `console`, and `tostatus`
- **THEN** all fields are included in the response since none are in the blocklist

#### Scenario: Group node configuration
- **WHEN** a group node has fields `name`, `style`, `nodes`, `x`, `y`, `w`, `h`
- **THEN** the response includes all these fields in the top-level node object (not in a `config` sub-object), and the group node's `config` object is empty since all fields are either metadata or group-specific

### Requirement: Filter by disabled state
The tool SHALL accept an optional `disabledOnly` boolean parameter. When `true`, the tool SHALL return only nodes that have `d: true` (Node-RED's disabled flag). When `false` or omitted, all nodes are returned regardless of disabled state.

#### Scenario: Filter to disabled nodes only
- **WHEN** `get-flow-nodes` is invoked with `disabledOnly: true`
- **THEN** only nodes with `d: true` are returned

#### Scenario: Default returns all nodes
- **WHEN** `get-flow-nodes` is invoked without `disabledOnly`
- **THEN** both enabled and disabled nodes are returned

### Requirement: Filter by node type
The tool SHALL accept an optional `nodeType` string parameter. When provided, only nodes whose `type` matches the value SHALL be returned. A value of `"group"` SHALL match group nodes.

#### Scenario: Filter by function type
- **WHEN** `get-flow-nodes` is invoked with `nodeType: "function"`
- **THEN** only nodes with `type: "function"` are returned

#### Scenario: Filter by group type
- **WHEN** `get-flow-nodes` is invoked with `nodeType: "group"`
- **THEN** only group nodes (`type: "group"`) are returned

#### Scenario: No nodes match type filter
- **WHEN** `get-flow-nodes` is invoked with `nodeType: "mqtt in"` but no such nodes exist in the flow
- **THEN** the tool returns an empty `nodes` array with `totalCount: 0`

### Requirement: Filter by connected subgraph
The tool SHALL accept an optional `fromNodeId` string parameter and an optional `direction` string parameter (`"downstream"`, `"upstream"`, or `"both"`, default `"both"`). When `fromNodeId` is provided, the tool SHALL traverse from the specified node in the given direction via `wires` and return only the reachable nodes (plus the origin node itself). Group nodes SHALL NOT be traversed (they have no `wires`). The `direction` parameter SHALL be ignored when `fromNodeId` is not provided.

#### Scenario: Downstream traversal
- **WHEN** a flow has a chain A→B→C→D and `fromNodeId` is set to node B's ID with `direction: "downstream"`
- **THEN** only nodes B, C, and D are returned

#### Scenario: Upstream traversal
- **WHEN** a flow has a chain A→B→C→D and `fromNodeId` is set to node C's ID with `direction: "upstream"`
- **THEN** only nodes A, B, and C are returned

#### Scenario: Bidirectional traversal (default)
- **WHEN** a flow has two independent groups (A→B→C and D→E→F) and `fromNodeId` is set to node B's ID without specifying `direction`
- **THEN** only nodes A, B, and C are returned (the full connected component)

#### Scenario: fromNodeId not found in flow
- **WHEN** `fromNodeId` is set to an ID that does not exist in the specified flow
- **THEN** the tool returns an error indicating the node was not found in the flow

#### Scenario: Isolated node
- **WHEN** `fromNodeId` points to a node with no incoming or outgoing wires
- **THEN** only that single node is returned regardless of direction

### Requirement: Offset-based pagination
The tool SHALL accept optional `offset` (default 0) and `limit` (default 50) parameters. The response SHALL include `totalCount`, `offset`, `limit`, and `hasMore` fields alongside the `nodes` array. Pagination SHALL be applied after all filters.

#### Scenario: First page with default limit
- **WHEN** a flow has 120 nodes and `get-flow-nodes` is invoked without pagination parameters
- **THEN** the response contains the first 50 nodes, `totalCount: 120`, `offset: 0`, `limit: 50`, `hasMore: true`

#### Scenario: Requesting second page
- **WHEN** `get-flow-nodes` is invoked with `offset: 50, limit: 50` on a flow with 120 nodes
- **THEN** the response contains nodes 51-100, `offset: 50`, `hasMore: true`

#### Scenario: Last page
- **WHEN** `get-flow-nodes` is invoked with `offset: 100, limit: 50` on a flow with 120 nodes
- **THEN** the response contains the remaining 20 nodes, `offset: 100`, `hasMore: false`


### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.
