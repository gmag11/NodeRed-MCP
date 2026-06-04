## Why

Node-RED's Admin API exposes a `POST /nodes` endpoint that installs new node packages from the npm registry directly into the running runtime — no manual CLI access needed. Node packages are discoverable via the official Node-RED library at https://flows.nodered.org/search?type=node.

The MCP server currently has no tool to invoke this endpoint, forcing users to leave the MCP workflow to install nodes. Adding this tool completes the Node-RED palette management lifecycle: the LLM can search the library catalog, let the user choose a package, and install it — all within a single conversation.

**Typical workflow**: User asks "Install a node that allows building a Telegram bot" → LLM searches https://flows.nodered.org → presents options → user picks one → LLM calls `install-node` with the npm package name.

## What Changes

- Add a new MCP tool `install-node` that calls `POST /nodes` on the Node-RED Admin API to install a node module from npm by its package name (no version qualifiers — the API does not support `@version` syntax per the official docs)
- Add the tool handler at `src/tools/install-node.js`
- Register the tool in `src/server.js` with Zod parameter validation
- Add unit tests at `tests/tools/install-node.test.js`
- Create the corresponding spec file at `openspec/specs/tool-install-node/spec.md`

## Capabilities

### New Capabilities
- `tool-install-node`: Install a new Node-RED node package (npm module) by name via the Admin API's POST /nodes endpoint

### Modified Capabilities
<!-- None -->

## Impact

- **New file**: `src/tools/install-node.js` — tool handler
- **New file**: `tests/tools/install-node.test.js` — unit tests
- **New spec**: `openspec/specs/tool-install-node/spec.md` — capability spec
- **Modified file**: `src/server.js` — tool registration
- **API surface**: New MCP tool exposed as `install-node`, calling `POST /nodes` on the Node-RED Admin API to install npm packages
- **External dependency**: Node-RED library catalog at https://flows.nodered.org (used by LLM for discovery, not called by the tool itself)
- **Dependencies**: None new; uses existing `createNodeRedClient` infrastructure
