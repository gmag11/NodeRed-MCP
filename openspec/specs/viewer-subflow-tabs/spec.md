## ADDED Requirements

### Requirement: Open subflow definition on double-click
When a user double-clicks a node whose type identifies it as a subflow instance (`type` starts with `subflow:`), the viewer SHALL open a tab showing that subflow's definition, rendered using the same node/link/group rendering and dirty-highlight logic used for regular flow tabs.

#### Scenario: Double-click opens a new subflow tab
- **WHEN** the user double-clicks a subflow instance node and no tab for that subflow definition is currently open
- **THEN** the viewer creates a new tab for that subflow definition, makes it the active tab, and renders the subflow's nodes, links, groups, and dirty-node highlighting

#### Scenario: Double-click on a non-subflow node does nothing
- **WHEN** the user double-clicks a node whose type does not start with `subflow:`
- **THEN** the viewer SHALL NOT open or switch any tab

### Requirement: Reuse an already-open subflow tab
If a subflow's tab is already open, double-clicking any instance of that subflow SHALL activate the existing tab instead of creating a duplicate, and SHALL NOT change that tab's position in the tab bar.

#### Scenario: Double-click on a subflow whose tab is already open
- **WHEN** the user double-clicks an instance of a subflow whose definition tab is already present in the tab bar
- **THEN** the viewer activates the existing tab without creating a new one and without moving it to a different position in the tab bar

### Requirement: Subflow tab insertion position
A newly opened subflow tab SHALL be inserted immediately to the right of the tab that was active at the moment it was opened.

#### Scenario: New subflow tab is inserted after the active tab
- **WHEN** the active tab is `Flow A` and the user double-clicks a subflow instance node on `Flow A`
- **THEN** the viewer inserts the new subflow tab immediately to the right of `Flow A` in the tab bar

### Requirement: Subflow tabs are closable
Each subflow tab SHALL display a close ("×") control. Regular flow tabs SHALL NOT display a close control.

#### Scenario: Closing a subflow tab
- **WHEN** the user clicks the close control on a subflow tab
- **THEN** the viewer removes that tab from the tab bar

#### Scenario: Closing the active subflow tab falls back to another tab
- **WHEN** the user closes a subflow tab that is currently active
- **THEN** the viewer activates the nearest remaining tab; if no tabs remain, the viewer shows the empty-canvas state

### Requirement: Nested subflow tabs
Double-clicking a subflow instance node rendered inside an already-open subflow tab SHALL open that nested subflow's definition as its own closable tab, following the same insertion-position and reuse rules as top-level subflow tabs. Closing a subflow tab SHALL NOT close any other tab, including subflow tabs that were opened from within it.

#### Scenario: Opening a subflow nested inside another open subflow tab
- **WHEN** the active tab is a subflow tab and the user double-clicks a subflow instance node rendered inside it
- **THEN** the viewer opens (or activates) a tab for the nested subflow's definition, inserted immediately to the right of the currently active (parent) subflow tab

#### Scenario: Closing a parent subflow tab does not close its children
- **WHEN** a subflow tab ("parent") has one or more subflow tabs open that were opened while it was active ("children"), and the user closes the parent tab
- **THEN** the child subflow tabs remain open and unaffected

### Requirement: Subflow tabs survive live flow updates
Open subflow tabs SHALL remain open, in the same position, across WebSocket flow updates and manual refreshes, as long as the referenced subflow definition still exists. If the referenced subflow definition no longer exists in the updated flow data, the viewer SHALL remove that tab automatically.

#### Scenario: Live update keeps an open subflow tab intact
- **WHEN** a WebSocket flow update or manual refresh occurs while a subflow tab is open and its subflow definition still exists
- **THEN** the subflow tab remains open, in its current position, and reflects the updated node/dirty state

#### Scenario: Live update removes a subflow tab for a deleted subflow
- **WHEN** a WebSocket flow update or manual refresh occurs and the subflow definition backing an open tab no longer exists
- **THEN** the viewer removes that tab automatically; if it was the active tab, the viewer falls back to the nearest remaining tab or the empty-canvas state
