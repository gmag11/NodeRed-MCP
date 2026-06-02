## Context

Node-RED exposes context writes via `PUT /context/{node|flow|global}/:id`. This is used to seed state before testing or reset it between runs. Without this capability, the LLM can only observe context, not control it.

## Goals / Non-Goals

**Goals:**
- Write a single key-value pair to node, flow, or global context
- Support deletion of a key by setting its value to `undefined` / omitting it

**Non-Goals:**
- Batch-writing multiple keys in one call (call multiple times)
- Reading context values (see `get-context`)

## Decisions

### Accept scope + id + key + value

**Decision**: Parameters are `scope` (enum: `node|flow|global`), `id` (required for `node` and `flow`), `key` (required string), and `value` (required, any JSON-serializable value).

**Rationale**: One key per call keeps the interface simple and consistent with how function nodes set context (`flow.set('key', value)`).

### Use PUT with a single-key object body

**Decision**: Send `PUT /context/{scope}/:id` with body `{ "<key>": <value> }`.

**Rationale**: This is the Node-RED Admin API format. Multiple keys could be set by sending multiple key-value pairs in one PUT body, but we keep it to one for simplicity.

## Risks / Trade-offs

- [In-memory store] Values written are lost on Node-RED restart; documented in tool description.
- [Type coercion] All values are JSON-serialized; non-JSON types (Buffer, Date) will be coerced.
