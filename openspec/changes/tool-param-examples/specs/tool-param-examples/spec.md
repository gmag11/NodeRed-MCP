## ADDED Requirements

### Requirement: Every Zod parameter description includes examples
Every Zod schema parameter in every MCP tool definition SHALL include at least one concrete example value in its `.describe()` string.

#### Scenario: String parameter has examples
- **WHEN** a tool parameter is defined as `z.string().describe(...)`
- **THEN** the description string SHALL contain at least one example value enclosed in double quotes, using the format `"value1"`, `"value2"`

#### Scenario: Enum parameter has all values listed
- **WHEN** a tool parameter is defined as `z.enum([...]).describe(...)`
- **THEN** the description string SHALL list all valid enum values as examples

#### Scenario: Object parameter has property examples
- **WHEN** a tool parameter is defined as `z.object({...}).passthrough().describe(...)`
- **THEN** the description string SHALL include at least one example of a valid property name and value

### Requirement: Examples use realistic Node-RED values
All example values SHALL use real, valid identifiers and values from the Node-RED ecosystem.

#### Scenario: Node type examples are real palette types
- **WHEN** a parameter describes a node type
- **THEN** the examples SHALL include common palette type names such as `"inject"`, `"function"`, `"debug"`, `"change"`, `"switch"`, `"template"`, `"http in"`, `"mqtt in"`

#### Scenario: Flow ID examples describe format
- **WHEN** a parameter describes a flow or node ID
- **THEN** the description SHALL indicate the format (UUID string) and provide a representative example or reference to how to obtain valid IDs

### Requirement: All tools are covered
Every tool registered in `src/server.js` SHALL have enriched parameter descriptions.

#### Scenario: No tool is skipped
- **WHEN** the full list of registered tools is audited
- **THEN** every tool with parameters SHALL have examples in all its parameter descriptions

### Requirement: Backward compatibility is preserved
The enrichment of descriptions SHALL NOT change tool behavior, input validation, or output format.

#### Scenario: Existing tests still pass
- **WHEN** the test suite is run after description changes
- **THEN** all previously passing tests SHALL continue to pass without modification
