## Context

Node-RED's Admin API exposes `GET /flow/:id` which returns the nodes belonging to a single tab, and `GET /flows` which returns all nodes. The Node-RED UI exports flows as a flat JSON array containing tabs, their child nodes, and any referenced config nodes.

Currently, the MCP server has no tool that exposes raw flow JSON. The existing `get-flows` and `get-flow-nodes` tools return summarized, LLM-friendly representations — not the raw JSON needed for re-import.

## Goals / Non-Goals

**Goals:**
- Add `export-flow` tool that returns raw exportable JSON for a single flow or all flows
- Support two export modes mirroring the Node-RED UI: `flow` (full flow with tab + children + config nodes) and `nodes` (a selection of nodes by ID + wires between them, trimming external wires)
- Include referenced config nodes when exporting in `flow` mode
- Return the JSON as a string (so the LLM can present it to the user or pass it to `import-flow`)

**Non-Goals:**
- Pretty-printing or transforming node properties
- Filtering specific node types
- Exporting subflows (deferred, consistent with `import-flow`)

## Decisions

### Two export modes: `flow` and `nodes`

**Decision**: The tool accepts an `exportMode` parameter (`"flow"` | `"nodes"`, default `"flow"`).

- `flow` mode: exports the full tab — the tab node itself, all its child nodes, and any config nodes referenced by them. Requires `flowId`. Mirrors Node-RED UI "Export > All flows" or per-tab export.
- `nodes` mode: exports a specific list of nodes (by `nodeIds` array) plus the wires that connect nodes within the selection. Wires to nodes outside the selection are trimmed. Does not include the parent tab node. Mirrors Node-RED UI "Export > Selected nodes".

**Rationale**: The Node-RED UI itself offers these two modes. `flow` is the standard re-import format; `nodes` is useful when the LLM or user wants to extract a sub-pattern from a flow for reuse or sharing.

**Constraint**: `nodes` mode requires `nodeIds` (non-empty array). `flow` mode requires `flowId`. `exportMode: "flow"` with no `flowId` exports all flows.

### Single flow export includes its config nodes

**Decision**: In `flow` mode, when exporting by `flowId`, fetch all flows, collect nodes whose `z` matches the flow ID, then also collect any config nodes (nodes with no `z`) that are referenced by those nodes.

**Rationale**: A flow exported without its config nodes (e.g., MQTT broker, HTTP credentials) cannot be re-imported and work correctly. Node-RED's UI does the same.

**Alternative**: Export only tab children (no config nodes) — rejected as the result would be incomplete.

### Wire trimming in `nodes` mode

**Decision**: In `nodes` mode, for each exported node's `wires` array, remove any target IDs that are not in `nodeIds`. If all targets on a port are removed, that port becomes `[]`.

**Rationale**: Including wires that point to nodes outside the selection would produce dangling references that break on import.

### Return JSON as a string field, not a raw object

**Decision**: The tool returns `{ exportMode, flowId?, label?, nodeCount, json: "<stringified array>" }` rather than embedding the array directly in the MCP response object.

**Rationale**: Embedding a large nested array directly in the MCP content makes it harder for LLMs to handle as a unit (copy to user, pass to `import-flow`). A string is a single token-efficient value.

## Risks / Trade-offs

- [Large exports] Exporting all flows from a large Node-RED instance can produce a very large string. Mitigated by recommending per-flow exports for large instances; the `flowId` parameter makes this easy.
- [nodes mode without config nodes] `nodes` mode does not auto-include referenced config nodes (the selection is explicit). The LLM should be aware that importing the result may require the config nodes to already exist in the target instance.
