## Why

The Node-RED Admin API exposes a `DELETE /context/{scope}/{id}/{var_name}` endpoint that removes a specific
context variable. After confirming that writing context is not possible via the Admin API (see `tool-set-context`),
deleting context is the only mutation operation available. This is useful to reset a stale or corrupt key without
restarting Node-RED.

## What Changes

- Add `delete-context` MCP tool that deletes a single context variable from a node, flow, or global scope
- Remove the previously implemented (and now dropped) `set-context` tool

## Capabilities

### New Capabilities
- `tool-delete-context`: MCP tool that deletes a context variable from Node-RED's context store via the Admin API

### Modified Capabilities
- `src/server.js`: `set-context` registration removed, `delete-context` registration added

## Impact

- New file: `src/tools/delete-context.js`
- New test file: `tests/tools/delete-context.test.js`
- Deleted: `src/tools/set-context.js`, `tests/tools/set-context.test.js`
- `src/server.js`: swap `set-context` → `delete-context`
- Uses `DELETE /context/node/:nodeId/:key`, `DELETE /context/flow/:flowId/:key`, `DELETE /context/global/:key`
