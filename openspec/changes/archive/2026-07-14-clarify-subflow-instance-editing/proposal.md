## Why

LLM agents using this MCP server cannot reliably edit subflow instances because the tool naming and descriptions are ambiguous. `update-subflow` only works on subflow **definitions** (`type: "subflow"`), not on subflow **instances** (`type: "subflow:<uuid>"`). Agents — especially smaller models — try `update-subflow` on instances, get a misleading "Subflow not found" error, and conclude editing is impossible. Meanwhile, `update-node` works on instances but its description never mentions it.

## What Changes

- Improve `update-node` tool description to explicitly state it works on subflow instances (in addition to regular nodes and subflow definitions)
- Improve `update-subflow` tool description to clarify it ONLY edits subflow definitions (metadata), and redirect agents to `update-node` for instances
- Improve `update-subflow` error message when a `subflow:<uuid>` instance is passed: detect the type mismatch and suggest `update-node` instead of the generic "not found" message
- Optionally add a type-change guard in `update-node` to prevent changing `type` on subflow instances (low priority, guardrail)

## Capabilities

### New Capabilities
- `tool-description-clarity`: Clearer, LLM-friendly tool descriptions that resolve the subflow-definition vs subflow-instance ambiguity

### Modified Capabilities
- `tool-update-subflow`: Better error message that detects type-mismatch (instance passed as definition) and redirects to `update-node`
- `tool-update-node`: Description updated to mention subflow instance support

## Impact

- **Files**: `src/tools/update-node.js` (description + optional type guard), `src/tools/update-subflow.js` (error message)
- **No API changes**, no breaking changes — purely description and error message improvements
- **No new dependencies**
- **Requires redeploy** of the MCP server after changes
