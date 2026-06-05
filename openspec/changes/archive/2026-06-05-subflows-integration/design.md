## Context

Node-RED subflows are a three-layer abstraction in the `/flows` JSON:

1. **Definition** (`type: "subflow"`): A top-level node with `name`, `info`, `in` (input ports), `out` (output ports). Has no `z` property.
2. **Internal nodes** (`z: "<subflowId>"`): Regular nodes placed inside the subflow canvas. Wired together to form the internal logic.
3. **Instances** (`type: "subflow:<subflowId>"`): Nodes placed in flow tabs. Each instance has `z` pointing to the parent tab, `env` for parameterization, and `wires` for outgoing connections (one array per output port).

The MCP server currently has no subflow-aware tools. Subflows are partially covered by `get-flows` (lists them mixed with tabs) and `create-node` (can instantiate them if the LLM knows the `subflow:<id>` convention). There is no way to inspect internals, manage the lifecycle, or receive LLM guidance.

All data flows through `GET /flows` (read full state) and `POST /flows` (deploy with `Node-RED-Deployment-Type: flows` header). No new API endpoints are required.

## Goals / Non-Goals

**Goals:**
- Provide discovery tools (`get-subflows`, `get-subflow-detail`) so the LLM can understand what subflows exist and what they do internally.
- Provide lifecycle tools (`create-subflow`, `update-subflow`, `delete-subflow`) to manage subflow definitions.
- Provide an instantiation tool (`create-subflow-instance`) with better UX than raw `create-node`.
- Provide an export tool (`export-subflow`) for backup and sharing.
- Provide a skill (`nodered-subflows`) to teach the LLM subflow patterns.
- Separate concerns: `get-flows` returns only tabs, `get-subflows` returns only subflows.

**Non-Goals:**
- No new Node-RED Admin API endpoints. All operations use existing `GET /flows` + `POST /flows`.
- No subflow nesting support (subflows inside subflows). Node-RED's UI does not support this.
- No graphical subflow editor. Internal nodes are managed via existing `create-node` / `connect-nodes` tools.
- No `import-subflow` tool — `import-flow` already handles subflow JSON correctly.
- No subflow template/library browsing — out of scope for this change.

## Decisions

### D1: Use GET /flows + in-memory manipulation + POST /flows for all operations

**Choice:** Read the full flows array on every operation, manipulate it in memory, deploy the result.

**Rationale:** This is the established pattern for all existing tools (`create-node`, `update-node`, `delete-node`, etc.). Node-RED's Admin API does not expose subflow-specific CRUD endpoints. The `rev` field from GET /flows provides optimistic concurrency control.

**Alternatives considered:**
- Direct subflow API endpoints — Node-RED v2 API has no `/subflow` endpoints. Would require Node-RED core changes.
- Incremental patches — Not supported by the API; partial deploys could corrupt the flow state.

### D2: `get-flows` filters to `type === "tab"` only

**Choice:** Modify the filter in `transformFlows()` from `type === 'tab' || type === 'subflow'` to `type === 'tab'`.

**Rationale:** Semantic separation of concerns. Tabs and subflows are different concepts. Mixing them confuses the LLM.

**Migration:** This is technically a breaking change, but no caller should depend on `get-flows` for subflow discovery once `get-subflows` exists.

### D3: `create-subflow` creates only the definition node

**Choice:** `create-subflow` creates the bare `type: "subflow"` node with metadata. Internal nodes are added via existing `create-node(name, flowId: subflowId, ...)` calls. Ports are defined via `update-subflow`.

**Rationale:** Keeping `create-subflow` simple avoids duplicating node creation logic. The LLM already knows how to use `create-node` and `connect-nodes`. The skill document provides the step-by-step sequence.

**Alternatives considered:**
- Accept `nodes` array in `create-subflow` — would duplicate `create-node` logic and make error handling complex.
- Accept `in`/`out` at creation time — possible but ports are meaningless without internal nodes to wire to; better to set them in a separate step after populating internals.

### D4: `delete-subflow` cascades by default

**Choice:** `delete-subflow` removes: (1) the subflow definition node, (2) all internal nodes (`z === subflowId`), and (3) all instances (`type === "subflow:<subflowId>"`). An optional `deleteInstances: false` flag keeps instances as orphans.

**Rationale:** Safe default that prevents orphaned nodes littering the flows. The `previousState` response enables undo via `import-flow`. The opt-out flag supports migration scenarios.

### D5: `get-subflow-detail` reuses `get-flow-diagram` logic

**Choice:** Import the Mermaid diagram generation function from `get-flow-diagram.js` and call it with the subflow's internal nodes.

**Rationale:** Avoids duplicating ~200 lines of diagram rendering code. The internal structure of a subflow is identical to a regular flow tab.

### D6: `export-subflow` reuses config node collection from `export-flow`

**Choice:** Import `collectReferencedConfigNodes` from `export-flow.js` to include referenced config nodes (e.g., `mqtt-broker`) in the export.

**Rationale:** Same pattern as flow tab export. Ensures the exported JSON is self-contained and re-importable.

### D7: Skill follows existing skill structure

**Choice:** The `nodered-subflows` skill follows the same YAML frontmatter + markdown pattern as `nodered-flow-builder`, `nodered-fundamentals`, etc.

**Rationale:** Consistency with the existing skill system. The `tools` field in YAML frontmatter lists the tools the skill teaches about.

## Risks / Trade-offs

- **[R1] Race condition on concurrent operations**: Two MCP clients modifying the same subflow could lose updates because we read → modify → deploy. → Mitigation: The `rev` field provides optimistic locking; Node-RED rejects deploys with stale `rev`. The tool will surface the error to the LLM.
- **[R2] Orphan instances after `delete-subflow` with `deleteInstances: false`**: Instances of a deleted subflow become broken nodes (type `subflow:<deletedId>`). → Mitigation: The tool warns in its response. The `previousState` enables recovery.
- **[R3] `export-subflow` may miss implicit config nodes**: Config nodes referenced only by internal logic (not by string properties) won't be detected. → Mitigation: This is the same limitation as `export-flow`. Document it in the skill. In practice, Node-RED config node references are always string properties on referencing nodes.
- **[R4] Large subflows may hit LLM context limits**: `get-subflow-detail` returns full internal node details. A subflow with 50+ internal nodes could be large. → Mitigation: The diagram provides a visual summary; internal nodes use the same sanitization as `get-flow-nodes` (large text fields excluded).

## Open Questions

- **Q1**: Should `update-subflow` support modifying `in`/`out` port wires without validating they point to existing internal nodes? Currently leaning toward validation (reject invalid wire targets).
- **Q2**: Should `create-subflow` accept `category`, `color`, and `icon` properties? These are Node-RED palette metadata. Leaning toward making them optional in `create-subflow` and updatable via `update-subflow`.
