## 1. Core Implementation

- [ ] 1.1 Add `zoom.filter()` to exclude wheel events from d3.zoom behavior (preserves pinch-to-zoom and drag-to-pan)
- [ ] 1.2 Add native `wheel` event listener on SVG that reads `event.deltaY` and `event.deltaX` to compute new translate offset
- [ ] 1.3 Apply new transform via `svg.call(zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(currentScale))` so zoomState stays in sync
- [ ] 1.4 Update `zoomState[currentTabId]` on each wheel pan so per-tab position is preserved across tab switches

## 2. Verification

- [ ] 2.1 Manual test: wheel up/down pans vertically, no zoom
- [ ] 2.2 Manual test: wheel tilt left/right pans horizontally
- [ ] 2.3 Manual test: pinch-to-zoom still works
- [ ] 2.4 Manual test: click-and-drag pan still works
- [ ] 2.5 Manual test: switching tabs preserves pan position
