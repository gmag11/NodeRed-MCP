## Context

The Node-RED MCP Server exposes tools to read (`get-node-detail`) and modify (`update-node`, `create-node`) properties on any node. Node-RED internally stores a node's description in the `info` field — the same field used by flow tabs for their description. This field is a universal property that any node can have.

Current state:
- `get-node-detail` already returns the `info` field if the node has one (it's part of the full node object).
- `update-node` already allows modifying `info` via `properties: { info: "new description" }`.
- `create-node` already allows setting `info` when creating a node via `properties: { info: "description" }`.
- The `nodered-node-reference` skill only documents `info` for the `comment` node type, not as a universal property.
- The tool descriptions in `server.js` do not mention `info`.

No changes to tool logic or the Node-RED API are needed. This is documentation only.

## Goals / Non-Goals

**Goals:**
- The LLM knows the `info` field (Description) exists on all Node-RED nodes.
- The LLM knows how to read a node's description (`get-node-detail`).
- The LLM knows how to set or modify a node's description (`update-node` with `properties: { info: "..." }`).
- The LLM knows how to set the description when creating a node (`create-node` with `properties: { info: "..." }`).

**Non-Goals:**
- No new MCP tools are created.
- No existing tool logic is modified.
- No tests or formal specs are modified (no behavioral changes).

## Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Where to document `info` | Skill `nodered-node-reference` (common properties section) | Only in tool descriptions | The skill is the primary knowledge source for the LLM about node types; tool descriptions are secondary. |
| Scope of change in `nodered-node-reference` | Add a paragraph at the top explaining `info` is a universal field available on all nodes | Document it in every node type table | A single clear statement avoids repetition and is easier to maintain. |
| Tool description updates | Add brief mention in `update-node` and `get-node-detail` | Only update skills | Tool descriptions are the first thing the LLM sees when choosing a tool; having the info there speeds up discovery. |

## Risks / Trade-offs

- **[Low] Information duplication**: The `info` property will be documented both in the skill and in tool descriptions. This is acceptable because each context serves a different purpose (skill = complete reference, tool description = quick reminder).
- **[None] No behavioral changes**: Since this is documentation only, there is no regression risk.
