# tool-read-debug-messages Specification

## Purpose
Lets an agent read the debug output emitted by Node-RED debug nodes, so it can observe what a flow actually produced after triggering it. Exposes a filtered, bounded view of the buffered debug stream and reports whether the underlying `/comms` connection is able to receive events.

## Requirements

### Requirement: nodered-comms-client WebSocket connection

The system SHALL maintain a persistent WebSocket connection to Node-RED's `/comms` endpoint for the lifetime of the MCP server process. It SHALL speak Node-RED's native protocol: a raw RFC 6455 WebSocket carrying plain JSON text frames, where server-to-client event frames are JSON arrays of `{ topic, data }` envelopes. It MUST NOT use Socket.IO or Engine.IO framing, and MUST NOT depend on Engine.IO open or ping packets.

When credentials or a token are configured, it SHALL authenticate by sending an in-band `{"auth": <token>}` packet over the socket and SHALL wait for the server's auth confirmation before treating the connection as usable. It MUST NOT rely on an `access_token` query parameter.

Once the connection is usable it SHALL subscribe to the `debug` topic by sending `{"subscribe":"debug"}`.

It SHALL reconnect automatically on disconnect using exponential backoff (initial 1s, max 30s), and SHALL treat a rejected authentication as a failed attempt that is retried according to that backoff rather than silently ignored.

It SHALL buffer the last N debug messages where N is read from the `NODE_RED_DEBUG_BUFFER_SIZE` environment variable at startup (default 500, min 10, max 10000).

#### Scenario: Connect and buffer a debug message

- **WHEN** a debug node fires in Node-RED on an instance without authentication
- **THEN** the comms client receives the event and appends it to the ring buffer

#### Scenario: Connect and buffer a debug message on an authenticated instance

- **WHEN** Node-RED has `adminAuth` configured and a valid token is available
- **THEN** the comms client sends an in-band auth packet, waits for confirmation, subscribes to `debug`, and appends subsequent debug events to the ring buffer

#### Scenario: Authentication rejected

- **WHEN** the server answers the auth packet with `{"auth":"fail"}`
- **THEN** the client does not report the connection as usable, does not emit `connected`, and retries a later attempt with backoff

#### Scenario: Ring buffer evicts oldest on overflow

- **WHEN** the buffer is full and a new message arrives
- **THEN** the oldest message is removed and the new one is appended

#### Scenario: Buffer size is read from environment variable

- **WHEN** `NODE_RED_DEBUG_BUFFER_SIZE=500` is set before starting the MCP server
- **THEN** the ring buffer holds up to 500 messages

#### Scenario: Reconnects after disconnect

- **WHEN** the WebSocket connection drops
- **THEN** the comms client attempts to reconnect with exponential backoff

### Requirement: read-debug-messages MCP tool

The system SHALL expose an MCP tool named `read-debug-messages` that accepts:
- `nodeId` (optional string)
- `nodeName` (optional string, substring match)
- `keyword` (optional string, substring match against stringified message)
- `after` (optional number, Unix timestamp ms — include only messages with `timestamp >= after`)
- `before` (optional number, Unix timestamp ms — include only messages with `timestamp <= before`)
- `last` (optional number — return the last N messages from the filtered result set)
- `limit` (optional number, default 50 — return the first N messages from the filtered result set)

`last` and `limit` are mutually exclusive. It SHALL return messages from the buffer matching all provided filters.

It SHALL also report the connection state of the underlying comms client, so that a caller can distinguish "connected but nothing has fired" from "not connected", and SHALL surface a diagnostic indication when the client is not in a state where debug events can be received.

#### Scenario: Read all recent messages (default)

- **WHEN** `read-debug-messages` is called with no filters
- **THEN** the first 50 messages from the buffer are returned in chronological order

#### Scenario: Filter by nodeId

- **WHEN** `read-debug-messages` is called with `nodeId: "abc123"`
- **THEN** only messages from that node are returned

#### Scenario: Filter by nodeName substring

- **WHEN** `read-debug-messages` is called with `nodeName: "sensor"`
- **THEN** only messages from nodes whose name contains "sensor" (case-insensitive) are returned

#### Scenario: Filter by keyword in message content

- **WHEN** `read-debug-messages` is called with `keyword: "error"`
- **THEN** only messages whose stringified `msg` contains "error" (case-insensitive) are returned

#### Scenario: Filter by time window (after + before)

- **WHEN** `read-debug-messages` is called with `after: T1` and `before: T2`
- **THEN** only messages with `timestamp >= T1` AND `timestamp <= T2` are returned

#### Scenario: Filter from a point in time (after only)

- **WHEN** `read-debug-messages` is called with `after: T1` and no `before`
- **THEN** only messages with `timestamp >= T1` are returned (equivalent to the previous `since` behavior)

#### Scenario: Filter until a point in time (before only)

- **WHEN** `read-debug-messages` is called with `before: T2` and no `after`
- **THEN** only messages from the buffer start up to `T2` are returned

#### Scenario: Return last N matching messages

- **WHEN** `read-debug-messages` is called with `last: 10` and `nodeId: "abc"`
- **THEN** the filters are applied first, then the last 10 messages of the filtered result are returned in chronological order

#### Scenario: last and limit are mutually exclusive

- **WHEN** both `last` and `limit` are provided
- **THEN** the tool returns an error: `last and limit are mutually exclusive — use one or the other`

#### Scenario: Empty buffer

- **WHEN** no debug messages have been received yet
- **THEN** the tool returns `{ messages: [], total: 0, bufferSize: N }` together with a connection state indicating whether the client is connected

#### Scenario: Empty buffer while connected

- **WHEN** the client is connected and no debug messages have been received yet
- **THEN** the tool returns an empty message list, a total of 0, the buffer size, and a connection state indicating the client is connected

#### Scenario: Empty buffer while not connected

- **WHEN** the client is not connected, or is connected but not authenticated such that no events can be received
- **THEN** the tool returns an empty message list together with a connection state that makes the disconnection evident, rather than an empty list indistinguishable from a connected idle client
