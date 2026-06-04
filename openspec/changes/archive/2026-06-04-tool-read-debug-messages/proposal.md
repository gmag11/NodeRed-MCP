## Why

After triggering a flow via `inject-message`, the LLM has no way to observe the output. Node-RED's debug messages are emitted over WebSocket (`/comms`), not via REST. Without access to these messages, the LLM cannot verify that a flow works correctly or diagnose errors.

## What Changes

- Add a WebSocket client in the MCP server that connects to Node-RED's `/comms` endpoint and buffers incoming debug messages in memory
- Add `read-debug-messages` MCP tool that reads from this buffer with filtering by node ID, node name, keyword, or message type

## Capabilities

### New Capabilities
- `tool-read-debug-messages`: MCP tool that returns buffered debug messages from Node-RED with filtering support
- `nodered-comms-client`: Internal WebSocket client that maintains a persistent connection to Node-RED `/comms` and buffers debug messages

### Modified Capabilities
- `nodered-client`: Extend to manage the WebSocket lifecycle (connect on startup, reconnect on disconnect)

## Impact

- New file: `src/nodered/comms-client.js` (WebSocket client + message buffer)
- New file: `src/tools/read-debug-messages.js`
- New test file: `tests/tools/read-debug-messages.test.js`
- `src/server.js`: initialize the comms client and pass it to the tool handler
- New dependency: `ws` package (WebSocket client)
