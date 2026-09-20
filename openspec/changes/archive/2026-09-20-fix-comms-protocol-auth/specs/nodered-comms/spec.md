# Spec Delta

## Purpose

Defines the protocol contract between the MCP server and Node-RED's `/comms` WebSocket endpoint, so that debug output and status events published by Node-RED are reliably delivered to the MCP server across authenticated and unauthenticated deployments.

## ADDED Requirements

### Requirement: Node-RED native comms framing

The client SHALL communicate with Node-RED's `/comms` endpoint using Node-RED's native protocol: a raw RFC 6455 WebSocket carrying plain JSON text frames. The client MUST NOT use Socket.IO or Engine.IO framing, MUST NOT send Engine.IO query parameters (`EIO`, `transport`), MUST NOT send Socket.IO packet prefixes (`40`, `42[...]`, `3`), and MUST NOT wait for Engine.IO open or ping packets.

The client SHALL distinguish two server-to-client frame shapes:

- A JSON **array** of one or more event envelopes, each of shape `{ topic, data }`.
- A JSON **object** used for protocol control, with the relevant key being `auth` (values `"ok"` / `"fail"`).

Frames that parse as neither shape SHALL be ignored without terminating the connection.

#### Scenario: Event batch is parsed and buffered
- **WHEN** the server sends `[{"topic":"debug","data":{"id":"abc","msg":"42"}}]`
- **THEN** the client treats it as an event envelope for topic `debug` and appends the normalized message to the ring buffer

#### Scenario: Multiple events in one frame
- **WHEN** the server sends an array containing more than one event envelope
- **THEN** the client processes every envelope in the array in order

#### Scenario: Engine.IO query parameters are not sent
- **WHEN** the client opens the WebSocket connection
- **THEN** the request URL contains no `EIO` or `transport` query parameter

#### Scenario: Non-event control frame
- **WHEN** the server sends `{"auth":"ok"}`
- **THEN** the client treats it as a control frame and does not attempt to buffer it as an event

#### Scenario: Unparseable frame
- **WHEN** the server sends a frame that is neither a JSON array nor a JSON object
- **THEN** the client ignores the frame and keeps the connection open

### Requirement: Connection state reporting

The client SHALL expose whether the connection is usable for receiving events, distinguishing three states: socket not open, socket open but not authenticated, and socket open and registered. The client SHALL emit a `connected` event only when the connection has become usable for receiving events, and a `disconnected` event when a previously usable connection is lost.

The client MUST NOT derive connection state from a protocol frame that Node-RED does not emit.

#### Scenario: Unauthenticated instance becomes usable immediately
- **WHEN** the client connects to a Node-RED instance with no `adminAuth` configured
- **THEN** the client reports a usable connection and emits `connected` once the socket is open

#### Scenario: Authenticated instance becomes usable only after auth succeeds
- **WHEN** the client connects to a Node-RED instance with `adminAuth` configured and the authentication packet succeeds
- **THEN** the client reports a usable connection and emits `connected`

#### Scenario: Authenticated instance is not usable before auth
- **WHEN** the client has an open socket to an instance with `adminAuth` configured but has not yet sent a valid authentication packet
- **THEN** the client reports the connection as not usable and does not emit `connected`

#### Scenario: Connection loss emits disconnected
- **WHEN** a usable connection is lost
- **THEN** the client emits `disconnected`

### Requirement: In-band authentication

When a credential or token is configured, the client SHALL authenticate by sending an in-band `{"auth": <token>}` JSON packet over the established WebSocket. The client MUST NOT rely on an `access_token` query parameter, because Node-RED does not read tokens from the query string for `/comms`.

When the server responds with a successful auth control frame (`{"auth":"ok"}`), the client SHALL mark the connection as usable. When the server responds with a failure control frame (`{"auth":"fail"}`) or closes the socket before authentication completes, the client SHALL treat the attempt as failed, SHALL NOT report the connection as usable, and SHALL NOT emit `connected`.

#### Scenario: Token sent in-band on open
- **WHEN** the socket opens and a token is configured
- **THEN** the client sends `{"auth":"<token>"}` over the WebSocket before any subscription request

#### Scenario: Successful authentication
- **WHEN** the server replies with `{"auth":"ok"}`
- **THEN** the client marks the connection as usable and emits `connected`

#### Scenario: Rejected authentication
- **WHEN** the server replies with `{"auth":"fail"}`
- **THEN** the client reports the connection as not usable, does not emit `connected`, and schedules a reconnect with backoff instead of retrying immediately

#### Scenario: Auth failure does not loop tightly
- **WHEN** the server repeatedly rejects authentication
- **THEN** the interval between reconnect attempts increases according to the configured backoff and is capped at a maximum

#### Scenario: No credentials configured
- **WHEN** no token or credentials are configured and the instance has no `adminAuth`
- **THEN** the client does not send an authentication packet and the connection becomes usable on open

### Requirement: Topic subscription

The client SHALL request the topics it consumes by sending `{"subscribe":"<topic>"}` JSON packets after the connection is usable. The client SHALL subscribe to the `debug` topic so that debug node output is delivered.

Subscription SHALL be sent after authentication completes when authentication is required, and MAY be sent immediately on open when it is not.

#### Scenario: Subscribe to debug after connect
- **WHEN** the connection becomes usable
- **THEN** the client sends `{"subscribe":"debug"}`

#### Scenario: Subscribe follows authentication
- **WHEN** authentication is required and the client sends its auth packet
- **THEN** the client sends the subscription packet only after the server confirms authentication

#### Scenario: Subscription failure does not stop event delivery
- **WHEN** a subscription request is not acknowledged by the server
- **THEN** the client still processes and buffers any events the server sends

### Requirement: Keepalive handling

The client SHALL tolerate Node-RED's `hb` (heartbeat) event frames without treating them as debug output. The client SHALL NOT implement Engine.IO ping/pong, because Node-RED does not use it.

#### Scenario: Heartbeat frame ignored
- **WHEN** the server sends an event envelope with topic `hb`
- **THEN** the client does not append it to the debug ring buffer

#### Scenario: Heartbeat does not reset the ring buffer
- **WHEN** heartbeat frames arrive between debug frames
- **THEN** previously buffered debug messages remain available

### Requirement: Reconnection with backoff

The client SHALL reconnect automatically after an unexpected disconnect or a failed connection attempt, using exponential backoff with an initial delay of 1 second and a maximum delay of 30 seconds. Delays SHALL reset after a connection becomes usable. An explicit disconnect request SHALL suppress further reconnection attempts.

#### Scenario: Reconnect after unexpected close
- **WHEN** an established connection closes unexpectedly
- **THEN** the client schedules a reconnect attempt using the current backoff delay

#### Scenario: Backoff is capped
- **WHEN** consecutive connection attempts fail
- **THEN** the delay grows exponentially and never exceeds 30 seconds

#### Scenario: Backoff resets after success
- **WHEN** a connection becomes usable after previous failures
- **THEN** the next backoff delay resets to the initial 1 second

#### Scenario: Explicit disconnect stops reconnection
- **WHEN** the client is explicitly disconnected
- **THEN** no further reconnect attempts are scheduled

### Requirement: Debug message normalization and buffering

The client SHALL normalize each received `debug` event into a stable message object containing at minimum the node `id`, node `name`, the message `msg`, the `format`, the `path`, and a numeric `timestamp` in milliseconds. When the payload omits a numeric timestamp, the client SHALL substitute the receipt time.

The client SHALL retain the most recent N normalized messages in a fixed-size ring buffer, where N is read from the `NODE_RED_DEBUG_BUFFER_SIZE` environment variable at startup and clamped to a minimum of 10 and a maximum of 10000, defaulting to 500. When the buffer is full, the oldest message SHALL be evicted.

#### Scenario: Normalized message includes required fields
- **WHEN** a `debug` event arrives with `{ id, name, msg, format, path }`
- **THEN** the buffered message exposes those fields plus a numeric `timestamp`

#### Scenario: Missing timestamp is substituted
- **WHEN** a `debug` event payload contains no numeric `timestamp`
- **THEN** the buffered message uses the receipt time as its `timestamp`

#### Scenario: Ring buffer evicts oldest on overflow
- **WHEN** the buffer is full and a new message arrives
- **THEN** the oldest message is removed and the new one is appended

#### Scenario: Buffer size is read from the environment
- **WHEN** `NODE_RED_DEBUG_BUFFER_SIZE=500` is set before starting the MCP server
- **THEN** the ring buffer holds up to 500 messages

#### Scenario: Buffer size is clamped
- **WHEN** `NODE_RED_DEBUG_BUFFER_SIZE` is set below 10, above 10000, or to a non-numeric value
- **THEN** the buffer size is clamped or falls back to the default of 500 without crashing

### Requirement: Non-fatal error handling

Transient network and protocol errors SHALL NOT terminate the MCP server process. The client SHALL report errors through its `error` event and SHALL continue to attempt reconnection.

#### Scenario: Connection refused does not crash the process
- **WHEN** the WebSocket connection is refused because Node-RED is unreachable
- **THEN** the client emits an `error` event, schedules a reconnect, and the process keeps running

#### Scenario: Missing base URL fails fast
- **WHEN** the client is constructed without a base URL
- **THEN** construction fails with an error naming the `NODERED_URL` environment variable
