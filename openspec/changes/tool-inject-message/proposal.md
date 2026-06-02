## Why

After building or modifying a flow the LLM has no way to trigger it for testing without user intervention. Node-RED exposes `POST /inject/:id` to fire an inject node programmatically. Exposing this as an MCP tool closes the build→test loop.

## What Changes

- Add `inject-message` MCP tool that fires a named inject node by its node ID or by searching for it by name within a flow

## Capabilities

### New Capabilities
- `tool-inject-message`: MCP tool that triggers an inject node in the running Node-RED instance

### Modified Capabilities

## Impact

- New file: `src/tools/inject-message.js`
- New test file: `tests/tools/inject-message.test.js`
- `src/server.js`: register the new tool
- Uses `POST /inject/:nodeId` Node-RED Admin API
