## Context

This MCP server exposes tools that map 1:1 to Node-RED's internal data model. However, Node-RED stores three entity types in a single flat `flows` array: flow tabs (`type: "tab"`), subflow definitions (`type: "subflow"`), and subflow instances (`type: "subflow:<uuid>"`). The tool naming (`update-node` vs `update-subflow`) creates ambiguity: `update-subflow` only works on definitions, but its name suggests it covers all subflow-related editing.

The current code is functionally correct — `update-node` already works on subflow instances because it searches by `id` without filtering by `type`. The problem is purely descriptive: tool descriptions and error messages don't guide LLM agents to the right tool.

## Goals / Non-Goals

**Goals:**
- Make `update-node` description explicitly mention subflow instance support
- Make `update-subflow` description clearly state it only edits definitions, with redirect to `update-node` for instances
- Make `update-subflow` error message detect type mismatch and suggest `update-node`
- Make `create-subflow-instance` description mention `update-node` for post-creation edits

**Non-Goals:**
- No new `update-subflow-instance` tool (unnecessary — `update-node` already works)
- No type-change guard in `update-node` (low priority, separate change)
- No structural changes to the staging store or API layer
- No changes to how subflow definitions or instances are stored

## Decisions

### Decision 1: Improve descriptions inline rather than adding a new tool

**Rationale**: `update-node` already handles subflow instances correctly. Adding `update-subflow-instance` would create tool sprawl without new functionality. Better to fix the naming guidance.

**Alternative considered**: Create `update-subflow-instance` as a thin wrapper around `update-node`. Rejected — adds maintenance burden with zero functional gain.

### Decision 2: Detect type mismatch in `update-subflow` by scanning the flows array

**Rationale**: When `update-subflow` receives an ID that matches a node with `type` starting with `"subflow:"`, it can produce a helpful error instead of the generic "not found". The scan is O(n) but flows arrays are typically small (<1000 nodes).

**Alternative considered**: Check via separate API call. Rejected — adds latency and the flows array is already in memory via staging store.

### Decision 3: Modify tool descriptions in `server.js` registration, not just JSDoc

**Rationale**: MCP clients read tool descriptions from the server's `tools/list` response, which comes from the Zod schema definitions in `server.js` (or equivalent registration point). JSDoc in tool files is secondary. Both should be updated for consistency.

## Risks / Trade-offs

- **Risk**: Changing tool descriptions might break tests that assert on exact description strings → **Mitigation**: Check existing tests before modifying; update test assertions if needed
- **Risk**: The type-mismatch scan in `update-subflow` adds a linear search → **Mitigation**: This is the same O(n) cost as the existing `findIndex` call; the extra pass is negligible

## Migration Plan

1. Edit tool description strings in `server.js` (tool registration)
2. Edit JSDoc comments in `src/tools/update-node.js` and `src/tools/update-subflow.js`
3. Add type-mismatch detection in `src/tools/update-subflow.js` handler
4. Run existing tests to catch description-string assertions
5. Redeploy MCP server
