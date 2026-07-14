## 1. Core Implementation

- [x] 1.1 Add `zoom.filter()` to exclude wheel events from d3.zoom behavior (preserves pinch-to-zoom and drag-to-pan)
- [x] 1.2 Add native `wheel` event listener on SVG that reads `event.deltaY` and `event.deltaX` to compute new translate offset
- [x] 1.3 Apply new transform via `svg.call(zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(currentScale))` so zoomState stays in sync
- [x] 1.4 Update `zoomState[currentTabId]` on each wheel pan so per-tab position is preserved across tab switches
- [x] 1.5 Fix filter to allow touch events (pinch-to-zoom) and Ctrl+wheel zoom through d3.zoom
- [x] 1.6 Skip custom wheel handler when Ctrl is pressed so d3.zoom handles Ctrl+wheel zoom

## 2. Verification

- [x] 2.1 Manual test: wheel up/down pans vertically, no zoom
- [x] 2.2 Manual test: wheel tilt left/right pans horizontally
- [x] 2.3 Manual test: pinch-to-zoom still works
- [x] 2.4 Manual test: click-and-drag pan still works
- [x] 2.5 Manual test: switching tabs preserves pan position
- [x] 2.6 Manual test: Ctrl+wheel up zooms in
- [x] 2.7 Manual test: Ctrl+wheel down zooms out
