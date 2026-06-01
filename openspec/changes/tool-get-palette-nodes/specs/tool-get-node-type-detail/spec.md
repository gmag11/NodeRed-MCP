## ADDED Requirements

### Requirement: get-node-type-detail MCP tool
The system SHALL expose an MCP tool named `get-node-type-detail` that accepts a required `type` string parameter and returns detailed information about that node type. The response SHALL include `type`, `module`, `version`, `category`, `description`, `enabled`, and a `parameters` array of `{ name, type, default }` objects representing the node's configurable properties.

#### Scenario: Known node type lookup
- **WHEN** an MCP client invokes `get-node-type-detail` with `type: "inject"`
- **THEN** the tool searches the `/nodes` response for the set containing `"inject"` and returns its metadata

#### Scenario: Node type not found
- **WHEN** the requested type does not exist in any installed module
- **THEN** the tool returns an error message indicating the type was not found

#### Scenario: Parameters from node configuration schema
- **WHEN** the Node-RED API returns configuration property definitions for the node set
- **THEN** `parameters` contains one entry per property with `name`, `type` (e.g. `"str"`, `"num"`, `"bool"`), and `default` (the default value, if defined)

#### Scenario: No configuration schema available
- **WHEN** the Node-RED API returns no configuration schema for the node set
- **THEN** the tool returns an empty `parameters: []` array without failing

#### Scenario: Module field in response
- **WHEN** a type match is found in a module with multiple node sets
- **THEN** the response includes the `module` name so the caller can distinguish between similarly-named types from different modules
