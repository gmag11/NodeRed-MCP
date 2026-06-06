## Why

There is currently no way for the LLM to retrieve a complete Node-RED flow as an exportable JSON. This is needed to back up a flow before editing, share it with the user, or pass it to `import-flow` to duplicate or migrate a flow.

## What Changes

- Add `export-flow` MCP tool that retrieves a single flow (by `flowId`) or all flows as a Node-RED-compatible JSON export

## Capabilities

### New Capabilities
- `tool-export-flow`: MCP tool returning a Node-RED flow or all flows as a JSON array ready to import into any Node-RED instance

### Modified Capabilities

## Impact

- New file: `src/tools/export-flow.js`
- New test file: `tests/tools/export-flow.test.js`
- `src/server.js`: register the new tool
- Uses existing `GET /flow/:id` and `GET /flows` Node-RED Admin API
