## Why

The MCP enables LLMs to build Node-RED flows programmatically via a staging model (write → stage → deploy). Today, the human user is **blind** during the process — they cannot see the staged flows until the LLM deploys them. The only existing visualization tool (`get-flow-diagram`) produces Mermaid text diagrams designed for LLM consumption, not human visual inspection. Users need a way to see what the LLM is building *before* it hits the live runtime, just as a developer watches code appear in their editor while an AI writes it.

## What Changes

- **New MCP tool `render-staging`** that generates visual representations of the staged flows in multiple formats:
  - **`svg`**: Server-side rendered SVG showing real node positions, wires (bezier curves), groups, and colors by node type. Embeddable in chat responses.
  - **`html`**: Self-contained interactive HTML page with D3.js rendering, supporting zoom, pan, hover tooltips, and **live WebSocket refresh** so the visualization updates automatically whenever the staging state changes. Opens in any browser.
  - **`mermaid`**: Enhanced Mermaid output (superseding `get-flow-diagram` with staging-aware dirty highlighting).
- **Dirty node highlighting**: Nodes with un-deployed changes are visually distinguished (orange border/glow) across all formats — something the real Node-RED editor does NOT show.
- **WebSocket endpoint** (`/staging-ws`): Pushes updated flow data to connected HTML viewers whenever the staging state mutates. The `StagingStore` emits change events; a lightweight WebSocket server relays them to browsers.
- **JSON snapshot endpoint** (`GET /staging-snapshot`): Returns raw flows JSON for the HTML page's initial load and periodic reconnection fallback.
- **`get-flow-diagram` updated** to delegate to `render-staging` with `format: "mermaid"` for consistency. The existing tool remains available but its implementation is unified under the new renderer.
- **New shared module `src/renderer/`** containing the core rendering logic (node layout, bezier wire paths, color mapping, SVG/HTML generation) extracted from Node-RED's `view.js` patterns.

## Capabilities

### New Capabilities
- `staging-visualization`: Human-readable visual rendering of the staging workspace in SVG, HTML, and enhanced Mermaid formats, with dirty-state highlighting and interactive navigation.

### Modified Capabilities
- `tool-get-flow-diagram`: Internally delegates to the new unified renderer for Mermaid output. External API behavior is preserved (same parameters, same output format). No spec-level requirement changes — this is a pure implementation consolidation.

## Impact

- **New files**: `src/renderer/` directory with SVG/HTML/Mermaid rendering modules, `src/tools/render-staging.js` tool handler, `src/transport/ws-server.js` WebSocket server
- **Modified files**: `src/server.js` (register new tool, add `/staging-snapshot` endpoint, attach WebSocket server), `src/tools/get-flow-diagram.js` (delegate to renderer), `src/staging-store.js` (expose dirty state for highlighting, emit change events)
- **Dependencies**: No new npm dependencies for SVG/Mermaid (pure JS). Optional: D3.js (v7, ~200KB) bundled in HTML output for interactive mode.
- **No breaking changes**: Existing `get-flow-diagram` API preserved.
