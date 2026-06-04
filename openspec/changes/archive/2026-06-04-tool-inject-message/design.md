## Context

Node-RED exposes `POST /inject/:nodeId` which triggers an inject node as if the user pressed its button in the UI. This is the standard way to fire a flow programmatically for testing.

The MCP server currently has no way to trigger flow execution. After deploying changes, the LLM must ask the user to manually trigger the flow, breaking the autonomous test loop.

## Goals / Non-Goals

**Goals:**
- Add `inject-message` tool that calls `POST /inject/:nodeId`
- Support lookup by node name within a flow (so the LLM doesn't always need the UUID)
- Return success/failure from Node-RED

**Non-Goals:**
- Injecting into non-inject nodes (only inject nodes support this endpoint)
- Injecting custom payloads (the inject node's configured payload is used; modifying it is done via `update-node`)
- Polling for the result (use `read-debug-messages` to observe output)

## Decisions

### Accept nodeId directly or resolve by name+flowId

**Decision**: Accept `nodeId` (optional) OR `name` + `flowId` (optional). If `nodeId` is not provided, search all flows (or the specified flow) for an inject node with the given `name`.

**Rationale**: The LLM often knows node names from `get-flow-nodes` output but not their UUIDs. Name-based lookup reduces the number of steps needed.

**Constraint**: If multiple inject nodes share the same name in a flow, return an error asking for disambiguation via `nodeId`.

### Return Node-RED's response verbatim

**Decision**: Return the HTTP status and body from `POST /inject/:nodeId` as-is.

**Rationale**: Node-RED returns a simple `"Injected"` on success or an error body on failure. No transformation needed.

## Risks / Trade-offs

- [Wrong node type] If the resolved node is not an inject node, Node-RED returns a 404. The tool will surface this error clearly.
- [Name collision] Multiple inject nodes with the same name require `nodeId` disambiguation. This is the expected behavior given the data model.
