## Context

The MCP server allows LLMs to build Node-RED flows node-by-node via `create-node` and `connect-nodes`. A typical flow of 6–8 nodes with wiring requires 10–20+ sequential MCP calls. Node-RED's own UI exports and imports flows as JSON arrays, which encode a complete flow (nodes, config nodes, wires) in a single document.

There is no current mechanism to import such a JSON into the running instance via MCP. Agents receiving a flow JSON from the user or from the Flow Library have no way to apply it.

## Goals / Non-Goals

**Goals:**
- Add `import-flow` MCP tool accepting a Node-RED flow JSON array
- Detect ID collisions with existing nodes/flows
- Support two conflict strategies: `regenerate` (new UUIDs, always safe) and `overwrite` (replace in-place)
- Support two import destinations: new flow(s) from the JSON tabs, or into an existing specific flow via `targetFlowId`
- Return a summary: counts of flows, nodes, config nodes imported, and conflicts resolved

**Non-Goals:**
- Validating that node types exist in the palette (nodes with unknown types will be imported as-is, matching Node-RED's own import behavior)
- Merging partial node updates (use `update-node` for that)
- Importing subflows (deferred)

## Decisions

### Import destination: new flow vs existing flow

**Decision**: Accept an optional `targetFlowId` parameter. When provided, all non-tab nodes from the imported JSON are injected into that existing flow (their `z` is remapped to `targetFlowId`; tab nodes in the JSON are discarded). When omitted, tab nodes in the JSON create new flows as before.

**Rationale**: This mirrors the Node-RED UI import dialog which asks "Import into: new flow / current flow". The LLM frequently needs to add a sub-pattern (e.g., an error handler, a set of transform nodes) into an already-selected flow without creating a new tab.

**Constraint**: If `targetFlowId` is provided and the flow does not exist or is locked, the tool returns an error before any mutation.

**Alternative**: Always create new flows — rejected because it forces the user to manually move nodes between tabs afterwards.

### Conflict strategy: `regenerate` as default

**Decision**: Default conflict strategy is `regenerate` — all IDs and `z` references in the imported JSON are remapped to fresh UUIDs before sending to Node-RED.

**Rationale**: This is the safest option. It mirrors what Node-RED's UI does when importing on top of existing flows. `overwrite` is available for cases where the user explicitly wants to replace existing nodes (e.g. re-importing an updated version of a flow they exported).

**Alternative**: Error on conflict — rejected because it would make imports of any flow that was previously exported from the same instance impossible.

### Use `PUT /flows` with full merged payload

**Decision**: Fetch the current flows array, merge the imported nodes (with conflict strategy applied), then `PUT /flows` with the complete merged array.

**Rationale**: Node-RED's `PUT /flows` replaces all flows atomically. This is the only API that supports adding multiple nodes at once. `Node-RED-Deployment-Type: full` is used for safety (all flows redeployed consistently).

**Alternative**: `POST /flow` per-tab — rejected because it requires splitting a flat node array into per-tab groups, which is complex and error-prone.

### Accept raw JSON array or Node-RED export object

**Decision**: Accept both a raw `[ {...}, ... ]` array and the `{ nodes: [...] }` object that some export paths produce. Normalize to array internally.

**Rationale**: Reduces friction — users can paste whatever Node-RED puts in their clipboard.

## Risks / Trade-offs

- [Full deploy on import] Using `PUT /flows` redeploys all flows, briefly interrupting running flows. This matches Node-RED's own import behavior and is documented in the tool description.
- [Large payloads] Importing a large flow JSON increases MCP response size. Mitigated by returning a summary rather than echoing the full imported content.
