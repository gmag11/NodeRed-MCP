## Context

Node-RED groups are stored as `type: "group"` nodes in the `/flows` response. Each group node has a `nodes[]` array of member IDs and a `style` object with visual properties. Member nodes reference their group via a `g` field set to the group's ID. Groups belong to a flow tab (`z` equals the tab's ID) and have no `wires` property — they are not wired on the canvas.

The existing MCP tools for flow inspection (`get-flow-nodes`, `get-flow-diagram`) currently exclude nodes without `wires`, which filters out group nodes. The existing mutation tools (`create-node`, `update-node`, `delete-node`) operate on individual nodes and don't understand group semantics.

### Current architecture
```
src/tools/
├── flow-utils.js          ← getFlowNodes(), sanitizeNodeConfig(), METADATA_FIELDS
├── get-flow-nodes.js      ← transformFlowNodes()
├── get-flow-diagram.js    ← generateMermaidDiagram()
├── create-node.js          ← buildNewNode(), applyCreateNode()
├── update-node.js          ← applyNodeUpdate()
├── delete-node.js          ← applyDeleteNode()
└── server.js               ← tool registration
```

## Goals / Non-Goals

**Goals:**
- Add four group-specific MCP tools: `add-nodes-to-group`, `remove-nodes-from-group`, `update-group`, `delete-group`
- Modify `get-flow-nodes` to include group nodes and expose the `g` property on member nodes
- Modify `get-flow-diagram` to render groups as Mermaid subgraphs
- Auto-compute bounding rectangles when creating new groups
- Support idempotent group operations
- Maintain backward compatibility — all existing tools and tests continue to work

**Non-Goals:**
- Subflow creation/modification (separate change)
- Nested groups (groups inside groups — Node-RED itself does not support this)
- Group copy/paste or duplication
- Visual WYSIWYG positioning logic beyond simple bounding-box computation

## Decisions

### Decision 1: Group nodes are included via `getFlowNodes` modification, not a separate query

**Alternatives considered:**
- A) Modify `getFlowNodes` in `flow-utils.js` to also include `type: "group"` nodes whose `z` matches the flowId
- B) Add a separate `getGroupNodes` helper and merge results in `transformFlowNodes`

**Decision:** Option A. Simpler, fewer call sites to modify, and group nodes naturally belong to the flow they're drawn on. The filter changes from `n.z === flowId && ('wires' in n)` to `n.z === flowId && (('wires' in n) || n.type === 'group')`.

**Rationale:** Group nodes are positioned on the flow canvas and should be discoverable alongside other flow nodes. A separate helper would add complexity without benefit.

### Decision 2: `g` property exposed as top-level metadata, not in config

**Alternatives considered:**
- A) Move `g` out of `METADATA_FIELDS` so it appears in the `config` sub-object
- B) Add `g` as a top-level property in the node shape (alongside `id`, `type`, `name`, etc.)

**Decision:** Option B. The `g` field is structural metadata (like `z`, `x`, `y`), not configuration. It belongs at the top level of the node object returned by `get-flow-nodes`, not inside the sanitized `config` object.

**Implementation:** Remove `'g'` from `METADATA_FIELDS` in `flow-utils.js`'s `sanitizeNodeConfig`, and add `g: node.g || null` to the node shape in `transformFlowNodes`.

### Decision 3: `update-group` delegates to `applyNodeUpdate` from `update-node.js`

**Alternatives considered:**
- A) `update-group` is a standalone tool with its own update logic
- B) `update-group` calls `applyNodeUpdate` internally (thin wrapper)
- C) No separate tool — users just call `update-node` with a group node ID

**Decision:** Option B. `update-group` exports its own `applyUpdateGroup` function that validates the target is a `type: "group"` node, then delegates to `applyNodeUpdate`. The MCP tool registration is separate so the LLM has a clear, purpose-built tool for group styling.

**Rationale:** Option C is technically sufficient but semantically poor — LLMs benefit from purpose-built tools with clear names and focused descriptions. Option B keeps the implementation DRY while providing good UX.

### Decision 4: `add-nodes-to-group` auto-removes nodes from their previous group

**Alternatives considered:**
- A) Reject the operation with an error if any node already belongs to another group
- B) Auto-remove from previous group and add to new group
- C) Require the caller to first call `remove-nodes-from-group`, then `add-nodes-to-group`

**Decision:** Option B. This matches Node-RED's own UI behavior (dragging a node from one group to another). It's the principle of least surprise for an LLM agent that may not track group membership state perfectly.

### Decision 5: Bounding box auto-computed with fixed 20px padding

**Alternatives considered:**
- A) 20px padding on all sides
- B) Configurable padding parameter
- C) No auto-computation — caller must provide `x`, `y`, `w`, `h`

**Decision:** Option A with hardcoded 20px padding. This matches Node-RED's own behavior when creating groups from the UI. Making it configurable adds complexity without clear use cases — the caller can always use `update-group` to adjust the bounding box afterward.

### Decision 6: Group node representation in `get-flow-nodes` response

**Decision:** Group nodes in `get-flow-nodes` use the same shape as other nodes (`id`, `type`, `name`, `disabled`, `x`, `y`) but with additional group-specific fields: `g: null` (groups don't belong to groups), `nodes` (member IDs array), `style` (the full style object), `w`, `h`. The `config` sub-object is empty since all group fields are either metadata or style — there are no blocklisted large-text fields on group nodes.

## Risks / Trade-offs

- **[Risk] Group node included in subgraph traversal**: If `fromNodeId` filtering is applied, group nodes with no `wires` could confuse the BFS traversal. → **Mitigation**: Group nodes have no `wires`, so they are natural dead-ends in traversal — they won't be followed but also won't break anything. Document this in the tool description.

- **[Risk] Pagination can split group members across pages**: A node might appear on page 2 while its group definition is on page 1. → **Mitigation**: `get-flow-nodes` pagination applies after all filters. Group nodes count toward `totalCount`. If pagination splits a group, the `g` property on member nodes still correctly references the group ID — the agent can query the group separately.

- **[Risk] `add-nodes-to-group` auto-creating duplicate groups**: If the agent calls `add-nodes-to-group` without `groupId` multiple times for the same set of nodes, duplicate groups would be created. → **Mitigation**: The `nodeIds` parameter is required; the tool could optionally detect existing groups covering the same nodes, but this is complex and fragile. Instead, document that agents should track `groupId` after creation.

- **[Trade-off] `delete-group` deletes members by default**: This is destructive but mirrors user expectation (deleting a group rectangle in the Node-RED UI also deletes contained nodes). The `deleteMembers: false` option provides an escape hatch.

## Open Questions

- Should `add-nodes-to-group` accept a `padding` parameter for the bounding box? (Decision: no, keep it simple. Use `update-group` to adjust afterward.)
- Should `remove-nodes-from-group` auto-delete the group when the last member is removed? (Decision: no — the spec requires explicit deletion. Silent deletion is surprising.)
