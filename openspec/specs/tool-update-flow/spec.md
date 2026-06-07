## Requirements

### Requirement: update-flow MCP tool
The system SHALL expose an MCP tool named `update-flow` that accepts `flowId` (required string) and an `updates` object containing any subset of `label` (string), `disabled` (boolean), `info` (string), and `env` (array of `{ name, value, type }`). It SHALL fetch the current flow via `GET /flow/:id`, shallow-merge `updates` onto the tab metadata, and `PUT /flow/:id` with the full merged flow object (preserving the `nodes` array untouched).

#### Scenario: Rename a flow
- **WHEN** `update-flow` is invoked with `flowId: "abc"` and `updates: { label: "New Name" }`
- **THEN** the flow tab's label is changed to `"New Name"` and all other fields are preserved

#### Scenario: Disable a flow
- **WHEN** `update-flow` is invoked with `updates: { disabled: true }`
- **THEN** the flow tab is disabled and its nodes stop running; the label and other fields are unchanged

#### Scenario: Enable a previously disabled flow
- **WHEN** `update-flow` is invoked with `updates: { disabled: false }` on a disabled flow
- **THEN** the flow becomes active and its nodes resume running

#### Scenario: Update info description
- **WHEN** `update-flow` is invoked with `updates: { info: "Handles MQTT ingestion" }`
- **THEN** the flow tab's info field is updated and shown in the Node-RED Info panel

#### Scenario: Update environment variables
- **WHEN** `update-flow` is invoked with `updates: { env: [{ name: "BROKER_URL", value: "mqtt://host", type: "str" }] }`
- **THEN** the flow tab's env array is replaced with the provided value

#### Scenario: Flow not found
- **WHEN** `flowId` does not match any flow in Node-RED
- **THEN** the tool returns an error: `Flow '<flowId>' not found`

#### Scenario: Flow is locked
- **WHEN** the flow exists but has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

#### Scenario: Empty updates object
- **WHEN** `updates` is an empty object `{}`
- **THEN** the tool returns an error: `No properties to update`

#### Scenario: Nodes array is preserved
- **WHEN** any `updates` are applied
- **THEN** the nodes array inside the flow is identical to what was returned by `GET /flow/:id` — no nodes are added, removed, or modified

### Requirement: update-flow returns previous and current state
The tool SHALL return `flowId`, `previousState` (the full flow object before the update, including nodes), and `currentState` (the full flow object after the update) in its response.

#### Scenario: Response shape
- **WHEN** a flow is successfully updated
- **THEN** the response contains `flowId`, `previousState`, and `currentState` as a JSON object

### Requirement: Stage flow operations locally
The tool SHALL modify the local staging store using a pure `apply*` function on the flows array, rather than calling the individual Node-RED flow API endpoints (`POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`).

#### Scenario: Flow operation is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store flows array
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
