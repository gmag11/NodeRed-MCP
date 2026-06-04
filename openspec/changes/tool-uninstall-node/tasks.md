## 1. Tool Handler Implementation

- [ ] 1.1 Create `src/tools/uninstall-node.js` with `handleUninstallNode(client, params)` function
- [ ] 1.2 Implement `DELETE /nodes/:module` call via `client.request('DELETE', '/nodes/' + params.module, null)`
- [ ] 1.3 Return confirmation object on 204: `{ uninstalled: true, module: params.module }`
- [ ] 1.4 Propagate Node-RED API errors (404 module not found) with descriptive messages

## 2. Server Registration

- [ ] 2.1 Import `handleUninstallNode` in `src/server.js`
- [ ] 2.2 Register `uninstall-node` tool with Zod schema: `z.object({ module: z.string().describe('module identifier to uninstall, as shown in get-palette-nodes, e.g. "node-red-node-suncalc"') })`
- [ ] 2.3 Add descriptive tool description explaining DELETE /nodes/:module, counterpart to install-node, and warning about flow impact

## 3. Unit Tests

- [ ] 3.1 Create `tests/tools/uninstall-node.test.js` following existing test patterns (vitest)
- [ ] 3.2 Test: successful 204 response returns `{ uninstalled: true, module: "..." }`
- [ ] 3.3 Test: module not found (404) error propagation
- [ ] 3.4 Test: parameter validation (missing `module` handled by Zod)

## 4. Validation

- [ ] 4.1 Run `npm test` and verify all tests pass
- [ ] 4.2 Verify tool appears in MCP tool listing
- [ ] 4.3 Manual smoke test against a running Node-RED instance (optional, if available)
