## Purpose
MCP tool that installs a new Node-RED node module from the npm registry into the running Node-RED instance via the Admin API's `POST /nodes` endpoint. Intended to be used after the LLM discovers a suitable package from the Node-RED library catalog (https://flows.nodered.org/search?type=node) and the user selects it.

## Requirements

### Requirement: install-node MCP tool
The system SHALL expose an MCP tool named `install-node` that accepts a required `module` string parameter (the plain npm package name, without `@version` qualifiers — the Node-RED API does not support them via JSON) and calls `POST /nodes` on the Node-RED Admin API with `Content-Type: application/json`. On success (200), the response SHALL be the Node Module JSON object with `name`, `version`, and a `nodes` array of installed node types.

#### Scenario: Install a node module from npm by package name
- **WHEN** an MCP client invokes `install-node` with `module: "node-red-node-suncalc"` (a plain npm package name, no version qualifier)
- **THEN** the tool calls `POST /nodes` with body `{ "module": "node-red-node-suncalc" }` and `Content-Type: application/json`, and returns the Node Module object: `{ name: "node-red-node-suncalc", version: "0.0.6", nodes: [{ id: "node-red-node-suncalc/suncalc", name: "suncalc", types: ["sunrise"], enabled: true, loaded: true, module: "node-red-node-suncalc" }] }`

#### Scenario: Module not found on npm (404)
- **WHEN** an MCP client invokes `install-node` with a non-existent module name
- **THEN** the tool throws an error with the Node-RED API 404 status and message

#### Scenario: Bad request (400)
- **WHEN** an MCP client invokes `install-node` with an invalid specifier (e.g., includes `@version` which the API rejects)
- **THEN** the tool throws an error with the Node-RED API 400 status and message

#### Scenario: Missing required parameter
- **WHEN** an MCP client invokes `install-node` without a `module` parameter
- **THEN** the MCP framework returns a validation error before the handler is called

### Requirement: Response is the Node Module object
The `install-node` tool SHALL return the Node Module JSON object exactly as provided by the Node-RED Admin API. The object SHALL contain at minimum `name` (string), `version` (string), and `nodes` (array of node type objects, each with `id`, `name`, `types`, `enabled`, `loaded`, `module`).

#### Scenario: Successful installation returns node module info
- **WHEN** Node-RED returns a 200 response from `POST /nodes`
- **THEN** the tool returns the full JSON object with `name`, `version`, and the `nodes` array of installed types
