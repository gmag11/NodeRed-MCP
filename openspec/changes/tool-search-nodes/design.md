## Context

All existing tools that need nodes fetch `GET /flows` and filter client-side. This is the established pattern in the project. A search tool follows the same approach but exposes the filtering capability directly to the LLM.

The `get-flow-nodes` tool is flow-scoped and returns a summarized list (large text fields stripped). `search-nodes` is workspace-scoped, returns enough fields to identify and locate nodes, but also strips large content fields (use `get-node-detail` to retrieve those).

## Goals / Non-Goals

**Goals:**
- Search by `name` (substring, case-insensitive)
- Search by `type` (exact match or substring)
- Search by property: a `property` name and `value` (equality check on top-level node properties)
- Search by `pattern`: a regex pattern applied against `name` and/or specified `property` values
- Return results with flow context: each result includes `flowId`, `flowLabel`, `nodeId`, `type`, `name`, `x`, `y`
- Configurable `limit` (default 50)

**Non-Goals:**
- Full-text search inside `func`, `template`, or other large text fields (use `get-node-detail` then filter locally)
- Searching subflows (deferred)

## Decisions

### Return flow context with each result

**Decision**: Each result includes `{ flowId, flowLabel, nodeId, type, name, x, y }`.

**Rationale**: The LLM needs to know which flow a node belongs to (for subsequent `update-node`, `connect-nodes` calls). Without `flowId`, the result is incomplete.

### All filters are ANDed

**Decision**: If multiple filters are provided (`name` + `type`), all must match.

**Rationale**: AND semantics are the most intuitive for search. OR would require a more complex query syntax.

### Regex pattern search on name and/or property values

**Decision**: A `pattern` parameter accepts a regex string. When provided without `property`, the regex is tested against the node's `name`. When provided with `property`, the regex is tested against the stringified value of that property.

**Rationale**: LLMs often need to find nodes matching complex patterns (e.g., all nodes whose name starts with `sensor_` followed by digits). Regex provides this flexibility. Patterns are applied with `new RegExp(pattern)` and invalid regex returns a clear error.

### Tabs and config nodes are excluded from results

**Decision**: Only regular nodes (those with a `z` property, excluding tabs and subflow definitions) are searchable.

**Rationale**: Tabs are flows, not nodes in the user-facing sense. Config nodes are findable via `get-config-nodes`. This keeps results focused.

## Risks / Trade-offs

- [Performance] Fetching all flows for each search call has the same overhead as other tools in the project. Acceptable given the existing pattern.
