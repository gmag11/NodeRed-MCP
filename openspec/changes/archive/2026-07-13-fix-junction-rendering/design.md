## Context

The renderer pipeline (`ir-builder.js` → `svg-builder.js` / `mermaid-builder.js` / `html-builder.js`) currently filters junctions out of both the visual node list AND the wire connectivity graph. Junctions are invisible, and wires that pass through them are silently dropped.

In the Node-RED editor, junctions are rendered as small circles (~12px radius, fill #999) that act as wire routing points. They have no labels, no port indicators, and a minimal visual footprint. The fix must both render junctions as visible circles AND resolve wire paths through them.

## Goals / Non-Goals

**Goals:**
- Render junction nodes as small filled circles in all three formats (SVG, Mermaid, HTML), matching Node-RED editor appearance
- Resolve wire paths through junctions so connectivity is correct
- Handle junction splits (1→N), joins (N→1), and chains (J1→J2→...→node)
- Guard against infinite loops from circular junction references
- Define junction styling in `colors.js` as single source of truth

**Non-Goals:**
- Rendering junctions as full-size nodes with labels (they are small wire-routing dots)
- Adding port indicators or interaction support (static rendering only)
- Supporting junction configuration or editing
- Optimizing for very large junction counts (typical flows have O(10) junctions)

## Decisions

### Decision 1: Junctions stay in `nodes[]` with an `isJunction` flag

**Choice**: Instead of separating junctions into a `junctions[]` array (current code), keep them in `nodes[]` and add `isJunction: true` to the IR node object. The `junctions[]` array is repurposed as a fast lookup map for wire resolution.

**Rationale**: All downstream builders already iterate over `nodes[]` — keeping junctions there means each builder just adds a simple `if (node.isJunction)` branch for circle rendering instead of needing a separate junction-pass loop. The `junctionsById` Map serves wire resolution only. Alternative: separate `junctions[]` array in IR — would require every builder to run two render passes, more boilerplate.

### Decision 2: Resolve junction wires at IR-build time, not per-builder

**Choice**: Add a `resolveTargets(targetId, junctionsById, visited)` helper in `ir-builder.js` that BFS-traverses junction wires to find non-junction destination nodes. Call it from the link-building loop when a wire target is a junction.

**Rationale**: SVG and Mermaid builders get correct `links[]` for free. Only the HTML builder needs its own inline copy because it builds its own link graph from raw flows (it doesn't consume IR `links[]`).

### Decision 3: BFS with visited set for cycle safety

**Choice**: Use BFS following junction wires, tracking visited junction IDs in a `Set` to break cycles. When a non-junction node is found, emit it as a resolved target.

**Rationale**: Junctions form a DAG in practice but programmatic flows could have loops. The visited set is O(1) insurance. BFS naturally handles multi-output splits.

### Decision 4: Junction styling in `colors.js`

**Choice**: Add a `junction` entry to `colors.js`:
```js
junction: {
  fill: '#999999',
  stroke: '#666666',
  radius: 12
}
```
All three builders reference this single definition.

**Rationale**: Single source of truth. If junction appearance needs tweaking, one file changes.

### Decision 5: SVG renders junctions as `<circle>`, not `<rect>`

**Choice**: In `buildNodeSVG()` (SVG builder), add an `if (node.isJunction)` branch that emits a `<circle>` element instead of the standard `<rect>` + `<text>` block. The circle is centered at the node's (x, y) position.

**Rationale**: This is how Node-RED editor renders them. A `<rect>` would look wrong regardless of size.

### Decision 6: Mermaid renders junctions as circle nodes with no label

**Choice**: In `buildMermaid()`, for junctions emit `nodeId((...))` (Mermaid circle syntax) with no displayed label.

**Rationale**: Mermaid supports circle node shapes. The `((...))` syntax produces a clean circle. Omitting the label text keeps the visual footprint minimal.

### Decision 7: Junction bounding box influence

**Choice**: Junctions contribute their (x, y, r=12) to the bounding box calculation in `layout.js` just like regular nodes contribute their (x, y, w, h). The `calculateViewBox()` function already accepts IR nodes generically — junctions with small `w: 24, h: 24` will work without changes.

**Rationale**: Junctions occupy real canvas space and must be included in viewport calculations to avoid being clipped.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Junction circle too small to be noticeable vs too large and distracting | Use 12px radius exactly matching Node-RED editor; users can adjust via colors.js |
| Infinite loop if junctions form a cycle | Visited set in BFS resolver terminates after visiting all reachable junctions |
| HTML builder diverges from IR builder behavior | Same algorithm documented in both places; test suite covers both paths |
| Mermaid `((...))` syntax may not be supported in all renderers | Mermaid circle nodes are standard in flowchart diagrams; widely supported since v8.x |
| Junction→junction chains may look confusing in diagram | This matches Node-RED editor behavior; junctions are wire-routing dots, users expect them |
