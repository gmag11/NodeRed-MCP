# tool-inject-message Specification

## Purpose
TBD - created by archiving change tool-inject-message. Update Purpose after archive.

## Requirements

### Requirement: inject-message MCP tool
The system SHALL expose an MCP tool named `inject-message` that accepts `nodeId` (optional string) OR `name` (optional string) with `flowId` (optional string). At least one of `nodeId` or `name` must be provided. It SHALL call `POST /inject/:nodeId` and return the result.

#### Scenario: Inject by nodeId
- **WHEN** `inject-message` is invoked with a valid `nodeId` of an inject node
- **THEN** the inject node fires and the tool returns `{ success: true, nodeId, message: "Injected" }`

#### Scenario: Inject by name within a flow
- **WHEN** `inject-message` is invoked with `name: "Start trigger"` and `flowId`
- **THEN** the tool resolves the inject node with that name in the flow, fires it, and returns success

#### Scenario: Inject by name across all flows
- **WHEN** `inject-message` is invoked with `name: "Start trigger"` and no `flowId`
- **THEN** the tool searches all flows for an inject node with that name; if exactly one is found, it is fired

#### Scenario: Name matches multiple inject nodes
- **WHEN** multiple inject nodes share the same `name`
- **THEN** the tool returns an error listing the matching node IDs and asking to specify `nodeId`

#### Scenario: Node not found
- **WHEN** neither `nodeId` nor a matching node by name is found
- **THEN** the tool returns an error: `Inject node not found`

#### Scenario: No identifier provided
- **WHEN** neither `nodeId` nor `name` is provided
- **THEN** the tool returns an error: `Provide either nodeId or name`

### Requirement: Pre-deploy guard
The tool SHALL check the staging status before attempting to inject a message.
