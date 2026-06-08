## Purpose
Extract tool definitions from the monolithic server.js into individual modules and centralize response/error formatting.

## Requirements

### Requirement: Each tool module exports a definition object
Each tool module in `src/tools/` SHALL export a `definition` object containing `name`, `description`, `inputSchema`, and `handler`.

#### Scenario: get-flows definition
- **WHEN** `src/tools/get-flows.js` is imported
- **THEN** it exports `getFlowsDefinition` with name `"get-flows"`, a description string, an empty inputSchema, and the `handleGetFlows` handler

#### Scenario: create-node definition
- **WHEN** `src/tools/create-node.js` is imported
- **THEN** it exports `createNodeDefinition` with Zod input schema for `type`, `flowId`, `properties`, `x`, `y`

### Requirement: server.js registers tools from definitions array
The system SHALL register all tools by iterating over an array of definition objects rather than inline `server.tool()` calls.

#### Scenario: All tools registered
- **WHEN** the MCP server starts
- **THEN** all 38+ tools from the definitions array are registered and available to clients

### Requirement: Response formatting is centralized
The system SHALL provide `formatSuccess(data)` and `formatError(message)` helpers in `src/tools/response-utils.js`.

#### Scenario: formatSuccess produces valid response
- **WHEN** a handler calls `formatSuccess({ nodeId: "abc", staging: {...} })`
- **THEN** it returns `{ content: [{ type: 'text', text: '<JSON string>' }] }`

#### Scenario: formatError produces error response
- **WHEN** a handler calls `formatError('Flow not found')`
- **THEN** it returns `{ content: [...], isError: true }` with the error message in the JSON payload

### Requirement: Staging warning is DRY
The system SHALL store the repeated staging warning message as a shared constant.

#### Scenario: Staging warning constant
- **WHEN** any tool description includes the staging warning
- **THEN** it references the `STAGING_WARNING` constant rather than duplicating the string literal
