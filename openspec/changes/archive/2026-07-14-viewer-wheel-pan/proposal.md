## Why

The flow viewer's mouse wheel behavior diverges from the Node-RED editor's established interaction model. Currently the wheel zooms instead of panning vertically, and wheel tilt left/right does nothing. This inconsistency forces users to learn two different interaction patterns and disrupts muscle memory when switching between the editor and the viewer.

## What Changes

- Disable the default wheel zoom on the d3.zoom behavior
- Add a custom wheel handler that pans the view vertically on scroll up/down
- Add a custom wheel tilt handler that pans the view horizontally on tilt left/right
- Keep pinch-to-zoom (touch gesture) and click-and-drag pan intact

## Capabilities

### New Capabilities
- `viewer-wheel-pan`: Flow viewer uses mouse wheel up/down to pan vertically and wheel tilt left/right to pan horizontally, matching the Node-RED editor interaction model. Pinch-to-zoom and drag-to-pan remain unchanged.

### Modified Capabilities
<!-- None - existing spec behavior for zoom/pan does not change at the requirement level -->

## Impact

- **Code**: `src/renderer/html-builder.js` — modify the d3.zoom configuration and add custom wheel/wheel tilt handlers in the generated HTML viewer script
- **No API changes, no dependency changes, no breaking changes**
