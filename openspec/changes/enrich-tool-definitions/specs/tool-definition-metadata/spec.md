## ADDED Requirements

### Requirement: Tool definition includes MCP metadata
Each tool module's exported definition object SHALL include `annotations` and `outputSchema` fields alongside the existing `name` and `handler` fields, providing all metadata required for MCP tool registration.

#### Scenario: Read-only tool definition
- **WHEN** a read-only tool module (e.g., `get-flows`) exports its definition
- **THEN** the definition includes `annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }`
- **AND** the definition includes `outputSchema` referencing the appropriate Zod schema from `src/schemas/responses.js`

#### Scenario: Mutation tool definition
- **WHEN** a mutation tool module (e.g., `create-node`) exports its definition
- **THEN** the definition includes `annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }`
- **AND** the definition includes `outputSchema` referencing the appropriate Zod schema

#### Scenario: Destructive tool definition
- **WHEN** a destructive tool module (e.g., `delete-flow`) exports its definition
- **THEN** the definition includes `annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }`

### Requirement: Annotation constants are shared
The annotation constant groups (ANN_READONLY, ANN_MUTATION, etc.) SHALL be defined in `src/tools/constants.js` and SHALL be importable by both tool modules and `server.js`.

#### Scenario: Tool module imports annotation constant
- **WHEN** a tool module needs to specify its annotations
- **THEN** it imports the relevant constant from `./constants.js`

#### Scenario: Server imports annotation constants
- **WHEN** `server.js` needs annotation constants for inline registrations (skills tools)
- **THEN** it imports them from `./tools/constants.js`

### Requirement: Registry loop registers all tools
`server.js` SHALL register all tools by iterating over an array of imported definition objects, calling `server.tool()` once per definition with all metadata from the definition object.

#### Scenario: All tools registered via loop
- **WHEN** the MCP server starts
- **THEN** all tool definitions (excluding skills) are registered through a single `for` loop
- **AND** each tool receives its name, description, inputSchema, annotations, and outputSchema from its definition object

#### Scenario: Tool handler receives staging and client
- **WHEN** a tool is invoked through the registry loop
- **THEN** the handler receives `staging` as the first argument and `nodeRedClient` as the second argument (if the handler signature expects it)

### Requirement: Zero behavioral change
The enriched definitions and registry loop SHALL NOT alter any tool's name, description, input schema, output schema, annotations, or runtime behavior.

#### Scenario: Identical tool metadata
- **WHEN** comparing a tool registered via the new registry loop to the same tool registered via the old individual `server.tool()` call
- **THEN** the tool's name, description, input schema, annotations, and output schema are identical

#### Scenario: All existing tests pass
- **WHEN** the full test suite is executed after the refactoring
- **THEN** all tests pass with no modifications required
