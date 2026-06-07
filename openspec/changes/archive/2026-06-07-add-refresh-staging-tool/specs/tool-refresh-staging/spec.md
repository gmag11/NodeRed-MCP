## ADDED Requirements

### Requirement: refresh-staging MCP tool
The system SHALL expose an MCP tool named `refresh-staging` that requires no input parameters. It SHALL discard all un-deployed staged changes in the in-memory staging store and re-fetch the latest flow state from the Node-RED Admin API (`GET /flows`). It SHALL return a response containing: the previous staging summary (what was discarded), a warning message that un-deployed edits were lost, and the new staging summary (confirming the sync is complete and clean).

#### Scenario: Successful refresh with pending changes
- **WHEN** an MCP client invokes `refresh-staging` and there are un-deployed staged changes (e.g., 3 dirty nodes)
- **THEN** the tool SHALL call `invalidate()` on the staging store to clear the cache and dirty tracking
- **AND** the tool SHALL call `ensureLoaded()` to re-fetch flows from Node-RED
- **AND** the response SHALL include `previousPendingChanges: 3` and `previousDirtyNodeIds` listing the discarded node IDs
- **AND** the response SHALL include `warning: "All un-deployed staged changes have been discarded."`
- **AND** the response SHALL include `staging: { pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true }`

#### Scenario: Successful refresh with no pending changes
- **WHEN** an MCP client invokes `refresh-staging` and there are no un-deployed changes
- **THEN** the tool SHALL still invalidate and re-fetch from Node-RED to ensure the latest state
- **AND** the response SHALL include `previousPendingChanges: 0`
- **AND** the response SHALL include `warning` with the same message (as a reminder that any hypothetical stale state was discarded)
- **AND** the response SHALL include `staging: { pendingChanges: 0, deployed: true }`

#### Scenario: Refresh after external edits to Node-RED
- **WHEN** an MCP client has made staged edits locally, and a user has also modified flows in the Node-RED editor UI
- **WHEN** the client invokes `refresh-staging`
- **THEN** the staging store SHALL reflect the flows as they exist in the backend (including the user's UI edits and excluding the agent's staged edits)
- **AND** the response SHALL return `staging.deployed: true` with no dirty nodes

#### Scenario: Refresh when staging not yet loaded
- **WHEN** an MCP client invokes `refresh-staging` before any other tool has triggered the lazy-load of flows
- **THEN** the tool SHALL still succeed: `invalidate()` is a no-op on an unloaded store, and `ensureLoaded()` triggers the initial fetch
- **AND** the response SHALL include `previousPendingChanges: 0`

#### Scenario: Node-RED API is unreachable during refresh
- **WHEN** an MCP client invokes `refresh-staging` but the Node-RED instance is not reachable
- **THEN** the tool SHALL throw an error indicating the API request failed (e.g., "Failed to refresh staging: connection refused")
- **AND** the staging store SHALL remain in its previous state (invalidation only occurs after a successful fetch)
