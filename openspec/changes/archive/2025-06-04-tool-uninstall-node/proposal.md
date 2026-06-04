## Why

Node-RED's Admin API exposes a `DELETE /nodes/:module` endpoint that uninstalls a previously installed node module (npm package) from the runtime. The MCP server already has `install-node` for adding nodes, but no corresponding tool to remove them. This asymmetry forces users to use the Node-RED editor UI or CLI to uninstall nodes, breaking the MCP workflow. Adding `uninstall-node` completes the install/uninstall lifecycle.

## What Changes

- Add a new MCP tool `uninstall-node` that calls `DELETE /nodes/:module` on the Node-RED Admin API to remove a node module by its npm package name
- Add the tool handler at `src/tools/uninstall-node.js`
- Register the tool in `src/server.js` with Zod parameter validation
- Add unit tests at `tests/tools/uninstall-node.test.js`
- Create the corresponding spec file at `openspec/specs/tool-uninstall-node/spec.md`

## Capabilities

### New Capabilities
- `tool-uninstall-node`: Uninstall a Node-RED node package (npm module) by name via the Admin API's DELETE /nodes/:module endpoint

### Modified Capabilities
<!-- None -->

## Impact

- **New file**: `src/tools/uninstall-node.js` — tool handler
- **New file**: `tests/tools/uninstall-node.test.js` — unit tests
- **New spec**: `openspec/specs/tool-uninstall-node/spec.md` — capability spec
- **Modified file**: `src/server.js` — tool registration
- **API surface**: New MCP tool exposed as `uninstall-node`, calling `DELETE /nodes/:module` on the Node-RED Admin API
- **Dependencies**: None new; uses existing `createNodeRedClient` infrastructure
