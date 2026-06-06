## Context

All existing tools that need nodes fetch `GET /flows` and filter client-side. This is the established pattern in the project. A search tool follows the same approach but exposes the filtering capability directly to the LLM.

The `get-flow-nodes` tool is flow-scoped and returns a summarized list (large text fields stripped). `search-nodes` is workspace-scoped, and searches deeply across ALL fields of each node — including name, type, id, properties, and large text fields like `func` body or `template` content. Results include enough fields to identify and locate nodes (use `get-node-detail` to retrieve full details of a specific node).

## Goals / Non-Goals

**Goals:**
- Search by a single `query` string across all fields of every regular node (deep search via `JSON.stringify`)
- Plain text mode (`regex: false`, default): case-insensitive substring match
- Regex mode (`regex: true`): the query is treated as a JavaScript regex pattern
- Optional `flowId` to scope the search to a single flow
- Return results with flow context: each result includes `flowId`, `flowLabel`, `nodeId`, `type`, `name`
- Configurable `limit` (default 50)
- `query` is required; if empty or missing, return an error

**Non-Goals:**
- Field-specific filtering (name, type, property) — the LLM doesn't need to specify where to search
- Searching subflows (deferred)

## Decisions

### Deep search across all fields via JSON.stringify

**Decision**: Each node is serialized with `JSON.stringify(node)` and the query is matched against the resulting string. In plain text mode, both query and serialized node are lowercased for case-insensitive matching. In regex mode, the query is compiled with `new RegExp(query)` and tested against the serialized string.

**Rationale**: The LLM should not have to guess which field contains the target text. A developer searching for "test" in Node-RED expects to find it whether it appears in a node name (`test1`), a function body (`var test = ...`), a topic property (`test/+/data`), or anywhere else. Serializing the entire node and doing a single string match is the simplest, most intuitive approach. It also naturally handles nested properties and large text fields without special-casing.

### Return flow context with each result

**Decision**: Each result includes `{ flowId, flowLabel, nodeId, type, name, x, y }`.

**Rationale**: The LLM needs to know which flow a node belongs to (for subsequent `update-node`, `connect-nodes` calls). Without `flowId`, the result is incomplete.

### Tabs and config nodes are excluded from results

**Decision**: Only regular nodes (those with a `z` property, excluding tabs and subflow definitions) are searchable.

**Rationale**: Tabs are flows, not nodes in the user-facing sense. Config nodes are findable via `get-config-nodes`. This keeps results focused.

### Optional flowId scoping

**Decision**: An optional `flowId` parameter limits the search to nodes belonging to that specific flow. When omitted, all flows are searched. The `flowId` is validated: if provided but not found among existing flows, a clear error is returned.

**Rationale**: When the LLM already knows which flow to search in (e.g., after a `get-flows` call), scoping avoids unnecessary results from other flows and improves performance by reducing the search space.

## Risks / Trade-offs

- [Performance] Fetching all flows for each search call has the same overhead as other tools in the project. Acceptable given the existing pattern.
- [Performance] `JSON.stringify` on every node adds overhead, but Node-RED node objects are small enough that this is negligible.
- [False positives] `JSON.stringify` includes keys like `"type"` and `"name"` which could match the query unexpectedly. Since the LLM is the consumer (not a human), it can filter results further if needed. The simplicity trade-off is worth it.
