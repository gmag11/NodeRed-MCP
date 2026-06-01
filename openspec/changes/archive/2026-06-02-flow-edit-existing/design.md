## Context

The MCP server exposes read-only tools for inspecting Node-RED flows. To enable AI agents to automate flow development, three write tools are needed: modifying node properties, adding wires, and removing wires.

All write operations work through the same mechanism: fetch the current flows state from `GET /flows`, apply the mutation in memory, and `PUT /flows` back with `Node-RED-Deployment-Type: flows`. This is how Node-RED's own UI works — there is no partial-update API.

The existing `src/nodered/client.js` already supports arbitrary HTTP methods via `client.request(method, path, body)`, so `PUT /flows` requires no client changes beyond adding the deployment type header.

## Goals / Non-Goals

**Goals:**
- `update-node`: Merge a partial `properties` object onto an existing node's configuration
- `connect-nodes`: Add a wire from a node output port to a target node
- `disconnect-nodes`: Remove a wire from a node output port to a target node
- Return `previousState` / `currentState` on all write tools so agents can reason about and reverse changes
- Deploy immediately with `Modified Flows` strategy after every write

**Non-Goals:**
- Creating or deleting nodes (separate change)
- Staging multiple edits before deploying (each tool deploys immediately)
- Supporting deployment types other than `flows` for these tools
- Undo stack on the server (stateless design — agent holds `previousState` in its context)

## Decisions

### D1: Shallow merge for `update-node` properties

**Decision**: `update-node` performs a shallow merge of the `properties` input onto the existing node object. Top-level fields in `properties` overwrite the corresponding fields in the stored node; fields not mentioned in `properties` are preserved.

**Rationale**: Shallow merge is the simplest semantics that covers all practical use cases (change a name, update a `func` body, toggle `active`). Deep merge adds complexity and surprises when replacing arrays (e.g., `rules`). The agent can always fetch the full node via `get-node-detail` before constructing the `properties` object if it needs precision.

**Alternative considered**: Full replacement — agent must send the entire node object. Rejected because it requires the agent to always do a read-before-write and risks losing fields it didn't know about.

### D2: Explicitly block `wires` in `update-node`

**Decision**: If `properties` contains a `wires` key, `update-node` SHALL return an error rather than silently ignoring or applying it.

**Rationale**: Silent ignore would confuse agents that expect the wire change to take effect. An explicit error makes the boundary clear: wiring is managed by `connect-nodes`/`disconnect-nodes`. The tool description should also state this constraint.

**Alternative considered**: Silently strip `wires` from properties. Rejected — the agent would think it worked.

### D3: `connect-nodes` is idempotent; `disconnect-nodes` errors on missing wire

**Decision**: `connect-nodes` is a no-op (returns success) if the wire already exists. `disconnect-nodes` returns an error if the wire does not exist.

**Rationale**: For `connect-nodes`, idempotency is safe and prevents unnecessary deploys when the agent is uncertain whether a wire exists. For `disconnect-nodes`, an error on a missing wire is more useful — if the agent expects to remove a wire and it's not there, something unexpected happened and the agent should know.

### D4: `previousState` / `currentState` in all write responses

**Decision**: Every write tool response includes:
- `update-node`: `{ nodeId, previousState: <full node before>, currentState: <full node after> }`
- `connect-nodes`: `{ fromNodeId, outputPort, toNodeId, previousWires: [...], currentWires: [...] }`
- `disconnect-nodes`: `{ fromNodeId, outputPort, toNodeId, previousWires: [...], currentWires: [...] }`

**Rationale**: Stateless undo — the server holds no history, but the agent has everything it needs in its context window to reverse a change by calling `update-node` with `previousState` fields or re-wiring with the opposite tool. This avoids server state entirely while giving agents meaningful reversibility.

### D5: `PUT /flows` requires passing the deployment type header

**Decision**: The `client.request()` method does not currently support custom headers. Rather than changing the client interface, write tools will call `client.request('PUT', '/flows', body)` and we add a separate `deployType` option to the request interface, or use a wrapper `putFlows(body, deployType)` added to the client.

**Rationale**: Keeps the client generic while giving write tools control over deployment type. The `putFlows` wrapper is preferable to polluting `request()` with a headers parameter.

**Note**: The `doFetch` helper already sets `Content-Type: application/json` when a body is provided. The `Node-RED-Deployment-Type` header is the only additional header needed for writes.

### D6: Reject edits on locked flows

**Decision**: Before applying any mutation, all write tools SHALL check whether the target node's parent flow is locked. The parent flow is the tab or subflow whose `id` matches the node's `z` property. If that flow has `locked: true`, the tool SHALL return an error without attempting the `PUT /flows` call.

**Rationale**: Node-RED's UI prevents editing nodes in locked flows. Attempting a `PUT /flows` on a locked flow succeeds at the API level but Node-RED ignores the changes, producing silent failures. Failing fast with a clear error is far safer and more informative for the agent.

**Error message**: `Flow '<flowId>' is locked`

**Alternative considered**: Let the API call proceed and let Node-RED silently reject it. Rejected — the agent would receive a success response but no change would occur, causing confusion.

## Risks / Trade-offs

- **[Concurrent edits]** If the Node-RED UI or another agent modifies flows between our `GET` and `PUT`, the `PUT` will overwrite those changes. Node-RED v2's `/flows` endpoint uses a revision token (`rev`) in the response — the `PUT` body must include the same `rev` to prevent conflicts. We must round-trip the `rev` field. If Node-RED returns a 409 conflict, the tool should return an error.
- **[No partial flow update]** Every write touches the entire flows payload. For large instances this is a large body. Acceptable for now.
- **[Deploy on every tool call]** An agent making multiple changes (e.g., update 3 nodes) triggers 3 sequential deploys. This is correct behaviour but slightly inefficient. Future optimization: a `deferDeploy` flag. Out of scope for this change.
