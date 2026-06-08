## 1. Scaffold renderer module

- [x] 1.1 Create `src/renderer/` directory with `index.js` that exports `renderStaging(flows, options)` as the unified entry point
- [x] 1.2 Define the internal intermediate representation (IR) type: `{ nodes: [], links: [], groups: [], junctions: [], dirtyIds: Set }`

## 2. Core geometry and layout

- [x] 2.1 Create `src/renderer/geometry.js` — port `generateLinkPath()` algorithm from Node-RED's `view.js` (Apache 2.0), adapted to accept node coordinates and return SVG path `d` strings
- [x] 2.2 Create `src/renderer/layout.js` — compute bounding box of a set of nodes, auto-fit viewport dimensions, and calculate scale factor for SVG/HTML output
- [x] 2.3 Add wire routing logic: for each link, call `generateLinkPath()` with source port Y offset (respects `outputs` count) and target node position

## 3. Color and style mapping

- [x] 3.1 Create `src/renderer/colors.js` with a hardcoded map of Node-RED core node types to fill colors (e.g., `inject → #a6bbcf`, `debug → #87a980`, `function → #fdd0a2`, `switch → #d8bfd8`, `change → #e2d6b8`, etc.)
- [x] 3.2 Add fallback to neutral grey (`#cccccc`) for unknown types
- [x] 3.3 Define dirty highlight style: `stroke: #ff8c00, stroke-width: 2` for SVG, `filter: drop-shadow(0 0 3px #ff8c00)` for HTML, `:::dirty` classDef for Mermaid

## 4. SVG builder

- [x] 4.1 Create `src/renderer/svg-builder.js` that accepts the IR and options and returns a complete SVG string
- [x] 4.2 Implement group rendering: dashed-rect containers with labels, containing member nodes
- [x] 4.3 Implement wire rendering: `<path>` elements with `d` from `generateLinkPath()`
- [x] 4.4 Implement node rendering: `<rect>` with type color, `<text>` for label (truncated if needed), input/output port indicators
- [x] 4.5 Implement dirty highlighting: orange stroke on dirty nodes via conditional attribute
- [x] 4.6 Implement disabled node styling: dashed stroke and reduced opacity for `d: true` nodes
- [x] 4.7 Add SVG grid background (optional, matching Node-RED's 20px grid pattern)
- [x] 4.8 Add legend explaining dirty highlight meaning (if any dirty nodes exist)

## 5. Mermaid builder

- [x] 5.1 Create `src/renderer/mermaid-builder.js` that migrates existing `generateMermaidDiagram()` from `src/tools/get-flow-diagram.js`
- [x] 5.2 Enhance with dirty highlighting: append `:::dirty` to dirty node declarations and emit `classDef dirty stroke:#ff8c00,stroke-width:3px`
- [x] 5.3 Preserve all existing Mermaid features: disabled node class (`:::disabled`), subgraph groups, edge labels for multiple outputs, pagination support

## 6. HTML builder

- [x] 6.1 Create `src/renderer/html-builder.js` that generates a self-contained HTML document string
- [x] 6.2 Embed all flow data as a `<script>const FLOWS = [...]</script>` tag for immediate first render
- [x] 6.3 Include D3.js v7 via CDN `<script>` tag (with comment noting the CDN requirement)
- [x] 6.4 Implement D3 rendering: enter/update/exit pattern for nodes, links, groups (similar to Node-RED's `_redraw()` but simplified)
- [x] 6.5 Add zoom/pan via `d3.zoom()` transform on the root SVG group
- [x] 6.6 Add hover tooltips using HTML `title` attribute or a custom tooltip div showing name, type, id, and dirty status
- [x] 6.7 Implement dirty highlighting: orange border and drop-shadow via CSS classes
- [x] 6.8 Add auto-fit on load: calculate bounding box and set initial `viewBox` or zoom transform
- [x] 6.9 Implement WebSocket client: connect to `ws://<host>/staging-ws`, parse `staging-update` messages, call D3 update pattern to re-render canvas without page reload
- [x] 6.10 Add disconnection banner: yellow bar at top saying "Disconnected — retrying…" when WebSocket closes, hidden when reconnected
- [x] 6.11 Implement auto-reconnect: retry WebSocket connection every 3s with exponential backoff (max 30s) after disconnect

## 7. WebSocket server and JSON endpoint

- [x] 7.1 Create `src/transport/ws-server.js` — a lightweight WebSocket server using Node.js built-in `http` module (no npm deps)
- [x] 7.2 Implement WebSocket handshake (HTTP upgrade) and message framing per RFC 6455
- [x] 7.3 Track connected clients in a `Set`; broadcast JSON messages to all on `staging:changed` event
- [x] 7.4 Send current staging state as initial message to newly connected clients
- [x] 7.5 Implement debounce/coalescing: accumulate `staging:changed` events within a 100ms window into a single broadcast
- [x] 7.6 Add `GET /staging-snapshot` HTTP endpoint to `src/server.js` that returns `{ flows, dirtyNodeIds, dirtyFlowIds }` as JSON
- [x] 7.7 Attach WebSocket server to the existing HTTP server in `src/server.js` (only when running in HTTP transport mode)

## 8. StagingStore event emitter

- [x] 8.1 Make `StagingStore` extend `EventEmitter` (or use a simple callback-based event system)
- [x] 8.2 Emit `staging:changed` event at the end of `applyMutation()` with `{ dirtyNodeIds, dirtyFlowIds }`
- [x] 8.3 Emit `staging:changed` event after `deploy()` (dirty sets become empty) to notify clients that staging is clean
- [x] 8.4 Expose `getDirtyNodeIds()` and `getDirtyFlowIds()` public getters (already tracked internally)

## 9. Render-staging tool

- [x] 9.1 Create `src/tools/render-staging.js` with tool definition (`name: "render-staging"`, annotations, output schema) and handler
- [x] 9.2 Define input parameters: `format` (enum: `"svg"`, `"html"`, `"mermaid"`), `flowId` (optional string), `highlightDirty` (optional boolean, default `true`)
- [x] 9.3 Handler logic: fetch flows from `StagingStore`, compute dirty node set, pass to `renderStaging()`, return formatted content
- [x] 9.4 Register the tool in `src/server.js` within the existing tool list
- [x] 9.5 Ensure `render-staging` is read-only (use `ANN_READONLY` annotation)

## 10. Consolidate get-flow-diagram

- [x] 8.1 Update `src/tools/get-flow-diagram.js` to delegate Mermaid generation to `renderer/mermaid-builder.js` instead of its own `generateMermaidDiagram()`
- [x] 8.2 Preserve existing handler signature, parameter validation, and output format (text with Mermaid code block)
- [x] 8.3 Verify backward compatibility: same `flowId`, same optional filters (`disabledOnly`, `nodeType`, `fromNodeId`, `direction`), same pagination (`offset`, `limit`)

## 11. Integration and wiring

- [x] 11.1 Ensure `src/renderer/index.js` accepts the dirty node set and passes it through to each builder
- [x] 11.2 Wire `ws-server.js` to listen on `staging:changed` events from `StagingStore`
- [x] 11.3 Register `render-staging` tool in `src/server.js` within the existing tool list
- [x] 11.4 Register `/staging-snapshot` endpoint and WebSocket upgrade handler in `src/server.js` HTTP transport
- [x] 11.5 Add the `render-staging` tool to the `list-skills` or tool catalog response if applicable
- [x] 11.6 Update `nodes.html` if needed (e.g., if the HTML preview uses the same page)

## 12. Tests

- [ ] 12.1 Unit test `src/renderer/geometry.js`: verify `generateLinkPath()` produces valid SVG path strings for horizontal, vertical, and angled connections
- [ ] 12.2 Unit test `src/renderer/colors.js`: verify known types get correct colors, unknown types get fallback grey
- [ ] 12.3 Unit test `src/renderer/svg-builder.js`: verify SVG string contains expected elements for a simple flow (inject → debug)
- [ ] 12.4 Unit test `src/renderer/mermaid-builder.js`: verify Mermaid output includes dirty classDef when dirty nodes present
- [ ] 12.5 Unit test `src/renderer/html-builder.js`: verify HTML string is valid, contains D3 CDN script, WebSocket client code, and embeds flow data
- [ ] 12.6 Unit test `src/transport/ws-server.js`: verify WebSocket handshake, broadcast to multiple clients, initial state on connect, coalescing of rapid events
- [ ] 12.7 Unit test `StagingStore` events: verify `staging:changed` emitted after `applyMutation()`, not emitted for no-op mutations, emitted after `deploy()` with empty dirty sets
- [ ] 12.8 Integration test `src/tools/render-staging.js`: verify tool returns SVG/HTML/Mermaid output for a staging store with known flows
- [ ] 12.9 Integration test: verify `GET /staging-snapshot` returns correct JSON with dirty node IDs
- [ ] 12.10 Integration test: verify WebSocket clients receive `staging-update` messages after mutations
- [ ] 12.11 Integration test: verify `get-flow-diagram` still returns valid Mermaid after migration to shared renderer
- [ ] 12.12 Visual smoke test: manually generate HTML for a complex flow, open in browser, verify it renders correctly, and confirm WebSocket live refresh works when editing flows via MCP
