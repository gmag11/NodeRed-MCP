## MODIFIED Requirements

### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's `/flows` endpoint.

#### Scenario: Data is requested
- **WHEN** the tool is executed
- **THEN** it retrieves the flows array from `staging.getFlows()`
