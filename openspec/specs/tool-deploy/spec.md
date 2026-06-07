# tool-deploy Specification

## Purpose
MCP tool that deploys staged flow changes to the Node-RED runtime.

## Requirements

### Requirement: deploy MCP tool
The system SHALL expose an MCP tool named `deploy` that accepts an optional `deployType` parameter (`"full"`, `"flows"`, or `"nodes"`, default `"nodes"`). It SHALL call `staging.deploy(client, deployType)` to send staged flows to Node-RED. The tool description SHALL explain the three deploy types: `"full"` restarts all flows, `"flows"` restarts only changed flows, `"nodes"` restarts only changed nodes (least disruption, recommended).

#### Scenario: Deploy with default type
- **WHEN** `deploy` is invoked without `deployType`
- **THEN** the tool SHALL call `staging.deploy(client, "nodes")` and return a success summary

#### Scenario: Deploy with explicit full type
- **WHEN** `deploy` is invoked with `deployType: "full"`
- **THEN** the tool SHALL call `staging.deploy(client, "full")`

#### Scenario: Deploy with flows type
- **WHEN** `deploy` is invoked with `deployType: "flows"`
- **THEN** the tool SHALL call `staging.deploy(client, "flows")`

### Requirement: deploy returns summary
The tool SHALL return a summary object `{ deployType, deployedNodes: number, deployedFlows: number, rev: string }` after a successful deploy.

#### Scenario: Response includes counts and rev
- **WHEN** a deploy completes successfully with 3 dirty nodes and 1 dirty flow
- **THEN** the response SHALL contain `{ deployType: "nodes", deployedNodes: 3, deployedFlows: 1, rev: "<new_rev>" }`

### Requirement: deploy skips when clean
If staging has no pending changes, the tool SHALL return success immediately without calling the Node-RED API.

#### Scenario: No pending changes
- **WHEN** `deploy` is invoked and staging has no dirty nodes or flows
- **THEN** the tool SHALL return `{ deployType, deployedNodes: 0, deployedFlows: 0, rev: "<current_rev>" }` without making any HTTP call

### Requirement: deploy handles version conflict
If `staging.deploy()` throws a 409 version_mismatch error, the tool SHALL return an error instructing the LLM to call `invalidate` or re-fetch to resolve the conflict.

#### Scenario: 409 version mismatch
- **WHEN** `staging.deploy()` throws a version conflict error
- **THEN** the tool SHALL return an error message explaining that the flows were modified externally and suggesting to call `get-staging-status` and then re-stage changes after invalidation
