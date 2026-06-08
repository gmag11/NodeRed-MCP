## ADDED Requirements

### Requirement: render-staging MCP tool
The system SHALL expose an MCP tool named `render-staging` that generates a visual representation of the current staging workspace. It SHALL accept a `format` parameter (`"svg"`, `"html"`, or `"mermaid"`) and an optional `flowId` parameter to filter to a single flow tab or subflow. It SHALL support an optional `highlightDirty` boolean (default `true`) that controls whether un-deployed nodes are visually distinguished.

#### Scenario: Render SVG format
- **WHEN** `render-staging` is invoked with `format: "svg"` and no `flowId`
- **THEN** the tool returns a valid SVG string containing all staged flows with nodes drawn as colored rectangles, wires as bezier paths, and groups as dashed containers

#### Scenario: Render HTML format
- **WHEN** `render-staging` is invoked with `format: "html"`
- **THEN** the tool returns a self-contained HTML document that when opened in a browser renders the staged flows with D3.js, supporting zoom, pan, and hover tooltips

#### Scenario: Render Mermaid format
- **WHEN** `render-staging` is invoked with `format: "mermaid"`
- **THEN** the tool returns a valid Mermaid `flowchart TD` string representing the topology of the staged flows

#### Scenario: Filter by flow
- **WHEN** `render-staging` is invoked with `flowId: "abc123"`
- **THEN** only nodes belonging to that flow tab or subflow appear in the output

#### Scenario: Flow not found
- **WHEN** `render-staging` is invoked with a `flowId` that does not match any flow
- **THEN** the tool returns an error indicating the flow was not found

### Requirement: Dirty node highlighting
When `highlightDirty` is enabled (the default), nodes with pending (un-deployed) changes SHALL be visually distinguished from clean nodes across all output formats. The visual indicator SHALL be an orange or amber outline, border, or glow effect that unmistakably differs from the normal node rendering.

#### Scenario: Dirty nodes highlighted in SVG
- **WHEN** a flow contains nodes A (clean), B (dirty/modified), and C (clean)
- **THEN** the SVG output renders node B with an orange stroke while nodes A and C have no special outline

#### Scenario: Dirty nodes highlighted in HTML
- **WHEN** the HTML output is rendered in a browser with `highlightDirty: true`
- **THEN** dirty nodes appear with an orange border and a CSS `filter: drop-shadow` glow effect

#### Scenario: Dirty nodes highlighted in Mermaid
- **WHEN** the Mermaid output is generated with `highlightDirty: true`
- **THEN** dirty nodes include a `:::dirty` CSS class and the diagram declares a `classDef dirty` style with an orange border

#### Scenario: Highlighting disabled
- **WHEN** `render-staging` is invoked with `highlightDirty: false`
- **THEN** all nodes render identically regardless of dirty state

### Requirement: Node type color mapping
Each node in the rendered output SHALL use the same fill color as Node-RED's editor for well-known core node types. Unknown or custom node types SHALL receive a neutral grey fill.

#### Scenario: Known node type has correct color
- **WHEN** the staging contains an `inject` node, a `debug` node, and a `function` node
- **THEN** the inject node is rendered with blue-grey fill (`#a6bbcf`), the debug node with green fill (`#87a980`), and the function node with orange fill (`#fdd0a2`)

#### Scenario: Unknown node type gets neutral color
- **WHEN** the staging contains a custom node type `my-custom-sensor` not in the known color map
- **THEN** the node is rendered with a neutral grey fill (`#cccccc`)

### Requirement: Node labels
Each node in the rendered output SHALL display its `name` if present, otherwise its `type`. Labels SHALL use the same text size and positioning conventions as Node-RED's editor (centered within the node rectangle, single or multi-line).

#### Scenario: Named node displays its name
- **WHEN** a node has `name: "Parse JSON"` and `type: "json"`
- **THEN** the rendered node displays the label "Parse JSON"

#### Scenario: Unnamed node displays its type
- **WHEN** a node has `type: "inject"` and no `name` property
- **THEN** the rendered node displays the label "inject"

### Requirement: Wire rendering with bezier curves
Connection wires between nodes SHALL be rendered as SVG bezier curves (cubic Bézier paths) that match the visual style of Node-RED's editor: horizontal curves when nodes are at similar Y positions, and stepped L-shaped paths when nodes are vertically separated.

#### Scenario: Horizontal wire between adjacent nodes
- **WHEN** node A (x=100, y=50) is connected to node B (x=300, y=50)
- **THEN** the wire is rendered as a smooth horizontal Bézier curve with control points offset horizontally

#### Scenario: Vertical wire between stacked nodes
- **WHEN** node A (x=100, y=50) is connected to node B (x=100, y=150)
- **THEN** the wire is rendered as an L-shaped path with vertical segments and horizontal connectors

#### Scenario: Node with multiple output ports
- **WHEN** a switch node with 3 outputs connects to nodes A, B, C (one per port)
- **THEN** the wires source from distinct Y positions on the switch node's right edge, corresponding to each output port

### Requirement: Group container rendering
Group nodes SHALL be rendered as dashed-outline rectangles that contain their member nodes. The group label SHALL be displayed in the top-left corner of the container.

#### Scenario: Group containing nodes
- **WHEN** a group node `g1` contains nodes A and B, and has `name: "Input Pipeline"`
- **THEN** the rendered output shows a dashed rectangle around nodes A and B with the label "Input Pipeline" at the top-left

#### Scenario: Empty group
- **WHEN** a group node exists but contains no member nodes
- **THEN** the group SHALL still be rendered as a small dashed rectangle with its label

### Requirement: Disabled node styling
Disabled nodes (`d: true`) SHALL be visually distinguished from enabled nodes using a dashed border and reduced opacity, matching Node-RED's editor convention.

#### Scenario: Disabled node
- **WHEN** a node has `d: true`
- **THEN** the node is rendered with a dashed stroke and reduced fill opacity compared to enabled nodes

### Requirement: HTML interactivity
The HTML output format SHALL support the following interactive features:
- **Zoom**: Mouse wheel or pinch-to-zoom within the canvas
- **Pan**: Click-and-drag to scroll the viewport
- **Hover tooltips**: Hovering over a node SHALL display its `name`, `type`, `id`, and dirty status
- **Fit-to-view**: The initial view SHALL be scaled to fit all nodes in the viewport

#### Scenario: Zoom with mouse wheel
- **WHEN** the HTML output is opened in a browser and the user scrolls the mouse wheel over the canvas
- **THEN** the view zooms in or out centered on the cursor position

#### Scenario: Pan with drag
- **WHEN** the user clicks and drags on empty canvas space
- **THEN** the viewport scrolls in the drag direction

#### Scenario: Hover tooltip on node
- **WHEN** the user hovers the cursor over a node
- **THEN** a tooltip appears showing the node's name, type, id, and dirty status (if applicable)

#### Scenario: Initial fit-to-view
- **WHEN** the HTML page first loads
- **THEN** the zoom level and scroll position are set so that all nodes are visible within the viewport

### Requirement: Staging snapshot JSON endpoint
The system SHALL expose an HTTP endpoint `GET /staging-snapshot` that returns the current staging flows as a JSON object `{ flows: [], dirtyNodeIds: [], dirtyFlowIds: [] }`. This endpoint SHALL be available only when the MCP is running in HTTP transport mode. It SHALL NOT trigger a lazy-load if staging is already loaded; if staging is not yet loaded, it SHALL trigger `ensureLoaded()` before returning data.

#### Scenario: Snapshot with pending changes
- **WHEN** `GET /staging-snapshot` is requested after mutations have been applied but before deploy
- **THEN** the response contains the full `flows` array and `dirtyNodeIds` includes the IDs of modified nodes

#### Scenario: Snapshot with clean staging
- **WHEN** `GET /staging-snapshot` is requested after a successful deploy
- **THEN** the response contains `flows` and `dirtyNodeIds: []`

### Requirement: WebSocket live refresh
The system SHALL expose a WebSocket endpoint at `/staging-ws` that pushes updated staging data to connected clients whenever the `StagingStore` mutates. The message format SHALL be a JSON object `{ type: "staging-update", flows: [], dirtyNodeIds: [], dirtyFlowIds: [] }`. Messages SHALL be broadcast to all connected clients. Mutations that occur within a 100ms window SHALL be coalesced into a single message.

#### Scenario: WebSocket update on node creation
- **WHEN** an MCP tool creates a new node via `applyMutation()`
- **THEN** all connected WebSocket clients receive a `staging-update` message containing the updated flows and dirty node IDs within 150ms

#### Scenario: WebSocket coalesced updates
- **WHEN** three mutations occur within 50ms of each other (e.g., create-node + connect-nodes + update-node in quick succession)
- **THEN** connected clients receive a single `staging-update` message reflecting all three changes

#### Scenario: WebSocket client connects mid-session
- **WHEN** a new WebSocket client connects to `/staging-ws` while staging is already loaded
- **THEN** the server SHALL immediately send the current staging state as the first message to the new client

#### Scenario: WebSocket reconnection after disconnect
- **WHEN** a WebSocket client disconnects and reconnects within 30 seconds
- **THEN** the server SHALL send the current staging state upon reconnection

### Requirement: StagingStore change events
The `StagingStore` SHALL emit a `staging:changed` event after each successful `applyMutation()` call, containing `{ dirtyNodeIds: string[], dirtyFlowIds: string[] }`. The event SHALL be emitted synchronously (before the `applyMutation` promise resolves).

#### Scenario: Event emitted after mutation
- **WHEN** `applyMutation()` completes successfully and modifies one or more nodes
- **THEN** a `staging:changed` event is emitted with the updated dirty node and flow ID sets

#### Scenario: No event for no-op mutation
- **WHEN** `applyMutation()` is called with a function that makes no actual changes to any node
- **THEN** no `staging:changed` event is emitted (or the event has empty dirty arrays)

### Requirement: HTML live refresh via WebSocket
The HTML output format SHALL include a WebSocket client that connects to the MCP server's `/staging-ws` endpoint. Upon receiving a `staging-update` message, the page SHALL re-render the flow canvas using D3.js's update pattern (not full page reload). The initial render SHALL use the embedded `<script>` data; subsequent updates SHALL come exclusively from WebSocket messages.

#### Scenario: Automatic update on staging change
- **WHEN** the HTML page is open in a browser with an active WebSocket connection, and the LLM modifies the staging state
- **THEN** the canvas updates within 200ms of the change without any user interaction

#### Scenario: Disconnection banner
- **WHEN** the WebSocket connection is lost (server restart, network issue)
- **THEN** a non-intrusive yellow banner appears at the top of the page reading "Disconnected — retrying…" and the last-known flow state remains visible

#### Scenario: Automatic reconnection
- **WHEN** the WebSocket connection is lost and the server becomes available again
- **THEN** the page automatically reconnects within 3 seconds and resumes receiving live updates

### Requirement: Mermaid dirty highlighting
The Mermaid output format SHALL mark dirty nodes with a `:::dirty` CSS class suffix and include a `classDef dirty` style declaration that renders dirty nodes with an orange border.

#### Scenario: Mermaid diagram with dirty nodes
- **WHEN** a flow has nodes A (dirty) → B (clean) → C (dirty)
- **THEN** the Mermaid output includes `A[Node A]:::dirty`, `C[Node C]:::dirty`, and a `classDef dirty stroke:#ff8c00,stroke-width:3px` declaration
