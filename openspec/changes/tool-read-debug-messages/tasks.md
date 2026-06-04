## 1. Comms Client (WebSocket + Buffer)

- [x] 1.1 Add `ws` to `package.json` dependencies
- [x] 1.2 Create `src/nodered/comms-client.js` with a `CommsClient` class that accepts `{ baseUrl, username, password }` config
- [x] 1.3 Implement `connect()` method: open WebSocket to `ws(s)://<host>/comms`, send Socket.IO v2 handshake (`40`), parse incoming `42[...]` frames, emit `debug` events for topic `"debug"`
- [x] 1.4 Implement ring buffer: `_buffer` array with max size from `NODE_RED_DEBUG_BUFFER_SIZE` env (default 200); FIFO eviction
- [x] 1.5 Implement auto-reconnect with exponential backoff (1s initial, 2× each retry, 30s max)
- [x] 1.6 Implement `getMessages()` method returning a copy of the buffer
- [x] 1.7 Handle auth: if credentials are configured, obtain a session token via the HTTP auth flow and pass it as a cookie/query param on the WebSocket URL

## 2. read-debug-messages Tool

- [x] 2.1 Create `src/tools/read-debug-messages.js` with `filterMessages(messages, { nodeId, nodeName, keyword, after, before, last, limit })` pure function
- [x] 2.2 `filterMessages` SHALL apply `after`/`before` as inclusive timestamp bounds, `nodeId` as exact match, `nodeName`/`keyword` as case-insensitive substring; after filtering: if `last` is set return the last N; otherwise return the first `limit` (default 50)
- [x] 2.3 `filterMessages` SHALL return an error when both `last` and `limit` are explicitly provided
- [x] 2.4 Implement `handleReadDebugMessages(commsClient)` that calls `commsClient.getMessages()`, applies filters, and returns `{ messages, total, bufferSize }`

## 3. Server Integration

- [x] 3.1 In `src/server.js`, instantiate `CommsClient` with the same config as the HTTP client and call `connect()` at startup
- [x] 3.2 Import `handleReadDebugMessages` and register the `read-debug-messages` tool with parameters: `nodeId`, `nodeName`, `keyword`, `after`, `before`, `last`, `limit` (all optional)
- [x] 3.3 Pass the `commsClient` instance to the tool handler

## 4. Tests

- [x] 4.1 Create `tests/tools/read-debug-messages.test.js`
- [x] 4.2 Add test: `filterMessages` with no filters returns first 50 messages in chronological order
- [x] 4.3 Add test: `filterMessages` filters by exact `nodeId`
- [x] 4.4 Add test: `filterMessages` filters by `nodeName` substring (case-insensitive)
- [x] 4.5 Add test: `filterMessages` filters by `keyword` in stringified message
- [x] 4.6 Add test: `filterMessages` filters by `after` timestamp (inclusive lower bound)
- [x] 4.7 Add test: `filterMessages` filters by `before` timestamp (inclusive upper bound)
- [x] 4.8 Add test: `filterMessages` filters by `after` + `before` together (time window)
- [x] 4.9 Add test: `filterMessages` with `last: 5` returns the last 5 matching messages in chronological order
- [x] 4.10 Add test: `filterMessages` returns error when both `last` and `limit` are provided
- [x] 4.11 Add test: ring buffer evicts oldest when capacity exceeded
