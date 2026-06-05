## Why

Node-RED groups are rectangles drawn on the flow canvas that visually organize related nodes with customizable colors, labels, and borders. They are a first-class Node-RED data model concept (stored as `type: "group"` nodes with `style`, `nodes[]`, and bounding-box geometry). The MCP currently has zero tooling for groups — an agent cannot create, modify, or delete them, severely limiting its ability to produce well-organized, readable flows.

## What Changes

- **Add four new MCP tools** for group lifecycle management:
  - `add-nodes-to-group`: Assign nodes to a group (existing or new). Auto-calculates bounding rectangle if the group is new. Validates spatial proximity to avoid confusing overlaps.
  - `remove-nodes-from-group`: Detach nodes from a group. Optionally repositions them outside the group's bounding rectangle.
  - `update-group`: Modify group style metadata (colors, label position, name). Thin wrapper that leverages `update-node` internally if the group already exists.
  - `delete-group`: Permanently remove a group. Deletes associated member nodes by default; can skip deletion if nodes are first ungrouped with `remove-nodes-from-group`.

- **Modify `get-flow-nodes`** to include group nodes (`type: "group"`) in flow-level results and expose the `g` (groupId) property on member nodes.

- **Modify `get-flow-diagram`** to render groups as Mermaid `subgraph` containers with style annotations, giving agents and users visual feedback on group boundaries.

## Capabilities

### New Capabilities
- `tool-add-nodes-to-group`: Add nodes to an existing or new group, with auto-creation and bounding-box computation.
- `tool-remove-nodes-from-group`: Remove nodes from a group with optional spatial repositioning.
- `tool-update-group`: Modify group metadata (name, style, colors).
- `tool-delete-group`: Delete a group, with or without its member nodes.

### Modified Capabilities
- `tool-get-flow-nodes`: Expose `g` property on nodes; include `type: "group"` nodes in flow results so agents can discover grouping structure.
- `tool-get-flow-diagram`: Render group boundaries as Mermaid `subgraph` blocks to visualize group containment.

## Impact

- **New source files**: `src/tools/add-nodes-to-group.js`, `src/tools/remove-nodes-from-group.js`, `src/tools/update-group.js`, `src/tools/delete-group.js`
- **Modified source files**: `src/tools/flow-utils.js` (add `isGroupNode` helper, update `METADATA_FIELDS` to expose `g`, update `getFlowNodes` to include group nodes), `src/tools/get-flow-nodes.js` (include `g` in node shape), `src/tools/get-flow-diagram.js` (render groups as Mermaid subgraphs), `src/server.js` (register 4 new tools)
- **New test files**: `tests/tools/add-nodes-to-group.test.js`, `tests/tools/remove-nodes-from-group.test.js`, `tests/tools/update-group.test.js`, `tests/tools/delete-group.test.js`
- **Modified test files**: `tests/tools/flow-utils.test.js`, `tests/tools/get-flow-nodes.test.js`, `tests/tools/get-flow-diagram.test.js`
- **No dependency changes**: All operations use existing `GET /flows` + `POST /flows` API with `Node-RED-Deployment-Type: flows`
