## ADDED Requirements

### Requirement: export-flow MCP tool
The system SHALL expose an MCP tool named `export-flow` that accepts `exportMode` (optional string, `"flow"` | `"nodes"`, default `"flow"`), `flowId` (optional string), and `nodeIds` (optional array of strings). It SHALL return the selected content as a Node-RED-compatible JSON array string.

#### Scenario: Export a single flow by ID (flow mode)
- **WHEN** `export-flow` is invoked with `exportMode: "flow"` and a valid `flowId`
- **THEN** the tool returns `{ exportMode: "flow", flowId, label, nodeCount, json }` where `json` is a stringified array of the tab node, all its child nodes, and any referenced config nodes

#### Scenario: Export all flows (flow mode, no flowId)
- **WHEN** `export-flow` is invoked with `exportMode: "flow"` and no `flowId`
- **THEN** the tool returns `{ exportMode: "flow", nodeCount, json }` where `json` is a stringified array of all nodes (tabs, children, config nodes) from the Node-RED instance

#### Scenario: Export selected nodes (nodes mode)
- **WHEN** `export-flow` is invoked with `exportMode: "nodes"` and a non-empty `nodeIds` array
- **THEN** the tool returns `{ exportMode: "nodes", nodeCount, json }` where `json` contains only the specified nodes with wires trimmed to exclude targets outside the selection

#### Scenario: Wire trimming in nodes mode
- **WHEN** a node in the selection has a wire to a node not in `nodeIds`
- **THEN** that wire target is removed; if the port has no remaining targets it becomes `[]`

#### Scenario: nodes mode requires nodeIds
- **WHEN** `exportMode: "nodes"` is used but `nodeIds` is empty or omitted
- **THEN** the tool returns an error: `exportMode "nodes" requires a non-empty nodeIds array`

#### Scenario: Unknown flowId
- **WHEN** `exportMode: "flow"` with `flowId` is provided but does not match any tab
- **THEN** the tool returns an error: `Flow '<flowId>' not found`

#### Scenario: Exported JSON is re-importable
- **WHEN** the returned `json` string is passed to `import-flow` with `conflictStrategy: "regenerate"`
- **THEN** the flow is successfully imported as a duplicate

### Requirement: Single flow export includes referenced config nodes
The tool SHALL include config nodes (nodes with no `z` property) that are referenced by any property of the exported flow's child nodes when using `exportMode: "flow"`.

#### Scenario: Config node is included in flow mode
- **WHEN** a flow contains an MQTT node referencing an `mqtt-broker` config node
- **THEN** the exported JSON includes that `mqtt-broker` config node

#### Scenario: Config nodes are not auto-included in nodes mode
- **WHEN** `exportMode: "nodes"` is used and a selected node references a config node
- **THEN** the config node is NOT included unless its ID is explicitly in `nodeIds`
