## ADDED Requirements

### Requirement: nodered-comms-client WebSocket connection
The system SHALL maintain a persistent WebSocket connection to Node-RED's `/comms` endpoint for the lifetime of the MCP server process. It SHALL perform the minimal Socket.IO v4 / Engine.IO v4 handshake (add `EIO=4&transport=websocket` query params, send `40` after open, parse `42[...]` event frames). It SHALL reconnect automatically on disconnect using exponential backoff (initial 1s, max 30s). It SHALL buffer the last N debug messages where N is read from the `NODE_RED_DEBUG_BUFFER_SIZE` environment variable at startup (default 500, min 10, max 10000).

#### Scenario: Connect and buffer a debug message
- **WHEN** a debug node fires in Node-RED
- **THEN** the comms client receives the event and appends it to the ring buffer

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
- **THEN** the tool returns `{ messages: [], total: 0, bufferSize: N }`
