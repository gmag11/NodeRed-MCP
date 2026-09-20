# Design

## Context

See `proposal.md` — Why for the motivation. The relevant current state:

`src/nodered/comms-client.js` is the only module that talks to Node-RED's real-time channel. It implements a Socket.IO v4 / Engine.IO v4 handshake, which Node-RED does not speak. Node-RED's editor API (`@node-red/editor-api/lib/editor/comms.js`) instead runs a bare `ws` server over the HTTP upgrade event and exchanges plain JSON text frames.

Two properties of Node-RED's implementation drive this design:

1. **The auth gate is a gate, not a hint.** `CommsConnection` computes `pendingAuth = !user && (settings.adminAuth != null)`. While `pendingAuth` is true, incoming messages are only inspected for an `auth` key; everything else falls through to an anonymous-user path that ends in `{"auth":"fail"}` + `ws.close()`. A connection is not added to `connections[]` until auth completes, and `publish()` iterates `connections[]` — so an unauthenticated connection receives literally nothing, silently.
2. **`subscribe` is not how you start receiving events.** The runtime's own comment states all clients get automatically subscribed to everything and cannot unsubscribe; `subscribe` only replays retained topics. This is why the current broken client still receives *some* traffic against an unauthenticated instance — masking the defect.

Constraints from the existing codebase:

- Node.js `>=18`, ESM (`"type": "module"`).
- `ws` ^8.18.2 is already a direct dependency; no new dependency is needed.
- Tests run with `vitest` and currently have **no coverage of the WebSocket path at all** — `tests/tools/read-debug-messages.test.js` only exercises `filterMessages` and the ring buffer through a `_testAddMessage` backdoor. A protocol bug was therefore invisible to CI. This design treats that gap as a first-class problem.

## Goals / Non-Goals

**Goals:**

- Speak Node-RED's real `/comms` protocol so debug events are delivered on both authenticated and unauthenticated instances.
- Make connection state truthful, so `read-debug-messages` can distinguish "connected and idle" from "not receiving anything".
- Make auth failures observably different from idle connections.
- Establish test coverage of the protocol path using an in-process fake Node-RED comms server, so the framing contract is enforced by CI.

**Non-Goals:**

- Changing the MCP tool's argument surface (`read-debug-messages` filters stay as they are).
- Auto-enabling paused debug nodes. `active: false` is a Node-RED sidebar concern; on the reference instance 207/368 debug nodes are paused and `POST /debug/true` returns 404. Recording that nodes are paused is not feasible from the socket, since paused nodes never publish.
- Touching `src/transport/ws-server.js`, which serves the staging viewer and is unrelated to Node-RED's `/comms`.
- Supporting Node-RED's older Socket.IO v2-era comms. Node-RED has used the raw-`ws` implementation for many major versions; the current spec targets the modern protocol only.

## Decisions

### D1: Implement the typed protocol directly, with an explicit frame classifier

Replace the Socket.IO frame parser with a classifier that recognizes exactly two server-to-client shapes, mirroring `CommsConnection.prototype._queueSend`:

- `Array` → a batch of `{ topic, data }` event envelopes.
- `Object` with an `auth` key → a control frame (`"ok"` / `"fail"`).

Anything else is ignored without closing the socket.

*Alternatives considered:*

- **Keep a Socket.IO-compatible parser and add the native one alongside.** Rejected: dead code that implies support that does not exist, and it hides which protocol is authoritative. Node-RED never negotiates Socket.IO here.
- **Use a Socket.IO client library.** Rejected: the server is not Socket.IO at all; the library would reconnect-loop against a server that never sends the expected handshake.

The classifier is a small pure function (frame string → typed result), which makes it directly unit-testable without any socket, and is where the previous implementation's ambiguity (three overlapping branches, one of them a fallback for a protocol Node-RED does not use) is removed.

### D2: Authenticate in-band, and only when credentials exist

Send `{"auth": <token>}` as the first frame after `open` **only if** a token or credentials are configured. Then send `{"subscribe":"debug"}`.

Ordering matters and is enforced by state, not by timers: the client tracks a small state machine — `idle → connecting → open → authenticating → ready` — and only issues the subscription once it is `ready`. When no credentials are configured, `open` transitions directly to `ready`.

*Rationale for conditional auth.* Sending an `auth` packet to an instance without `adminAuth` is not a harmless no-op: it enters `handleAuthPacket`, which probes `Tokens.get()` and then `Users.tokens()` — a function that is only defined when the instance configures a `tokens` callback. On an instance without one this is an unhandled rejection inside a promise chain, which terminates the Node process on modern Node. Conditioning the packet on having credentials is therefore required for safety, not just tidiness.

*Alternatives considered:*

- **Always send `{"auth": token}`.** Rejected as above: can destabilize unauthenticated instances.
- **Send the token only via the `Authorization` header on the upgrade.** Verified to work against the reference instance, but it depends on the server's `tokenHeader`/reverse-proxy configuration and is unavailable in browser-like environments. Not portable; kept as a viable fallback but not the primary path.
- **Query parameter (`?access_token=`).** The current behavior. Rejected: Node-RED does not read tokens from the query string for `/comms`. This is the root cause of the silent failure.

### D3: Distinguish three booleans instead of one

Replace the single never-true `#connected` flag with explicit state: socket open, authenticated (or not required), and ready (subscribed and able to receive). Expose a coarse public accessor for the tool, plus the last auth outcome.

*Rationale:* the old design derived connectivity from receiving a `'40'` frame that Node-RED never sends, so `isConnected` was permanently `false` and the `'connected'` event never fired — including on instances where events were arriving fine. Deriving state from the actual protocol makes both the event and the accessor meaningful.

### D4: Treat auth rejection as a backoff condition, not a reconnect storm

On `{"auth":"fail"}` or a pre-auth socket close: mark not-ready, emit an `error`, and schedule the next attempt through the existing exponential backoff (1s → 30s cap). Never retry immediately.

*Rationale:* the naive reading of "auth failed → retry" produces a tight loop against a misconfigured server. Note the specific hazard this avoids: sending `subscribe` before auth yields `{"auth":"fail"}` + close, so a client that retries on close without backoff would spin.

### D5: Report connection state in the tool response

`read-debug-messages` gains a connection-state field alongside `messages`/`total`/`bufferSize`, and includes a diagnostic note when the client cannot receive events.

*Rationale:* the original incident was prolonged precisely because `{ messages: [], total: 0 }` looks identical for "nothing fired yet" and "you are not connected at all". Making the states distinguishable is the difference between a five-minute diagnosis and a multi-hour one.

*Trade-off:* the response schema gains a field. This is additive; existing consumers that read `messages`/`total` are unaffected.

### D6: Enforce the protocol contract with an in-process fake Node-RED

Add a test suite that boots a real `ws` server implementing Node-RED's documented behavior (upgrade at `/comms`, plain JSON frames, `auth` gate that withholds all events until authenticated, array-shaped event batches, `hb` heartbeats) and drives the real `CommsClient` against it over a loopback port.

The fake server is deliberately a *specification of Node-RED's behavior derived from its source*, not a mock of our client. Tests assert protocol behavior end to end:

- Frames are plain JSON, and no `EIO`/`transport` query parameters are present on the upgrade request.
- With auth disabled on the fake: `connected` fires on open, and a debug event pushed by the fake is buffered.
- With auth enabled and a valid token: the client sends `{"auth":...}` before `{"subscribe":...}`, and only becomes ready after `{"auth":"ok"}`.
- With auth enabled and a rejected token: the client does not report ready, does not emit `connected`, and schedules (not immediately repeats) a retry.
- `auth` frame is not sent at all when no credentials are configured.
- `hb` heartbeat frames are not buffered.
- Ring buffer eviction, buffer-size clamping, and the existing `filterMessages` behavior continue to pass unchanged.

*Alternatives considered:*

- **Extract the parser into a pure module and unit-test only that.** Necessary but insufficient — it would not have caught this bug, because the client's failure was in the *handshake sequence and state derivation*, not in parsing a single frame in isolation. The parser tests are included as a fast layer underneath the integration layer.
- **Test against a real Node-RED in Docker.** Rejected for the default suite: slow, needs network and credentials, and cannot easily simulate auth rejection on demand. The fake server gives deterministic control over the auth gate, which is exactly the dimension that was broken.

### D7: Keep `_testAddMessage` for buffer tests, add a socket-level seam

The existing `_testAddMessage` backdoor stays (it legitimately isolates ring-buffer tests from I/O). New protocol tests use the real socket path via the fake server rather than extending the backdoor, so the handshake sequence is genuinely exercised.

## Risks / Trade-offs

- **Behavioral divergence from the packaged Node-RED version.** The fake server encodes v5.0.7 semantics; a future Node-RED could change the auth gate or framing. → The fake's behavior is annotated with references to the Node-RED source it mirrors, so the contract is auditable and cheap to update. The real protocol is stable and documented by the runtime comment about auto-subscription.
- **Reverse-proxy token headers.** Deployments that front Node-RED with a proxy injecting a token header may authenticate before our in-band packet. → The client tolerates a pre-authenticated connection: if the server sends events without ever answering our auth packet, events are still buffered and readiness is inferred from receiving event frames.
- **`auth` packet can terminate an unauthenticated instance's process.** Described in D2. → Mitigated by conditioning the packet on configured credentials, and covered by a test asserting no auth frame is sent when credentials are absent.
- **Silent-empty regression risk.** The core bug was invisible because empty results were ambiguous. → D5 makes the states distinguishable, and D6 asserts the disconnected case explicitly.
- **Scope creep into the paused-debug-node problem.** Tempting to "fix" empty results by auto-enabling nodes. → Explicit non-goal; `POST /debug/true` returns 404 on the reference instance, so any such attempt would be unreliable and misleading.
- **Reconnect semantics on auth failure.** Backoff-plus-error is correct but means a permanently misconfigured token yields recurring `error` emissions. → Acceptable and preferable to silence; log volume is bounded by the 30s cap.

## Migration Plan

No data migration and no MCP client changes required. Deployment is a normal image rebuild:

1. Update `src/nodered/comms-client.js` (protocol, auth, state machine) and the token selection at the `index.js` call site.
2. Update `read-debug-messages` to include connection state; extend the response schema.
3. Run `npm test` — the new protocol suite must pass, and the existing filter/buffer tests must stay green.
4. Rebuild the image and confirm against the target instance: `read-debug-messages` reports a ready connection, and triggering a debug node whose `active` flag is true yields messages.

**Rollback:** revert the commit and rebuild. The change is confined to one consumer of `/comms`; no persisted state, no schema migration, no API contract break.

**Verification on a live authenticated instance** is a manual step, because it needs credentials: trigger an inject whose downstream debug node is not paused, then confirm the tool returns messages with a ready connection state.
