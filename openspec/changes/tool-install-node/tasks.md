## 1. Tool Handler Implementation

- [x] 1.1 Create `src/tools/install-node.js` with `handleInstallNode(client, params)` function
- [x] 1.2 Implement `POST /nodes` call via `client.request('POST', '/nodes', { module: params.module })` — API installs from npm registry, plain package name only (no `@version`)
- [x] 1.3 Return the Node Module JSON object directly (`{ name, version, nodes: [...] }`)
- [x] 1.4 Propagate Node-RED API errors (400 bad request, 404 package not found) with descriptive messages

## 2. Server Registration

- [x] 2.1 Import `handleInstallNode` in `src/server.js`
- [x] 2.2 Register `install-node` tool with Zod schema: `z.object({ module: z.string().describe('npm package name to install (plain name, no @version), e.g. node-red-node-suncalc') })`
- [x] 2.3 Add descriptive tool description explaining npm-based install via Node-RED Admin API, library discovery workflow (flows.nodered.org), latency expectations, and restart note

## 3. Unit Tests

- [ ] 3.1 Create `tests/tools/install-node.test.js` following existing test patterns (vitest)
- [ ] 3.2 Test: successful JSON response (200) returns Node Module object with `name`, `version`, `nodes`
- [ ] 3.3 Test: module not found (404) error propagation
- [ ] 3.4 Test: bad request (400) error propagation
- [ ] 3.5 Test: parameter validation (missing `module` handled by Zod)

## 4. Validation

- [ ] 4.1 Run `npm test` and verify all tests pass
- [ ] 4.2 Verify tool appears in MCP tool listing
- [ ] 4.3 Manual smoke test against a running Node-RED instance (optional, if available)
