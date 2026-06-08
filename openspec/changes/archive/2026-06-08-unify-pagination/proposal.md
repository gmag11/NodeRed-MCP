# Proposal: unify-pagination

## What

Standardize all paginated tools to use a single consistent pagination pattern: `offset` (0-based) + `limit` (1-200, default 50).

## Why

Currently, the codebase has two different pagination conventions:

| Tool | Pattern | Parameter names |
|---|---|---|
| `get-flow-nodes` | offset/limit | `offset` (0-based), `limit` |
| `get-flow-diagram` | offset/limit | `offset` (0-based), `limit` |
| `get-config-nodes` | offset/limit | `offset` (0-based), `limit` |
| `get-palette-nodes` | **page/pageSize** | `page` (1-based), `pageSize` |

The inconsistency forces the LLM to remember two different conventions, increasing cognitive load and the chance of errors. `offset/limit` is the more standard pattern in REST APIs and is already used by the majority of tools.

## Scope

- `get-palette-nodes` tool: change `page` → `offset`, `pageSize` → `limit`
- Update the tool handler in `src/tools/get-palette-nodes.js`
- Update the Zod input schema in `src/server.js`
- Update the tool description text in `src/server.js`
- Update tests in `tests/tools/get-palette-nodes.test.js`

## Non-goals

- Changing the Node-RED Admin API pagination (that's a separate endpoint concern)
- Adding pagination to tools that don't currently support it
