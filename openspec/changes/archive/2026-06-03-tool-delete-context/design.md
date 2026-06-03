## Context

The Node-RED Admin API exposes context operations under the `/context` prefix. Live testing confirmed the
following endpoints (see also `tool-get-context` design for the full verified endpoint table):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/context/{scope}/{id}` | List all key/value pairs |
| GET | `/context/{scope}/{id}/{var}` | Read one variable |
| DELETE | `/context/{scope}/{id}/{var}` | Delete one variable → 204 No Content |
| POST/PUT | `/context/*` | **Not supported — returns 404** |

Writing context values from the Admin API is **not possible**. Context can only be written from within a flow
via `flow.set()`, `node.set()`, or `global.set()` inside a function node.

## Goals / Non-Goals

**Goals:**
- Delete a single context variable from node, flow, or global scope

**Non-Goals:**
- Writing context values (Admin API does not support it — use a function node inside a flow)
- Bulk-deleting all keys in a scope (not available via Admin API)
- Reading context values (see `get-context`)

## Decisions

### Key as path segment

**Decision**: The variable name is appended as a URL path segment: `DELETE /context/global/myKey`.

**Rationale**: Consistent with how `get-context` addresses individual variables. The Node-RED API uses path
segments for variable names (confirmed — query params return 404).

### Return `{ scope, id?, key, deleted: true }` on success

**Decision**: On a 204 response, return a small confirmation object.

**Rationale**: Gives the caller a clear signal that the key was removed without requiring a follow-up GET.

## Risks / Trade-offs

- Node-RED returns 204 regardless of whether the key existed. There is no way to distinguish
  "key was deleted" from "key did not exist". The `deleted: true` response reflects the HTTP
  success, not necessarily the prior existence of the key.
