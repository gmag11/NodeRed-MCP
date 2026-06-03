## Why

When wiring nodes with multiple outputs (e.g., Switch, Function with multiple returns, Subflows), the AI must issue one `connect-nodes` or `disconnect-nodes` call per output port per target, making multi-output wiring unnecessarily verbose and slow.

## What Changes

- `connect-nodes` will accept an optional `connections` array parameter, enabling multiple output-port→target pairs to be applied in a single call.
- `disconnect-nodes` will accept an optional `connections` array parameter for batch removal, and an optional `clearPort` boolean to remove all wires from a given output port without specifying individual targets.
- Single-connection behavior (existing `fromNodeId`, `outputPort`, `toNodeId` parameters) is preserved — fully backwards-compatible.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `tool-wire-nodes`: Extend both `connect-nodes` and `disconnect-nodes` to support batch multi-output wiring in a single call.

## Impact

- `src/tools/connect-nodes.js` — extend `applyConnect` / `handleConnectNodes` for batch mode
- `src/tools/disconnect-nodes.js` — extend `applyDisconnect` / `handleDisconnectNodes` for batch mode and clear-port
- `src/server.js` — update tool schemas and descriptions for both tools
- `tests/tools/connect-nodes.test.js` and `tests/tools/disconnect-nodes.test.js` — new test cases
- `openspec/specs/tool-wire-nodes/spec.md` — updated requirements and scenarios
