## Context

The staging renderer processes the raw `flows[]` array from Node-RED through an Intermediate Representation (IR) pipeline. Currently, `ir-builder.js` maps each node's display name as `n.name || n.type`. Subflow instance nodes created via `create-subflow-instance` have `name: ""` by default — so they render as raw type strings like `subflow:b5468f4.d96887`.

The full `flows[]` array is available in all renderer entry points and contains both subflow instances (`type: "subflow:<uuid>"`) and their definitions (`type: "subflow"`). No code currently cross-references these.

The three output formats (SVG, Mermaid, HTML) each get their data from the IR, which is built once in `buildIR()`. HTML also has a client-side render path that re-implements the same logic.

## Goals / Non-Goals

**Goals:**
- Resolve subflow instance display names: use instance `name` if set, else fall back to subflow definition `name`
- Add a distinct color for subflow instance nodes in all renderers
- Add a visual indicator (badge/label) for subflow instances in all renderers

**Non-Goals:**
- No changes to the tool layer or staging store
- No changes to how subflow definitions or instances are created/stored
- No changes to Node-RED API interaction
- No new dependencies

## Decisions

### Decision 1: Resolve names in `ir-builder.js` (server-side) plus `html-builder.js` (client-side)

**Rationale**: SVG and Mermaid rely entirely on the server-side IR, so the name resolution must happen in `buildIR()`. The HTML renderer embeds the raw flows array and re-derives the IR client-side in D3 — so the same resolution logic must be duplicated there.

**Alternative considered**: Pass the name-resolution map as part of the IR JSON to the HTML client. Rejected — the HTML builder client-side code already has access to the full `ALL_FLOWS` array and can do the lookup itself.

### Decision 2: Extract subflow ID from `type: "subflow:<uuid>"` by splitting on `:`

**Rationale**: The subflow definition ID is embedded in the type string after the colon. This is deterministic and requires no additional data from the caller.

**Alternative considered**: Add a `subflowId` or `source` property to subflow instance nodes. Rejected — the type string is the authoritative source and is always present.

### Decision 3: Name resolution order — instance name, definition name, type fallback

1. If `node.name` is non-empty → use it (explicit instance name)
2. If `node.type.startsWith('subflow:')` → extract `<uuid>` from type, find definition with `{type: "subflow", id: <uuid>}` → use definition's `.name`
3. If definition not found → fall back to `node.type` (current behavior)

### Decision 4: Color for subflow instances

Use `#9BC7D4` (a light blue/turquoise) — this is close to Node-RED's own subflow instance color, distinct from the default gray (`#cccccc`) and from other concrete node types.

### Decision 5: Visual indicator per format

- **Mermaid**: Prefix label with `[Subflow]` — simple text indicator that works within the Mermaid syntax
- **SVG**: Draw a small colored badge rectangle in the top-right corner of the node with an "S" label, plus a CSS class
- **HTML**: Same badge as SVG, using D3 to append the badge element. CSS class `subflow-instance` for custom styling

## Risks / Trade-offs

- **Risk**: Name resolution adds O(n) scan of the flows array per subflow instance → **Mitigation**: flows arrays are typically <1000 nodes; the scan is negligible
- **Risk**: HTML client-side code is run in the user's browser — if the `ALL_FLOWS` array is incomplete or stale, names may not resolve → **Mitigation**: the fallback to raw type string maintains backward compatibility
- **Risk**: The `[Subflow]` prefix in Mermaid could break existing diagrams that parse the label → **Mitigation**: minimal prefix; existing diagrams continue to work, just with slightly different labels

## Migration Plan

1. Update `ir-builder.js`: add name resolution for subflow instances
2. Update `colors.js`: add subflow-instance color entry
3. Update `svg-builder.js`: render badge for subflow instances
4. Update `mermaid-builder.js`: prefix label for subflow instances
5. Update `html-builder.js`: client-side name resolution + badge
6. Add tests to all four renderer test files
7. Run test suite, redeploy
