# staging-store Specification

## Purpose
In-memory staging layer that holds a local copy of Node-RED flows, enabling write tools to mutate locally and deploy explicitly.

## ADDED Requirements

### Requirement: Lazy-load flows on first access
The staging store SHALL lazy-load flows from Node-RED by calling `GET /flows` on the first access. On MCP server startup, staging SHALL be empty (`isLoaded=false`) and SHALL NOT make any HTTP calls until a tool triggers the first access. Staging SHALL NOT persist across MCP server restarts.

#### Scenario: First access triggers fetch
- **WHEN** `getFlows()` is called and `isLoaded` is `false`
- **THEN** the staging store SHALL call `GET /flows` on the Node-RED Admin API, store the returned flows array and `rev` value, set `isLoaded=true`, and return the flows

#### Scenario: Subsequent access uses cached data
- **WHEN** `getFlows()` is called and `isLoaded` is `true`
- **THEN** the staging store SHALL return the cached flows array without making an HTTP call

#### Scenario: Server restart clears staging
- **WHEN** the MCP server process restarts
- **THEN** staging SHALL be empty (`isLoaded=false`) with no cached flows

### Requirement: getFlows returns staged flows
The staging store SHALL provide a `getFlows()` method that returns the current staged flows array. If staging is not yet loaded, it SHALL trigger a lazy-load first.

#### Scenario: Return full flows array
- **WHEN** `getFlows()` is called after flows have been loaded
- **THEN** it SHALL return the complete flows array including any staged mutations

### Requirement: applyMutation for staged changes
The staging store SHALL provide an `applyMutation(fn)` method that accepts a pure mutation function, applies it to the staged flows array, and tracks dirty state. The mutation function receives the flows array and returns the modified array (or modifies in place). After the mutation, the staging store SHALL update its dirty tracking sets.

#### Scenario: Apply a mutation that adds a node
- **WHEN** `applyMutation(fn)` is called with a function that appends a node to the flows array
- **THEN** the flows array SHALL contain the new node and the node's ID SHALL be added to the dirty nodes set

#### Scenario: Apply a mutation that modifies a node
- **WHEN** `applyMutation(fn)` is called with a function that updates properties of an existing node
- **THEN** the node's properties SHALL be updated in the staged flows and the node's ID SHALL be added to the dirty nodes set

#### Scenario: Apply a mutation that removes a node
- **WHEN** `applyMutation(fn)` is called with a function that removes a node from the flows array
- **THEN** the node SHALL no longer exist in the staged flows and the node's ID SHALL be added to the dirty nodes set

### Requirement: Dirty state tracking
The staging store SHALL track dirty nodes (a Set of node IDs that changed) and dirty flows (a Set of flow IDs that changed). These sets SHALL grow as mutations are applied and SHALL only be cleared after a successful deploy.

#### Scenario: Track dirty nodes after mutation
- **WHEN** a mutation modifies nodes with IDs `"n1"` and `"n2"`
- **THEN** the dirty nodes set SHALL contain `"n1"` and `"n2"`

#### Scenario: Track dirty flows after mutation
- **WHEN** a mutation modifies a node belonging to flow `"f1"`
- **THEN** the dirty flows set SHALL contain `"f1"`

#### Scenario: Accumulate dirty state across mutations
- **WHEN** mutation A marks node `"n1"` dirty and mutation B marks node `"n2"` dirty
- **THEN** the dirty nodes set SHALL contain both `"n1"` and `"n2"`

### Requirement: Deploy staged flows
The staging store SHALL provide a `deploy(client, deployType)` method that sends the staged flows to Node-RED via `POST /flows` with the appropriate `Node-RED-Deployment-Type` header. The deploy SHALL use the `rev` value from the last fetch for optimistic concurrency.

#### Scenario: Successful deploy
- **WHEN** `deploy(client, deployType)` is called with pending changes
- **THEN** the staging store SHALL send `POST /flows` with the staged flows array, the stored `rev`, and `Node-RED-Deployment-Type` header set to `deployType`

#### Scenario: Deploy uses rev for concurrency
- **WHEN** `deploy()` is called
- **THEN** the request body SHALL include the `rev` value obtained from the last `GET /flows` response

#### Scenario: 409 version_mismatch throws error
- **WHEN** Node-RED returns a 409 response (version mismatch) during deploy
- **THEN** the staging store SHALL throw an error indicating a version conflict and SHALL NOT retry automatically, allowing the LLM to decide the resolution strategy

### Requirement: Post-deploy sync
After a successful deploy, the staging store SHALL re-fetch flows from the Node-RED backend to synchronize the `rev` and state, then clear the dirty tracking sets.

#### Scenario: Re-fetch after deploy
- **WHEN** a deploy completes successfully
- **THEN** the staging store SHALL call `GET /flows` to obtain the latest `rev` and flows, and SHALL clear both dirty nodes and dirty flows sets

#### Scenario: Dirty sets empty after deploy
- **WHEN** a deploy completes and re-fetch succeeds
- **THEN** both `dirtyNodeIds` and `dirtyFlowIds` sets SHALL be empty

### Requirement: Invalidate staging
The staging store SHALL provide an `invalidate()` method that clears the staging cache and forces a re-fetch on the next access.

#### Scenario: Invalidate clears cache
- **WHEN** `invalidate()` is called
- **THEN** `isLoaded` SHALL be set to `false`, the cached flows SHALL be cleared, and the next `getFlows()` call SHALL trigger a fresh `GET /flows`

#### Scenario: Invalidate clears dirty tracking
- **WHEN** `invalidate()` is called
- **THEN** both dirty nodes and dirty flows sets SHALL be cleared

### Requirement: getStagingSummary returns status
The staging store SHALL provide a `getStagingSummary()` method that returns `{ pendingChanges: number, dirtyNodeIds: string[], dirtyFlowIds: string[], deployed: boolean }`. The `deployed` field SHALL be `true` when there are no pending changes (both dirty sets are empty).

#### Scenario: Summary with pending changes
- **WHEN** `getStagingSummary()` is called after mutations have been applied but not deployed
- **THEN** it SHALL return `{ pendingChanges: N, dirtyNodeIds: [...], dirtyFlowIds: [...], deployed: false }` where N equals the size of the dirty nodes set

#### Scenario: Summary after deploy
- **WHEN** `getStagingSummary()` is called after a successful deploy
- **THEN** it SHALL return `{ pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true }`

#### Scenario: Summary when no mutations applied
- **WHEN** `getStagingSummary()` is called after flows are loaded but no mutations have been applied
- **THEN** it SHALL return `{ pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true }`
