## Why

The staging renderer (SVG/HTML/Mermaid) displays subflow instance nodes using their raw type string (e.g., `subflow:b5468f4.d96887`) instead of a human-readable name. In the Node-RED editor, subflow instances display the subflow definition's name when the instance has no explicit name set, but the MCP renderer never resolves this. Additionally, subflow instances render in the default gray color with no visual indicator that distinguishes them from other node types.

## What Changes

- **Name resolution**: In `ir-builder.js`, resolve subflow instance names by cross-referencing the flows array: if the instance has no `.name`, look up the subflow definition node (`type: "subflow"`) by extracting the definition ID from `type: "subflow:<uuid>"` and use its `.name`
- **Color**: Add a distinct color for subflow instance nodes in `colors.js` (Node-RED uses a light blue/turquoise for subflow instances)
- **Mermaid label**: Prefix subflow instance labels with a visual indicator like `[Subflow]` or similar to distinguish them from regular nodes
- **SVG/HTML**: Add a subtle visual badge or icon overlay indicating the node is a subflow instance

## Capabilities

### New Capabilities
- `render-subflow-names`: Human-readable name resolution and visual distinction for subflow instance nodes in all renderer outputs (SVG, HTML, Mermaid)

### Modified Capabilities
None — this is a new capability, not changing existing spec requirements.

## Impact

- **Files**: `src/renderer/ir-builder.js`, `src/renderer/colors.js`, `src/renderer/svg-builder.js` (badge overlay), `src/renderer/html-builder.js` (badge + name logic), `src/renderer/mermaid-builder.js` (label prefix)
- **Test files**: `tests/renderer/ir-builder.test.js`, `tests/renderer/svg-builder.test.js`, `tests/renderer/mermaid-builder.test.js`, `tests/renderer/html-builder.test.js`
- **No API changes**, no breaking changes
- **No new dependencies**
- **Requires redeploy** of the MCP server after changes
