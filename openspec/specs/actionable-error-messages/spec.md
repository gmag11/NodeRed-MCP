# actionable-error-messages Specification

## Purpose
TBD - created by archiving change actionable-error-messages. Update Purpose after archive.

## Requirements

### Requirement: «Not found» errors suggest search tools
Every error message indicating a resource was not found SHALL include a suggestion to use the appropriate MCP search or list tool to discover valid identifiers.

#### Scenario: Node not found suggests search-nodes
- **WHEN** a tool throws an error because a node ID is not found
- **THEN** the error message SHALL include a suggestion to use `search-nodes` or `get-flow-nodes` to list available nodes

#### Scenario: Flow not found suggests get-flows
- **WHEN** a tool throws an error because a flow ID is not found
- **THEN** the error message SHALL include a suggestion to use `get-flows` to list available flow tabs

#### Scenario: Subflow not found suggests get-subflows
- **WHEN** a tool throws an error because a subflow ID is not found
- **THEN** the error message SHALL include a suggestion to use `get-subflows` to list available subflow definitions

### Requirement: Validation errors explain expected format
Every error message indicating invalid parameter values SHALL explain the expected format or valid options.

#### Scenario: Invalid deploy type lists valid options
- **WHEN** an invalid `deployType` value is provided to the deploy tool
- **THEN** the error message SHALL list all valid deploy types: `"full"`, `"flows"`, `"nodes"`

#### Scenario: Mutually exclusive params explain choice
- **WHEN** mutually exclusive parameters are provided together (e.g., `last` and `limit` in `read-debug-messages`)
- **THEN** the error message SHALL explain when to use each parameter

### Requirement: State errors explain resolution steps
Every error message indicating invalid tool state (staging dirty, flow locked, version mismatch) SHALL explain the exact sequence of tool calls to resolve the state.

#### Scenario: Staging dirty suggests deploy
- **WHEN** `inject-message` is called with pending staging changes
- **THEN** the error message SHALL suggest calling `deploy` first, then retrying `inject-message`

#### Scenario: Version mismatch suggests refresh + redo
- **WHEN** `deploy` fails with a version mismatch (HTTP 409)
- **THEN** the error message SHALL suggest calling `refresh-staging` to sync, re-applying the changes, and deploying again

#### Scenario: Flow locked explains read-only
- **WHEN** a tool attempts to modify a locked flow
- **THEN** the error message SHALL explain that the flow is locked (read-only) and suggest using `get-flow-nodes` for inspection only

### Requirement: All error sites are covered
Every `throw new Error(...)` statement in the tool handlers and staging store SHALL include an actionable suggestion.

#### Scenario: No bare error messages remain
- **WHEN** a grep for `throw new Error` is run across `src/tools/` and `src/staging-store.js`
- **THEN** every error message SHALL contain a second sentence with a tool name suggestion or actionable next step

### Requirement: Backward compatibility
Error enrichment SHALL NOT change HTTP status codes, tool response structure, or functional behavior.

#### Scenario: Existing tests still pass
- **WHEN** the test suite is run after error message changes
- **THEN** all previously passing tests SHALL continue to pass (tests that assert on exact error message strings may need updating)
