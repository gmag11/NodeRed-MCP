## Why

Node-RED subflows are a key abstraction for reusability — they encapsulate common logic (input → processing → output) into a single palette node that can be instantiated across multiple flow tabs. The MCP server currently treats subflows as an afterthought: `get-flows` mixes them with tabs, there is no dedicated tooling to inspect their internals or manage their lifecycle, and the LLM has no guidance on how to work with them. Adding first-class subflow support unlocks modular flow design via MCP.

## What Changes

- **Modify `get-flows`**: Filter to return only flow tabs (type `"tab"`), excluding subflow definitions. **BREAKING** — callers that relied on `get-flows` to discover subflows must switch to `get-subflows`.
- **New `get-subflows` tool**: List all subflow definitions with enriched metadata (name, input/output counts, internal node types, instance count and locations).
- **New `get-subflow-detail` tool**: Deep inspection of a single subflow — definition, internal nodes, instance references, and a Mermaid diagram of the internal flow.
- **New `create-subflow-instance` tool**: Place an instance of an existing subflow into a flow tab, with auto-sized output wires and env variable support.
- **New `export-subflow` tool**: Export a subflow definition, its internal nodes, and referenced config nodes as a standalone JSON array (compatible with `import-flow`).
- **New `create-subflow` tool**: Create an empty subflow definition (container) ready to be populated with internal nodes via existing `create-node` + `connect-nodes` tools.
- **New `update-subflow` tool**: Update subflow metadata (name, info, category, color, icon) and port definitions (`in`/`out` arrays).
- **New `delete-subflow` tool**: Remove a subflow definition, its internal nodes, and (optionally) all its instances, returning `previousState` for undo support.
- **New `nodered-subflows` skill**: LLM guidance covering subflow vocabulary, discovery, creation from scratch, instantiation, editing, export/import, deletion, common patterns, and limitations.

## Capabilities

### New Capabilities

- `tool-get-subflows`: MCP tool that lists subflow definitions with enriched summary (ports, internals, instances).
- `tool-get-subflow-detail`: MCP tool that returns full subflow definition, internal nodes, instances, and internal Mermaid diagram.
- `tool-create-subflow-instance`: MCP tool to instantiate a subflow inside a flow tab.
- `tool-export-subflow`: MCP tool to export a subflow definition + internal nodes + config nodes as JSON.
- `tool-create-subflow`: MCP tool to create a new empty subflow definition.
- `tool-update-subflow`: MCP tool to update subflow metadata and port definitions.
- `tool-delete-subflow`: MCP tool to delete a subflow definition, its internals, and its instances.
- `skill-nodered-subflows`: Skill document teaching the LLM how to work with subflows via MCP tools.

### Modified Capabilities

- `tool-get-flows`: Requirement change — the tool SHALL only return flow tabs (`type: "tab"`). Subflow definitions are excluded and must be queried via `get-subflows`.

## Impact

- **Source files**: New tool modules in `src/tools/` (7 files), new skill in `.github/skills/`.
- **`src/server.js`**: Register 7 new tools + update `get-flows` description.
- **`src/tools/get-flows.js`**: One-line filter change (`type === 'tab'` instead of `type === 'tab' || type === 'subflow'`).
- **Tests**: New test files in `tests/tools/` for each new tool.
- **Specs**: New spec files in `openspec/specs/` for each new capability + delta spec for `tool-get-flows`.
- **No API changes**: All tools use the existing `GET /flows` + `POST /flows` (deploy) endpoints. No new Node-RED Admin API endpoints are needed.
- **Skills**: New `.github/skills/nodered-subflows/SKILL.md` with YAML frontmatter listing the new tools.
