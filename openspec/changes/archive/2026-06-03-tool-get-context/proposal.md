## Why

Node-RED flows use context (node, flow, global scope) to share state between nodes without passing it through messages. The LLM currently has no way to inspect this state, making it impossible to debug stateful flows or verify that context values were set correctly after a flow ran.

## What Changes

- Add `get-context` MCP tool that reads a context value from a node, flow, or global scope

## Capabilities

### New Capabilities
- `tool-get-context`: MCP tool that reads context variables from Node-RED's context store via the Admin API

### Modified Capabilities

## Impact

- New file: `src/tools/get-context.js`
- New test file: `tests/tools/get-context.test.js`
- `src/server.js`: register the new tool
- Uses `GET /context/node/:nodeId`, `GET /context/flow/:flowId`, `GET /context/global` Node-RED Admin API
