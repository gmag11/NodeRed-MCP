## Context

The Node-RED Admin API exposes two distinct groups of endpoints for flow management:

1. **Bulk endpoints** (`GET /flows`, `PUT /flows`) — used by all existing node-editing tools. They operate on the entire flows payload as a flat array.
2. **Individual flow endpoints** (`POST /flow`, `GET /flow/:id`, `PUT /flow/:id`, `DELETE /flow/:id`) — operate on a single flow tab (or subflow) and its contained nodes as a unit.

The individual flow endpoints are the right choice for this change. They are purpose-built for tab-level CRUD and avoid the need to round-trip the entire flows payload just to rename or disable a tab.

A flow tab object looks like:
```json
{
  "id": "abc123",
  "label": "My Flow",
  "disabled": false,
  "info": "Optional description",
  "env": [{ "name": "MY_VAR", "value": "hello", "type": "str" }]
}
```

`GET /flows` (used by `get-flows`) already returns tab objects with at least `id`, `label`, `disabled`, so agents can discover flow IDs before calling these new tools.

## Goals / Non-Goals

**Goals:**
- `create-flow`: Create a new flow tab via `POST /flow`
- `delete-flow`: Delete a flow tab and all its nodes via `DELETE /flow/:id`
- `update-flow`: Modify tab properties (label, disabled, info, env) via `GET /flow/:id` + `PUT /flow/:id`
- Return `previousState`/`currentState` consistently with the pattern established in `flow-edit-existing`

**Non-Goals:**
- Creating or managing subflows (distinct type, separate concern)
- Moving nodes between flows (that requires node-level editing, out of scope here)
- Bulk operations on multiple flows at once
- Validating `env` entries beyond structural shape

## Decisions

### D1: Use individual flow endpoints, not bulk `PUT /flows`

**Decision**: Use `POST /flow`, `GET /flow/:id`, `PUT /flow/:id`, `DELETE /flow/:id` rather than the bulk `PUT /flows`.

**Rationale**: The individual endpoints are atomic and scoped to one tab. Using `PUT /flows` to, say, rename a tab would require fetching all flows, mutating a single object, and putting everything back — unnecessary risk and payload size. The individual endpoints also have cleaner semantics for creation (they return the new flow's `id` directly).

**Alternative considered**: Bulk `PUT /flows` for consistency with node-editing tools. Rejected — the revision token (`rev`) conflict risk is amplified when the payload includes every node in every flow. The individual endpoints avoid this entirely.

### D2: `update-flow` does a GET-then-PUT with shallow merge

**Decision**: `update-flow` fetches the current flow tab via `GET /flow/:id`, shallow-merges the provided properties, then `PUT /flow/:id` with the merged object.

**Rationale**: The `PUT /flow/:id` payload must include the full flow object (id, label, nodes array, etc.), not just the changed fields. We do a GET first to avoid constructing it blindly, and shallow-merge the requested changes on top.

**Note**: `PUT /flow/:id` replaces the entire flow including its nodes. We must round-trip the `nodes` array untouched — the tool only modifies the tab-level metadata fields.

### D3: `delete-flow` returns the full flow's previous state

**Decision**: Before deleting, the tool fetches the flow via `GET /flow/:id` and includes the full response (tab metadata + nodes array) as `previousState`.

**Rationale**: Deletion is irreversible. Returning the full previous state (including nodes) gives agents maximum information for logging or reasoning about what was lost.

### D4: `create-flow` accepts `env` as a structured array

**Decision**: The `env` parameter accepts an array of `{ name, value, type }` objects, matching Node-RED's internal format exactly.

**Rationale**: No transformation is needed, the shape is clear, and agents that use `get-flows` or inspect existing tabs already see this format.

### D5: Reject `update-flow` and `delete-flow` on locked flows

**Decision**: `update-flow` and `delete-flow` SHALL check whether the flow has `locked: true` (obtained from the `GET /flow/:id` response) before proceeding. If locked, the tool returns an error without making any write call.

**Rationale**: A locked flow cannot be modified through the UI. The MCP must honour the same constraint. The check is trivially available from the GET response that both tools already perform before writing.

**`create-flow` is exempt**: A new flow is always created unlocked; there is nothing to check.

**Error message**: `Flow '<flowId>' is locked`

## Risks / Trade-offs

- **[`PUT /flow/:id` replaces nodes]** The `PUT /flow/:id` body must include the `nodes` array of the flow. If we omit it, Node-RED clears all nodes in the flow. Mitigation: always round-trip the `nodes` array from the GET response untouched.
- **[No deployment type header]** The individual flow endpoints do not support `Node-RED-Deployment-Type`. They always perform an equivalent of `Modified Flows`. This is the correct behaviour for tab-level operations.
- **[Subflow IDs]** `GET /flows` returns subflows alongside tabs. `delete-flow` called on a subflow ID would delete the subflow. The tool description should note that it operates on tabs; agents should verify the target is a tab using `get-flows` first.
