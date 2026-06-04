## Purpose
MCP tool that uninstalls a Node-RED node module from the running instance via the Admin API's `DELETE /nodes/:module` endpoint. Intended as the counterpart to `install-node`, completing the install/uninstall lifecycle.

## Requirements

### Requirement: uninstall-node MCP tool
The system SHALL expose an MCP tool named `uninstall-node` that accepts a required `module` string parameter (the module identifier as shown in palette listings) and calls `DELETE /nodes/:module` on the Node-RED Admin API. On success (204), the response SHALL be `{ uninstalled: true, module: "<module>" }`.

#### Scenario: Uninstall a node module by identifier
- **WHEN** an MCP client invokes `uninstall-node` with `module: "node-red-node-suncalc"`
- **THEN** the tool calls `DELETE /nodes/node-red-node-suncalc` and returns `{ uninstalled: true, module: "node-red-node-suncalc" }`

#### Scenario: Module not found (404)
- **WHEN** an MCP client invokes `uninstall-node` with a module identifier that is not installed
- **THEN** the tool throws an error with the Node-RED API 404 status and message

#### Scenario: Missing required parameter
- **WHEN** an MCP client invokes `uninstall-node` without a `module` parameter
- **THEN** the MCP framework returns a validation error before the handler is called

### Requirement: Confirmation response
The `uninstall-node` tool SHALL return a confirmation object with `uninstalled: true` and the `module` identifier on successful uninstallation, providing clear feedback to the MCP client.

#### Scenario: Successful uninstallation returns confirmation
- **WHEN** Node-RED returns a 204 No Content response from `DELETE /nodes/:module`
- **THEN** the tool returns `{ uninstalled: true, module: "<module>" }`
