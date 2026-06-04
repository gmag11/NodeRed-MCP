## Context

Node-RED's `/comms` endpoint is a Socket.IO-compatible WebSocket that broadcasts runtime events including debug node output. Messages have the shape:
```json
{ "topic": "debug", "data": { "id": "<nodeId>", "name": "<nodeName>", "msg": <any>, "format": "string|object|...", "path": "...", "timestamp": <ms> } }
```

The MCP server is currently HTTP-only. Reading debug output requires a persistent WebSocket connection that lives for the duration of the server process.

## Goals / Non-Goals

**Goals:**
- Persistent WebSocket connection to `ws://<host>/comms` maintained by the MCP server
- In-memory ring buffer of the last N debug messages, size configurable via `NODE_RED_DEBUG_BUFFER_SIZE` env var (default 500)
- `read-debug-messages` tool with filters: `nodeId`, `nodeName`, `keyword` (substring in stringified msg), `after` (timestamp lower bound, inclusive), `before` (timestamp upper bound, inclusive), `last` (return the last N messages matching all filters instead of the first N), `limit` (max results when using first-N mode, default 50)
- Auto-reconnect on disconnect with exponential backoff

**Non-Goals:**
- Persisting messages to disk
- Real-time streaming to the LLM (MCP is request-response; the LLM polls by calling the tool)
- Subscribing to non-debug topics (errors, status — deferred)

## Decisions

### Use `ws` (not Socket.IO client)

**Decision**: Use the `ws` npm package to connect directly to Node-RED's WebSocket endpoint, sending the required Socket.IO handshake frames manually.

**Rationale**: Node-RED's `/comms` uses Socket.IO v2 protocol but only needs a minimal handshake (send `40` after connection, receive events prefixed with `42`). Adding `socket.io-client` would be a heavier dependency. `ws` is already a transitive dependency of many packages and the handshake is ~10 lines.

**Alternative**: `socket.io-client` — rejected as unnecessarily heavy.

### Ring buffer size configurable via env var

**Decision**: Keep the last N debug messages in a fixed-size array (FIFO eviction). Size is read from `NODE_RED_DEBUG_BUFFER_SIZE` environment variable at startup (default 500, minimum 10, maximum 10000).

**Rationale**: Different deployments have different needs — a development instance may want 50 messages, a long-running test suite may need 2000. Making it configurable avoids rebuilding.

### Time range filtering: `after` + `before`

**Decision**: Replace the original `since` parameter with two parameters: `after` (Unix timestamp ms, inclusive lower bound) and `before` (Unix timestamp ms, inclusive upper bound). Both are optional and can be used independently or together.

**Rationale**: 
- `after` alone: "show messages after I triggered the flow" (equivalent to the old `since`)
- `before` alone: "show everything up to a point" (e.g., from buffer start until a failure occurred)
- `after` + `before` together: a time window

Naming `after`/`before` is more intuitive than `since`/`until` and avoids confusion with SQL semantics.

### Last-N mode: `last` parameter

**Decision**: Add a `last` parameter (optional number). When provided, after applying all other filters, return the last `last` messages (tail of the filtered result set) instead of the first `limit` messages.

**Rationale**: The most common debugging need is "what were the last 10 messages from this node" — not "what were the first 10". `last` makes this natural. `limit` (first-N, head) remains for cases where the user wants to see the earliest matches.

**Constraint**: `last` and `limit` are mutually exclusive. If both are provided, the tool returns an error.

### Filter evaluation is client-side

**Decision**: All filtering (`nodeId`, `nodeName`, `keyword`, `after`, `before`, `last`, `limit`) is applied in the MCP server after reading from the buffer — not in the WebSocket subscription.

**Rationale**: Node-RED's `/comms` does not support server-side filtering. Client-side filtering over the ring buffer is negligible cost.

## Risks / Trade-offs

- [Auth] If Node-RED has authentication enabled, the WebSocket connection requires a session token. The comms client must use the same auth credentials as the HTTP client.
- [Socket.IO handshake] If Node-RED upgrades Socket.IO beyond v2, the handshake frames may change. This is documented as a known fragility.
- [Message loss before connect] Messages emitted before the WebSocket connects are not captured. This is inherent to the polling model.
