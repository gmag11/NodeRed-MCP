## ADDED Requirements

### Requirement: create-flow MCP tool
The system SHALL expose an MCP tool named `create-flow` that accepts `label` (required string), `disabled` (optional boolean, default false), `info` (optional string), and `env` (optional array of `{ name, value, type }` objects). It SHALL call `POST /flow` on the Node-RED Admin API and return the new flow's `id` and `currentState`.

#### Scenario: Create a minimal flow
- **WHEN** `create-flow` is invoked with only `label: "My New Flow"`
- **THEN** a new flow tab with that label is created and the tool returns its `id` and full state

#### Scenario: Create a disabled flow
- **WHEN** `create-flow` is invoked with `label: "Staging"` and `disabled: true`
- **THEN** the new flow tab is created in disabled state and does not run until enabled

#### Scenario: Create a flow with environment variables
- **WHEN** `create-flow` is invoked with `env: [{ name: "API_URL", value: "https://example.com", type: "str" }]`
- **THEN** the new flow tab has the specified environment variable configured

#### Scenario: Create a flow with info description
- **WHEN** `create-flow` is invoked with `info: "Handles incoming webhooks"`
- **THEN** the new flow tab has that description in its info field

### Requirement: create-flow returns new flow state
The tool SHALL include `flowId` (the ID assigned by Node-RED) and `currentState` (the full flow object as returned by the API) in its response.

#### Scenario: Response includes assigned ID
- **WHEN** a flow is successfully created
- **THEN** the response contains `flowId` and `currentState` as a JSON object
