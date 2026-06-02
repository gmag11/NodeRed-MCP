## Why

Building complex flows node-by-node via `create-node` + `connect-nodes` requires 10–20+ MCP calls per flow. Importing a full flow JSON in one call enables the LLM to deploy complete, functional flows in a single operation — and makes it possible to receive flows from the user (copy-paste from Node-RED export) and apply them directly.

## What Changes

- Add `import-flow` MCP tool that accepts a Node-RED flow JSON and imports it into the running instance
- Conflict resolution: detect ID collisions with existing nodes/flows and handle via a configurable strategy (rename IDs vs. overwrite vs. error)
- Returns a summary of what was imported (flows, nodes, config nodes) and any conflicts resolved

## Capabilities

### New Capabilities
- `tool-import-flow`: MCP tool that accepts a Node-RED-compatible flow JSON array and imports it, with conflict resolution

### Modified Capabilities
<!-- None -->

## Impact

- New file: `src/tools/import-flow.js`
- New test file: `tests/tools/import-flow.test.js`
- `src/server.js`: register the new tool
- Uses existing `POST /flows` Node-RED Admin API with `Node-RED-Deployment-Type: nodes` or regenerated IDs
