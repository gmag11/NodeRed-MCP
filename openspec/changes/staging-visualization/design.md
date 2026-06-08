## Context

The NodeRed-MCP server maintains an in-memory `StagingStore` that mirrors the live Node-RED flows. Write operations (create-node, connect-nodes, delete-node, etc.) modify this staging copy; changes only reach the runtime when `deploy()` is called. Today, the only way to inspect the staging state programmatically is `get-staging-status` (counts of dirty nodes/flows) and `get-flow-diagram` (Mermaid topology). Neither provides a visual representation of what the flows actually look like — node positions, wire routing, group containers, or type-specific colors.

Node-RED's own editor renders flows using D3.js in an SVG viewport (`view.js`, ~4500 lines). It uses:
- A fixed 8000×8000 canvas with zoom/pan
- SVG `<rect>` elements for nodes with type-specific fill colors
- SVG `<path>` bezier curves for wires (`generateLinkPath()`)
- D3 data-binding for efficient DOM updates
- Separate rendering layers: groups → links → junctions → nodes

The design extracts the rendering logic from `view.js` into a standalone module, simplifying it for server-side SVG generation and optional HTML interactivity, while adding staging-aware features (dirty highlighting) that the real editor lacks.

## Goals / Non-Goals

**Goals:**
- Generate **SVG** server-side showing real node positions, wire routing, groups, and type colors
- Generate **HTML** with embedded D3.js for interactive zoom/pan/hover
- Generate **Mermaid** diagrams (consolidating the existing `get-flow-diagram` tool)
- **Highlight dirty nodes** (un-deployed changes) with a visual indicator across all formats
- Share core rendering logic across all output formats via `src/renderer/`
- Keep existing `get-flow-diagram` API unchanged

**Non-Goals:**
- Replace Node-RED's editor or provide editing capabilities in the HTML view
- Real-time streaming/WebSocket updates (static snapshots only)
- Pixel-perfect fidelity to Node-RED's editor rendering (approximate is acceptable)
- Support for custom node icons (text labels only; icon support is a future enhancement)
- PNG/image output (requires headless browser — deferred)

## Decisions

### Decision 1: Shared renderer module (`src/renderer/`)

**Choice:** Extract core rendering logic into a shared module with format-specific output adapters.

```
src/renderer/
├── index.js          # Entry: renderStaging(flows, options) → { svg, html, mermaid }
├── layout.js         # Bounding box calculation, node grouping
├── geometry.js       # Bezier wire paths (adapted from Node-RED's generateLinkPath)
├── colors.js         # Node type → color mapping (matching Node-RED palette)
├── svg-builder.js    # SVG string generation
├── html-builder.js   # Self-contained HTML page with D3.js
└── mermaid-builder.js # Enhanced Mermaid output (integrates existing logic)
```

**Rationale:** A single source of truth for layout, colors, and wire routing avoids duplication across the three output formats. Each builder consumes the same intermediate representation (positioned nodes, computed paths).

**Alternative rejected:** Three independent tools with duplicated logic. Would diverge over time and be harder to maintain.

### Decision 2: Server-side SVG generation (pure string concatenation, no DOM)

**Choice:** Build SVG as string templates, not via a DOM library (jsdom, cheerio, etc.).

**Rationale:** The SVG output is simple enough (rects, paths, text, groups) that template strings are sufficient. No need to add a heavy DOM dependency. This keeps the MCP server lightweight and fast.

**Alternative rejected:** jsdom + D3 server-side. Adds ~10MB of dependencies for a feature that can be done with string concatenation.

### Decision 3: HTML output with bundled D3.js v7

**Choice:** Generate a self-contained `.html` file that includes D3.js via CDN `<script>` tag with a local fallback comment.

**Rationale:** The HTML format is meant to be opened in a browser. Including D3 via CDN is lightweight (~200KB cached) and provides zoom/pan out of the box. The HTML embeds all flow data as a `<script>` tag, making it fully self-contained (no server needed after download).

**Alternative rejected:** Generate a static SVG file for browser viewing. Users would lose zoom/pan/hover interactions that make the view useful.

### Decision 4: Dirty highlighting via orange border

**Choice:** Nodes with pending (un-deployed) changes receive an orange `#ff8c00` border/glow, with a legend indicating the meaning.

**Rationale:** Node-RED's editor has no concept of "staged but not deployed". This is unique value for the MCP. The orange color is semantically associated with "warning/pending" across UIs. The legend prevents confusion.

**Alternative rejected:** Red border (too alarming — implies error), or no highlighting (misses the main value proposition).

### Decision 5: Mermaid integration via delegation

**Choice:** Update `get-flow-diagram` to delegate to `render-staging` with `format: "mermaid"`. The existing `generateMermaidDiagram()` function moves into `src/renderer/mermaid-builder.js`.

**Rationale:** Consolidates all rendering logic in one module. The existing tool's API surface (parameters, output schema) remains identical. Adding dirty highlighting to Mermaid output is a natural extension (using Mermaid's `style` directive or CSS classes).

### Decision 6: Color mapping strategy

**Choice:** Use the same color palette as Node-RED's core nodes, hardcoded in `src/renderer/colors.js`.

**Rationale:** Users familiar with Node-RED expect inject nodes to be blue-grey (`#a6bbcf`), debug nodes green (`#87a980`), function nodes orange (`#fdd0a2`), etc. Hardcoding these avoids depending on the Node-RED runtime. Unknown/custom node types get a neutral grey.

**Alternative rejected:** Querying the Node-RED instance for colors. Adds latency and coupling to a running instance (staging may be offline).

## Risks / Trade-offs

- **Risk:** Bezier wire paths may differ slightly from Node-RED's real rendering
  → **Mitigation:** Adopt the exact `generateLinkPath()` algorithm from Node-RED's `view.js` (Apache 2.0 licensed, compatible with our use)

- **Risk:** HTML output with CDN D3.js fails in air-gapped environments
  → **Mitigation:** Document the CDN requirement; HTML is still viewable without D3 (static SVG fallback). Future: bundle D3 for offline use.

- **Risk:** Large flows (100+ nodes) produce unwieldy SVG/HTML
  → **Mitigation:** Support `flowId` filtering (render one flow at a time). SVG viewport auto-scales to fit content.

- **Trade-off:** No custom node icons in v1 — only text labels
  → **Acceptance:** Text labels are sufficient for identification. Icon support can be added later by fetching icons from the Node-RED instance or embedding sprites.

## Open Questions

1. **Should the HTML output open in VS Code's built-in browser or external browser?** The tool returns the HTML as text; the LLM can write it to a temp file and open it. VS Code's `simple browser` could be used if the MCP exposes a file URI.

2. **Should `render-staging` be a tool or a resource?** A tool (one-shot invocation with parameters) seems more appropriate than a resource (subscription-based). The staging state is point-in-time.

3. **Should we support `format: "png"` via a headless browser?** Deferred to v2. Would require Puppeteer/Playwright as an optional dependency, adding significant complexity.
