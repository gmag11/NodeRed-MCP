## MODIFIED Requirements

### Requirement: Stage flow operations locally
The tool SHALL modify the local staging store using a pure `apply*` function on the flows array, rather than calling the individual Node-RED flow API endpoints (`POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`).

#### Scenario: Flow operation is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store flows array
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`
