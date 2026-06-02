## Context

Node-RED exposes context via `GET /context/{node|flow|global}/:id?key=<key>`. The store holds arbitrary JS values per scope. The LLM needs this to inspect state after a flow runs (e.g., verify a counter was incremented, check a cached API response).

## Goals / Non-Goals

**Goals:**
- Read a single key or all keys from node, flow, or global context
- Support the default in-memory store and any configured named stores

**Non-Goals:**
- Writing context values (see `set-context`)
- Listing available context stores (out of scope)

## Decisions

### Accept scope + id + optional key

**Decision**: Parameters are `scope` (enum: `node|flow|global`), `id` (required for `node` and `flow` scopes; the node/flow UUID), and `key` (optional string — if omitted, return all keys from the scope).

**Rationale**: Matches the Node-RED API shape exactly. No additional abstraction needed.

### Return raw value, no transformation

**Decision**: Return the context value as-is (JSON-serializable). If `key` is omitted, return an object of all key-value pairs.

**Rationale**: Context values are user-defined; any transformation would lose information.

## Risks / Trade-offs

- [In-memory store] Context from the default in-memory store is lost on Node-RED restart. The tool notes this in its description.
- [Large context objects] A global context with many large values could produce a large response. Mitigated by recommending specific `key` queries when the total context is large.
