## Context

The MCP server exposes Node-RED flows and nodes to AI agents. The `get-flow-nodes` tool returns a paginated list of nodes for a flow but intentionally strips large text fields (`func`, `template`, `format`, `html`, `css`) to keep responses compact.

When an agent needs to read or reason about the logic inside a specific node (e.g., inspect a function's JavaScript code or a template's Mustache markup), there is currently no way to retrieve that content. A `get-node-detail` tool resolves this by fetching the full detail of a single node.

## Goals / Non-Goals

**Goals:**
- Add a `get-node-detail` MCP tool that accepts a `nodeId` and returns the complete node object, including all text fields.
- Follow the same architectural pattern as existing tools (`get-flow-nodes`, `get-config-nodes`).

**Non-Goals:**
- Modifying or writing node content back to Node-RED.
- Batch retrieval of multiple nodes (use `get-flow-nodes` for listing).
- Handling node type-specific field transformations or special formatting.

## Decisions

### Use the existing `/flows` endpoint and filter by node ID

**Decision**: Retrieve the full flows array and find the node by its `id` field, rather than attempting to call a per-node endpoint.

**Rationale**: Node-RED's API does not expose a `/nodes/:id` REST endpoint for individual flow nodes. The `/flows` endpoint returns all nodes/tabs/links/configs in one array, making a local `find()` the only viable approach. This is consistent with how all other tools in this project work (see `src/nodered/client.js` — `getFlows()`).

**Alternative considered**: Use `/flow/:id` which returns a single tab's subtree. Rejected because node IDs are UUIDs and do not correspond to tab/subflow IDs; the lookup would require knowing the containing flow ID first.

### Return the full node object without filtering

**Decision**: Return all fields of the matched node, including large text fields (`func`, `template`, etc.).

**Rationale**: The explicit purpose of this tool is to expose what `get-flow-nodes` hides. Filtering here would defeat the purpose.

### Error on node not found

**Decision**: Return a tool-level error (non-fatal MCP error) when the `nodeId` does not match any node.

**Rationale**: Consistent with how `get-flow-nodes` handles unknown `flowId`.

## Risks / Trade-offs

- [Large payloads] Function nodes with large `func` bodies may produce responses that consume significant LLM context. → Mitigation: This is intentional and expected; agents should call this tool only when they need the content of a specific node.
- [All flows fetched] The tool fetches all flows to find a single node, which may be slow for large Node-RED instances. → Mitigation: Acceptable for now; the existing tools use the same pattern. Caching can be added later if needed.
