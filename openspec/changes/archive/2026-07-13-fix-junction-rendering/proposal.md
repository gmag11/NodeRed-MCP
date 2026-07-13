## Why

Node-RED junction nodes (`type: "junction"`) are wire-routing nodes that allow splitting/joining wires without a logical processing node. In the Node-RED editor, junctions are rendered as small circles (~12px radius, gray fill) at wire intersection points — visible but unobtrusive.

The current renderer (SVG, Mermaid, and HTML formats) completely filters junctions out of the node list AND loses wire connectivity through them. Junctions are invisible and wires that pass through them are dropped, producing broken diagrams for any flow that uses junctions.

## What Changes

- **`ir-builder.js`**: Keep junctions in the IR node list but flag them with `isJunction: true` so renderers can style them differently. Resolve wire paths through junctions so wires connect THROUGH junctions to their real destinations.
- **`svg-builder.js`**: Render junction nodes as small filled circles (~12px radius, ~#999 fill) instead of standard node rectangles. No label, no port indicators.
- **`mermaid-builder.js`**: Render junctions as small circle nodes with distinct styling (no label, minimal footprint).
- **`html-builder.js`**: Render junctions as small circles in the D3.js canvas. Apply same junction wire resolution logic.
- **`colors.js`**: Add junction color/style entry for consistent styling across formats.

## Capabilities

### New Capabilities
- `junction-rendering`: Junction nodes are rendered as small circles (matching Node-RED editor appearance) in all three visualizer formats (SVG, Mermaid, HTML). Wire paths through junctions are resolved so connectivity is preserved.

### Modified Capabilities
- `staging-store`: The staging visualizer now shows junctions as visible elements and preserves correct wiring topology through them — a behavioral change to the existing rendering capability.

## Impact

- **`src/renderer/ir-builder.js`**: Junctions kept in `nodes[]` with `isJunction: true` flag. New `resolveTargets()` helper (BFS with cycle guard) to traverse junction wires. Link-building loop resolves through junctions.
- **`src/renderer/svg-builder.js`**: New `buildJunctionSVG()` function for small circle rendering. Junction nodes get junction-specific rendering in the node loop.
- **`src/renderer/mermaid-builder.js`**: Junction nodes rendered as circle nodes `((...))` with no label.
- **`src/renderer/html-builder.js`**: Junction circle rendering in D3 canvas. Inline junction wire resolution in `buildTabData()`.
- **`src/renderer/colors.js`**: Junction style entry (fill, stroke, radius).
- **`tests/renderer/`**: New test cases covering junction rendering and wire resolution for all fixture scenarios.
- No API changes, no dependency changes, no breaking changes.
