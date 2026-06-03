## 1. connect-nodes — batch support

- [ ] 1.1 Extend `applyConnect` in `src/tools/connect-nodes.js` to accept optional `connections` array; when provided, loop over entries and apply each idempotently, returning unified `previousWires` / `currentWires`
- [ ] 1.2 Update `handleConnectNodes` to detect batch mode (`connections` present), call extended `applyConnect`, and build the correct response shape (`connections` echoed, no `outputPort`/`toNodeId`)
- [ ] 1.3 Update the `connect-nodes` tool schema in `src/server.js`: add optional `connections` parameter (`z.array(z.object({ outputPort: z.number().int().min(0), toNodeId: z.string() })).optional()`); update description to document batch mode

## 2. disconnect-nodes — clear-port and batch support

- [ ] 2.1 Extend `applyDisconnect` in `src/tools/disconnect-nodes.js` to support `clearPort` mode: when `toNodeId` is absent and `clearPort` is true, empty `wires[outputPort]`; return no-op (no deploy needed) if port is already empty
- [ ] 2.2 Extend `applyDisconnect` to support `connections` batch mode: loop over entries, validate each wire exists before removing any, apply all removals, return unified `previousWires` / `currentWires`
- [ ] 2.3 Update `handleDisconnectNodes` to route to the correct mode (single / clear-port / batch) based on params, and build correct response shape for each mode
- [ ] 2.4 Update the `disconnect-nodes` tool schema in `src/server.js`: make `toNodeId` optional, add `clearPort` boolean (`z.boolean().optional().default(false)`) and `connections` array; update description to document all three modes

## 3. Tests — connect-nodes

- [ ] 3.1 Add unit tests for `applyConnect` batch mode in `tests/tools/connect-nodes.test.js`: multiple ports wired, idempotent entries, target-not-found aborts before any change
- [ ] 3.2 Add integration-style handler tests for batch response shape (`connections` echoed, no `outputPort`/`toNodeId`)

## 4. Tests — disconnect-nodes

- [ ] 4.1 Add unit tests for `applyDisconnect` clear-port mode in `tests/tools/disconnect-nodes.test.js`: clears all targets, no-op on empty port, other ports unaffected
- [ ] 4.2 Add unit tests for `applyDisconnect` batch mode: multiple wires removed, missing wire errors before any change, other ports unaffected
- [ ] 4.3 Add handler tests for clear-port and batch response shapes

## 5. Spec archive update

- [ ] 5.1 Verify all new scenarios in `openspec/changes/connect-nodes-multi-output/specs/tool-wire-nodes/spec.md` are covered by tests before archiving
