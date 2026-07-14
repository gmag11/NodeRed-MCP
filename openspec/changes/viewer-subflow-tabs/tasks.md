## 1. Tab data model changes

- [x] 1.1 Add `kind` field (`'tab'` or `'subflow'`) to entries produced by `extractTabs()` and to `tabs` in general
- [x] 1.2 Replace the wholesale `tabs = extractTabs(ALL_FLOWS)` reassignment (in the WebSocket handler and `applySnapshot`) with a `reconcileTabs(freshRegularTabs)` function that: drops stale `subflow` entries whose definition no longer exists, updates metadata of surviving `tab` entries, drops deleted `tab` entries, appends brand-new `tab` entries at the end
- [x] 1.3 Change `hasTabs`/tab-bar visibility to be computed dynamically from `tabs.length > 1` inside `buildTabBar()` instead of the fixed flag set at load time

## 2. Open / activate / close subflow tabs

- [x] 2.1 Implement `openSubflowTab(defId)`: resolve the subflow definition by id from `ALL_FLOWS`, no-op if not found; if a tab for `defId` already exists, call `switchTab(defId)` and return; otherwise splice a new `{ id: defId, name, kind: 'subflow' }` entry into `tabs` immediately after the current active tab's index, then rebuild the tab bar and switch to it
- [x] 2.2 Implement `closeSubflowTab(id)`: remove the entry from `tabs`, clear its `zoomState` entry; if it was the active tab, activate the nearest remaining tab or show the empty-canvas state if none remain; rebuild the tab bar
- [x] 2.3 Guard `switchTab`/rendering so closing the last tab correctly resets `currentTabId` and shows the empty-canvas label

## 3. Node interaction

- [x] 3.1 Add a `dblclick` listener on rendered node elements (`.nr-node`) that checks `d.type` starts with `subflow:`; if so, extract the definition id via `d.type.slice('subflow:'.length)` and call `openSubflowTab(defId)`; no-op for all other node types

## 4. Tab bar rendering

- [x] 4.1 In `buildTabBar()`, render a close ("×") control for entries with `kind === 'subflow'` only; wire its click handler to call `closeSubflowTab(id)` with `event.stopPropagation()` so it doesn't also trigger tab activation
- [x] 4.2 Add CSS for the close control (`.nr-tab-close`) matching the existing tab bar visual style (hover state, sizing, spacing)

## 5. Tests

- [x] 5.1 Add/update tests in `tests/renderer/html-builder.test.js` asserting the generated HTML contains `openSubflowTab`, `closeSubflowTab`, and the `dblclick` listener wiring
- [x] 5.2 Add a test asserting subflow-typed nodes get the double-click handler while other node types are unaffected (string-content assertion consistent with existing test style)
- [x] 5.3 Add a test asserting `reconcileTabs` logic is present (replacing wholesale `tabs = extractTabs(...)` reassignment) so regressions on subflow-tab-loss-on-refresh are caught structurally
- [x] 5.4 Add a test asserting no `parentId`/cascade-close logic exists tying a subflow tab's lifecycle to another tab (closing one entry only ever removes that one entry)

## 6. Manual verification

- [ ] 6.1 Start the dev stack (`docker compose up -d`), open the staging viewer, double-click a subflow instance node, confirm a new closable tab opens to the right of the active tab and renders the subflow's nodes with dirty highlighting
- [ ] 6.2 Double-click the same subflow instance again (or another instance of it) and confirm the existing tab activates without duplicating or moving
- [ ] 6.3 Close the subflow tab via the "×" control and confirm fallback to an adjacent tab
- [ ] 6.4 Trigger a live flow update (deploy or edit) while a subflow tab is open and confirm it stays open in place; delete the subflow and confirm its tab disappears automatically
- [ ] 6.5 Open a subflow tab, then double-click a subflow instance nested inside it, confirm the nested subflow opens its own closable tab right after the parent; close the parent tab and confirm the nested (child) tab stays open
