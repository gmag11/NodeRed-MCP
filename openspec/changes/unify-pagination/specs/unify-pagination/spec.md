## Purpose
Standardize all paginated MCP tools to use a single offset/limit pagination convention.

## Requirements

### Requirement: get-palette-nodes must use offset/limit
The system SHALL accept `offset` (0-based, default 0) and `limit` (1-200, default 50) as pagination parameters instead of `page`/`pageSize`.

#### Scenario: Default pagination
- **WHEN** `get-palette-nodes` is invoked without pagination parameters
- **THEN** it returns the first 50 items (offset=0, limit=50)

#### Scenario: Custom offset and limit
- **WHEN** `get-palette-nodes` is invoked with `offset: 50, limit: 25`
- **THEN** it returns items 50-74

#### Scenario: page parameter is rejected
- **WHEN** `get-palette-nodes` is invoked with `page: 1`
- **THEN** Zod validation fails with a descriptive error

### Requirement: All paginated tools use the same convention
The system SHALL use `offset`/`limit` across all tools that support pagination: `get-flow-nodes`, `get-flow-diagram`, `get-config-nodes`, and `get-palette-nodes`.
