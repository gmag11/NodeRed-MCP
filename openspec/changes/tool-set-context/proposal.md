## Why

~~Node-RED flows use context (node, flow, global scope) to write state changes from flows. The LLM currently has no way to write to this state, making it impossible to pre-seed context values before testing a flow or to reset state between test runs.~~

## Decision: NOT IMPLEMENTED — Node-RED Admin API does not support writing context

After implementation and live testing, it was confirmed that the Node-RED Admin API **does not expose any endpoint for writing context values**:

- `POST /context/*` → 404 (no such route)
- `PUT /context/*` → 404 (no such route)

Context values can only be written from **within a flow** using `flow.set()`, `node.set()`, or `global.set()` inside a function node. There is no Admin API equivalent.

As a result, the `set-context` tool was **removed** from the server. The files `src/tools/set-context.js` and `tests/tools/set-context.test.js` have been deleted.

## Replacement

Instead, a `delete-context` tool was implemented (see `tool-delete-context` change) using the confirmed `DELETE /context/{scope}/{id}/{var_name}` endpoint.

## What Was Originally Planned

- ~~Add `set-context` MCP tool that writes a value to a node, flow, or global context scope~~

## Impact

- ~~New file: `src/tools/set-context.js`~~ (deleted)
- ~~New test file: `tests/tools/set-context.test.js`~~ (deleted)
- `src/server.js`: `set-context` tool registration removed, `delete-context` tool registration added
