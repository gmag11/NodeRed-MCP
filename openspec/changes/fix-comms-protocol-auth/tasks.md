# Tasks

## 1. Test infrastructure: in-process fake Node-RED comms server

- [ ] 1.1 Add `tests/nodered/helpers/fake-comms-server.js`: an in-process `ws` server that accepts the upgrade at `/comms` via the HTTP `upgrade` event and speaks Node-RED's real protocol (plain JSON frames; server→client event frames are JSON arrays of `{ topic, data }`; control frames are objects with an `auth` key). Annotate each mirrored behavior with the Node-RED source file it derives from. Expose options: `requireAuth` (bool), `acceptToken` (string), and helpers `pushEvent(topic, data)` and `closeAll()`. Verify: file exists and can be imported without side effects.
- [ ] 1.2 Have the fake record every upgrade request URL and every received frame, so tests can assert on ordering and query parameters. Verify: a smoke test opens a socket and reads back the recorded URL and frames.
- [ ] 1.3 Give the fake an auth gate matching Node-RED's semantics: when `requireAuth` is true, do not deliver any event until a valid `{"auth":...}` frame arrives; reject an invalid or missing auth attempt by sending `{"auth":"fail"}` and closing the socket. Verify: a smoke test confirms events are withheld pre-auth and delivered post-auth.
- [ ] 1.4 Add a fake heartbeat emitter that sends an `hb` topic event on an interval. Verify: a smoke test observes `hb` frames arriving.

## 2. Frame classifier (pure layer)

- [ ] 2.1 In `src/nodered/comms-client.js`, replace `parseSocketIOFrame` with a classifier returning a typed result for: event batch (`{ type: 'events', events: [{ topic, data }] }`), auth control (`{ type: 'auth', status: 'ok' | 'fail' }`), and unhandled (`null`). Recognize only a JSON array (batch) and a JSON object with an `auth` key (control); ignore everything else without closing the socket. Verify: `tests/nodered/comms-client-frames.test.js` covers array batch, multi-event batch, `{"auth":"ok"}`, `{"auth":"fail"}`, malformed JSON, a bare `40`, a `42[...]` frame, and `{}`.
- [ ] 2.2 Export the classifier for testing (named export) while keeping it internal to the module's public surface. Verify: the classifier test file imports and exercises it directly.
- [ ] 2.3 Remove the Socket.IO-specific code paths (`40` handling, `42[...]` parsing, `3` pong reply, the Socket.IO-v2 plain-JSON fallback that is now the primary path) and the `EIO=4&transport=websocket` query parameters from `buildWsUrl`. Verify: `grep` for `EIO`, `transport=websocket`, `'42'` and `'40'` in `src/nodered/comms-client.js` returns no protocol usages.

## 3. Connection state machine

- [ ] 3.1 Replace the `#connected` boolean with explicit state (`idle` | `connecting` | `open` | `authenticating` | `ready` | `closed`) and track `#lastAuthOutcome`. Derive a single public `isReady` accessor from state, and keep `isConnected` as a truthful alias for "socket open and able to receive". Verify: a unit test asserts the state transitions across an open→ready sequence with and without auth.
- [ ] 3.2 Emit `connected` only on transition into `ready`, and `disconnected` when leaving a previously-`ready` state. Verify: a test asserts `connected` fires on an unauthenticated instance (no `'40'` frame involved) and that `isConnected` reports `true` while events are flowing.
- [ ] 3.3 Expose the connection state for consumers as a small snapshot object (state, ready, authenticated, lastAuthOutcome). Verify: a test asserts the snapshot shape in ready and in auth-failed states.

## 4. Handshake sequence: auth then subscribe

- [ ] 4.1 On socket `open`, send `{"auth": <token>}` **only when** a token or username/password credentials are configured; otherwise transition straight to `ready`. Never send an auth frame when no credentials exist. Verify: protocol test asserts the fake receives no `auth` frame when `requireAuth` is false and no credentials are configured, and receives it when credentials are configured.
- [ ] 4.2 Send `{"subscribe":"debug"}` only after reaching `ready` (after `{"auth":"ok"}` when auth is required). Verify: protocol test asserts the recorded frame order is `auth` before `subscribe`, and that `subscribe` is sent on open when no auth is required.
- [ ] 4.3 Remove the `access_token` query parameter from the WebSocket URL. Verify: protocol test asserts the recorded upgrade URL contains no `access_token`, `EIO`, or `transport` parameter.
- [ ] 4.4 Handle `{"auth":"ok"}` by entering `ready`; handle `{"auth":"fail"}` by marking not-ready, emitting `error` with an actionable message naming `NODERED_API_KEY`/credentials, and scheduling the next attempt through the backoff timer rather than reconnecting immediately. Verify: protocol test asserts no `connected` emission, an `error` emission, and that a second connection attempt does not occur before the first backoff interval elapses.
- [ ] 4.5 In the credentials auth path, keep fetching a fresh token via the existing auth manager on reconnect, and invalidate the token on auth failure so a stale token is not retried indefinitely. Verify: unit test with a stubbed token fetch asserts a new token is requested after an auth failure.

## 5. Keepalive and event handling

- [ ] 5.1 Route `events` from the classifier to the buffer: buffer only `debug` topics; ignore `hb` and other topics without buffering or erroring. Verify: protocol test asserts a pushed `debug` event is buffered and a pushed `hb` event is not.
- [ ] 5.2 Preserve `#normalizeDebugMessage` semantics (id, name, msg, format, path, numeric timestamp fallback to receipt time). Verify: existing normalization assertions still pass and a new assertion covers the missing-timestamp fallback.

## 6. read-debug-messages reporting

- [ ] 6.1 Add the connection-state snapshot to the `read-debug-messages` response payload alongside `messages`, `total`, and `bufferSize`. Verify: `tests/tools/read-debug-messages.test.js` asserts the field is present and correct for a ready client.
- [ ] 6.2 Include a diagnostic note when the client cannot receive events (not ready, or auth failed), so an empty result is distinguishable from an idle connected client. Verify: a test asserts that a non-ready client yields an empty message list **and** a diagnostic that mentions the connection problem, and that a ready idle client yields an empty list **without** that diagnostic.
- [ ] 6.3 Extend `DebugMessagesResponseSchema` in `src/schemas/responses.js` with the connection-state field (and optional diagnostic), keeping the existing fields intact. Verify: schema import succeeds and a response with the new field validates.

## 7. Regression protection and cleanup

- [ ] 7.1 Add `tests/nodered/comms-client-protocol.test.js` driving the real `CommsClient` against the fake server over a loopback port, covering: unauthenticated connect + debug delivery, authenticated connect + frame order, auth rejection + backoff, no-auth-frame-without-credentials, non-JSON frame ignored, and server-initiated close triggering reconnect. Verify: `npx vitest run tests/nodered/comms-client-protocol.test.js` passes.
- [ ] 7.2 Ensure sockets and timers are torn down in `afterEach` so the suite does not hang or leak handles. Verify: `npm test` exits on its own with no open-handle warning.
- [ ] 7.3 Confirm the pre-existing suite is unaffected: `npm test` passes with `tests/tools/read-debug-messages.test.js` filter/buffer cases unchanged. Verify: full `npm test` is green.
- [ ] 7.4 Update the archived-spec artifact trail: confirm `openspec validate fix-comms-protocol-auth --strict` passes and the delta for `tool-read-debug-messages` matches the existing requirement headers exactly. Verify: command reports the change as valid.

## 8. End-to-end verification on a live authenticated instance

- [ ] 8.1 Rebuild the image and restart the MCP server with `NODERED_URL` and `NODERED_API_KEY` pointed at the authenticated instance. Verify: startup logs report the Node-RED auth mode and no `CommsClient` errors.
- [ ] 8.2 Call `read-debug-messages` and confirm the connection state reports ready (not merely an empty buffer). Verify: the response carries a ready connection state.
- [ ] 8.3 Trigger an inject whose downstream debug node has `active: true` (prefer one wired directly to a debug node), then call `read-debug-messages` with `last: 5`. Verify: messages are returned with `topic`-derived node ids matching the triggered debug node.
- [ ] 8.4 Confirm the failure mode is now self-describing: point the server at the instance with an invalid API key and verify `read-debug-messages` reports a non-ready state with a diagnostic rather than a bare empty buffer. Verify: the response contains the diagnostic and the state is not ready.
