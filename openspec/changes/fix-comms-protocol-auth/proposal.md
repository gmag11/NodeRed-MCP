# Proposal

## Why

The `read-debug-messages` MCP tool silently returns an empty buffer when the MCP server points at a Node-RED instance with `adminAuth` enabled. The comms WebSocket client implements a Socket.IO v4 / Engine.IO v4 handshake that Node-RED does **not** speak, so the connection is never authenticated and Node-RED never registers it as a recipient of published events. Because failures are swallowed (no `error` event, no log line), the tool appears to work while returning nothing — the worst possible failure mode for a debugging tool.

Verified against Node-RED 5.0.7 with authentik/OIDC strategy auth: the WebSocket upgrade succeeds, the socket stays open, and zero debug frames arrive. `read-debug-messages` responds `{ messages: [], total: 0, bufferSize: 500 }` indefinitely.

## What Changes

- **Replace the Socket.IO handshake with Node-RED's real `/comms` protocol.** Node-RED's editor API uses a raw `ws` server (`new ws.Server({ noServer: true })`) and exchanges plain JSON text frames. The client currently sends `40` and `42[...]` frames and waits for Engine.IO `0{...}` open packets that never arrive.
- **Send the auth token in-band.** With `adminAuth` configured, Node-RED's `CommsConnection` sets `pendingAuth = true` and discards every message until it receives `{"auth": <token>}` over the socket. The token is never read from an `access_token` query parameter. The client currently passes it as a query param, so it is ignored.
- **Handle the server's auth rejection.** Node-RED replies `{"auth":"fail"}` and closes the socket when auth fails. The client must treat this as terminal-for-this-attempt (not a silent no-op) and back off rather than reconnect in a tight loop.
- **Fix connection state reporting.** `isConnected` is derived from a `'40'` frame that never arrives, so it is permanently `false` and the `'connected'` event never fires. Connectivity must be derived from the actual protocol, and the client must expose whether the connection is authenticated and subscribed.
- **Surface unrecoverable state instead of swallowing it.** When the client cannot authenticate or is not subscribed, `read-debug-messages` SHALL report that state rather than returning an empty buffer that is indistinguishable from "nothing has fired yet".
- **Correct the existing spec.** `openspec/specs/tool-read-debug-messages/spec.md` currently mandates the Socket.IO handshake (`EIO=4&transport=websocket`, send `40`, parse `42[...]`), which is the defect. That requirement must be rewritten.

## Capabilities

### New Capabilities
- `nodered-comms`: The WebSocket protocol contract between the MCP server and Node-RED's `/comms` endpoint — framing, handshake sequence, authentication, keepalive, reconnection, and connection-state reporting.

### Modified Capabilities
- `tool-read-debug-messages`: The `nodered-comms-client WebSocket connection` requirement is rewritten to remove the Socket.IO/Engine.IO mandate and replace it with Node-RED's native JSON protocol plus in-band authentication. The `read-debug-messages MCP tool` requirement gains a scenario for reporting a disconnected/unauthenticated client rather than returning a bare empty buffer.

## Impact

**Affected code**
- `src/nodered/comms-client.js` — handshake, frame parsing, auth, state, reconnect logic (primary change).
- `src/tools/read-debug-messages.js` — surface client connection state in the response payload.
- `src/schemas/responses.js` — `DebugMessagesResponseSchema` may gain a connection-state field.
- `index.js` — construction and `connect()` call site; token source selection.

**Affected specs**
- `openspec/specs/tool-read-debug-messages/spec.md` (modified requirement).
- `openspec/specs/nodered-comms/spec.md` (new).

**Behavioral impact**
- Debug capture starts working against authenticated Node-RED instances. This is the user-visible fix.
- Existing behavior against unauthenticated Node-RED instances is preserved (auth packet is a no-op there, since the connection is already registered on open).
- No MCP tool signature changes; no breaking changes for callers.

**Out of scope**
- Auto-unpausing debug nodes. On the reference instance 207 of 368 debug nodes are paused (`active: false`), and `POST /debug/true` returns 404 there. Documenting/enabling that is a separate change.
- Migrating the staging viewer's own WebSocket server (`src/transport/ws-server.js`), which is unrelated to Node-RED's `/comms`.
