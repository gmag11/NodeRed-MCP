## Why

Node-RED flows use context (node, flow, global scope) to write state changes from flows. The LLM currently has no way to write to this state, making it impossible to pre-seed context values before testing a flow or to reset state between test runs.

## What Changes

- Add `set-context` MCP tool that writes a value to a node, flow, or global context scope

## Capabilities

### New Capabilities
- `tool-set-context`: MCP tool that writes context variables to Node-RED's context store via the Admin API

### Modified Capabilities

## Impact

- New file: `src/tools/set-context.js`
- New test file: `tests/tools/set-context.test.js`
- `src/server.js`: register the new tool
- Uses `PUT /context/node/:nodeId`, `PUT /context/flow/:flowId`, `PUT /context/global` Node-RED Admin API
