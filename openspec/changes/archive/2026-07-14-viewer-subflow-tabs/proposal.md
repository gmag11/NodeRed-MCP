## Why

The flow viewer renders subflow instance nodes as opaque boxes with an "S" badge — there is no way to inspect what a subflow contains without leaving the viewer. Node-RED's own editor lets users double-click a subflow instance to drill into its definition in a new tab. The viewer should offer the same discoverability so users can navigate nested flows without switching tools.

## What Changes

- Add a double-click handler on nodes rendered in the viewer canvas, active only for nodes whose `type` starts with `subflow:`.
- Double-clicking a subflow instance opens (or activates) a tab showing that subflow's definition, rendered with the same node/link/group/dirty-highlight logic already used for regular flow tabs.
- The new subflow tab is inserted immediately to the right of the tab that was active when it was opened.
- Subflow tabs carry a close ("×") control; closing one removes it from the tab bar. If the closed tab was active, the viewer falls back to the nearest remaining tab.
- Re-opening (double-clicking) a subflow whose tab is already open activates that existing tab instead of creating a duplicate, and does not change its position in the tab bar.
- Nested subflows (a subflow instance placed inside another subflow's definition) work the same way: double-clicking one inside an already-open subflow tab opens its own closable tab, positioned right after the currently active (parent) tab.
- Closing a subflow tab never closes any other tab — closing a parent subflow's tab leaves any child subflow tabs open.
- Live updates (WebSocket push, manual refresh) preserve currently open subflow tabs as long as the underlying subflow definition still exists; subflow tabs whose definition was deleted are removed automatically.

## Capabilities

### New Capabilities
- `viewer-subflow-tabs`: Double-clicking a subflow instance node in the flow viewer opens that subflow's definition as a closable tab, positioned right after the currently active tab, reusing the existing tab if already open, and displayed with the same rendering/dirty-highlight behavior as regular flow tabs. This works uniformly for nested subflows (a subflow tab opened from within another subflow tab), and closing a tab never cascades to close other tabs.

### Modified Capabilities
<!-- None - existing flow-tab rendering and dirty-highlight requirements are reused unchanged for subflow tabs -->

## Impact

- **Code**: `src/renderer/html-builder.js` — add a double-click listener on `.nr-node`, subflow-tab state tracking (open tabs, insertion order, active tab), tab-bar rendering for closable tabs, and reconciliation of subflow tabs on WebSocket/refresh updates.
- **No API changes, no dependency changes, no breaking changes.**
