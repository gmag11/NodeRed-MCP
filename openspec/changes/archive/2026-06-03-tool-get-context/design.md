## Context

Node-RED exposes context via its Admin API under the `/context` prefix. The store holds arbitrary JS values per scope. The LLM needs this to inspect state after a flow runs (e.g., verify a counter was incremented, check a cached API response).

### Verified Admin API endpoints

**List all keys in a scope:**
- `GET /context/node/<node_id>` → object of all key/value pairs, e.g. `{"test":{"msg":"1","format":"number"}}`
- `GET /context/flow/<flow_id>` → same format
- `GET /context/global` → same format

**Read a single variable (path-based, not query-string):**
- `GET /context/node/<node_id>/<var_name>` → raw value, e.g. `{"msg":"1","format":"number"}`
- `GET /context/flow/<flow_id>/<var_name>` → raw value
- `GET /context/global/<var_name>` → raw value

**Delete a variable:**
- `DELETE /context/node/<node_id>/<var_name>` → 204 No Content
- `DELETE /context/flow/<flow_id>/<var_name>` → 204 No Content
- `DELETE /context/global/<var_name>` → 204 No Content

**Set/write a variable:**
- There is **no POST endpoint** for setting context via the Admin API (confirmed by request logging — any POST to `/context/*` returns 404). Writing context is only possible from within a flow via `flow.set()` / `global.set()`.

> Note: The key is appended as a **path segment**, not a `?key=` query parameter. Early implementation incorrectly used `?key=`; this has been corrected.

## Goals / Non-Goals

**Goals:**
- Read a single key or all keys from node, flow, or global context
- Support the default in-memory store and any configured named stores

**Non-Goals:**
- Writing context values (Admin API does not support it — use a function node)
- Deleting context values (see `delete-context`)
- Listing available context stores (out of scope)

## Decisions

### Accept scope + id + optional key

**Decision**: Parameters are `scope` (enum: `node|flow|global`), `id` (required for `node` and `flow` scopes; the node/flow UUID), and `key` (optional string — if omitted, return all keys from the scope).

**Rationale**: Matches the Node-RED API shape exactly. No additional abstraction needed.

### Key as path segment, not query string

**Decision**: When a `key` is provided, append it as a URL path segment (`/context/global/myKey`) rather than a query parameter (`/context/global?key=myKey`).

**Rationale**: The actual Node-RED Admin API routes keys as path segments. Using `?key=` returns a 404.

### Simplified response format — no scope/id wrapper

**Decision**:
- Single-key query returns `{ "<key>": <raw value> }`.
- All-keys query returns `{ "<key>": <raw value>, ... }` — the raw context object as-is.

The `scope` and `id` fields are **not** included in the response.

**Rationale**: The caller already knows the scope/id they queried. Including them adds noise without benefit.
The value's JS type (number, string, object, array) is self-describing from JSON alone — no explicit `format`
field is needed. Using the key directly as the JSON property name is the most natural representation.

**Examples**:
```json
// Single key: GET /context/global/counter
{ "counter": 42 }

// All keys: GET /context/global
{
  "counter": 42,
  "config": { "retries": 3 },
  "tags": ["a", "b"]
}
```

## Risks / Trade-offs

- [In-memory store] Context from the default in-memory store is lost on Node-RED restart. The tool notes this in its description.
- [Large context objects] A global context with many large values could produce a large response. Mitigated by recommending specific `key` queries when the total context is large.
- [Non-existent key] Node-RED returns `null` for a key that does not exist. The tool returns `{ "<key>": null }` — not an error.

