## Why

In Node-RED, every node has an `info` field (Description) that displays descriptive text in the editor. The LLM can read this field via `get-node-detail` and modify it via `update-node` with `properties: { info: "..." }`. However, the current documentation (MCP skills and tool descriptions) does not mention this property, so the LLM is unaware that it can add or modify node descriptions. This prevents the assistant from offering this functionality even though the tools already support it.

## What Changes

- **Skill `nodered-node-reference`**: Add `info` as a common property available on **all** node types (not just `comment`), with a clear note that it is the "Description" field from the Node-RED editor.
- **Tool description `update-node`** in `src/server.js`: Mention `info` alongside `name` as a standard editable property.
- **Tool description `get-node-detail`** in `src/server.js`: Note that the result includes the `info` field (node description).
- **Skill `nodered-flow-builder`** (optional): Include a pattern or note on how to add descriptions to nodes when creating or modifying them.

No code changes or new tools are needed. All support already exists in the Node-RED API layer and the current MCP tools (`update-node`, `get-node-detail`, `create-node`).

## Capabilities

### New Capabilities
- `node-description-docs`: Document the `info` field as the node "Description" (the label shown in the Node-RED editor UI). When a user says "add a description to this node", they mean setting the `info` property. Covers how LLMs discover and use this field via existing tools.

### Modified Capabilities
*(None — no spec-level requirement changes)*

## Impact

- **Files affected**:
  - `.github/skills/nodered-node-reference/SKILL.md` — update `info` property documentation
  - `src/server.js` — update `update-node` (and optionally `get-node-detail`) tool descriptions
- **No changes to**: tool code, API schemas, tests, or dependencies
- **No breaking changes**
