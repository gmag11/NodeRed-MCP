# tool-get-staging-status Specification

## Purpose
MCP tool that reports the current staging state, including pending changes and dirty tracking information.

## ADDED Requirements

### Requirement: get-staging-status MCP tool
The system SHALL expose an MCP tool named `get-staging-status` with no required parameters. It SHALL return `{ isLoaded, deployed, pendingChanges, dirtyNodeIds, dirtyFlowIds }`. The tool description SHALL explain that this is useful to review pending changes before deploying.

#### Scenario: Staging loaded with pending changes
- **WHEN** `get-staging-status` is invoked after mutations have been applied
- **THEN** the tool SHALL return `{ isLoaded: true, deployed: false, pendingChanges: N, dirtyNodeIds: [...], dirtyFlowIds: [...] }`

#### Scenario: Staging loaded with no pending changes
- **WHEN** `get-staging-status` is invoked after a successful deploy
- **THEN** the tool SHALL return `{ isLoaded: true, deployed: true, pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [] }`

#### Scenario: Staging not loaded
- **WHEN** `get-staging-status` is invoked before any tool has accessed staging
- **THEN** the tool SHALL return `{ isLoaded: false, deployed: true, pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [] }` without triggering a lazy-load
