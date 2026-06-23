## Context

The Node-RED MCP server has ~40 tools that throw errors in various situations: node not found, flow locked, staging dirty, invalid parameters, version conflicts. Currently, error messages describe the problem but do not guide the agent toward a solution. For example:

```
Error: Node 'abc123' not found
```

An LLM agent sees this and does not know whether to look for the node with another tool, whether the ID is incorrect, or whether the node was deleted. The MCP guide requires that errors include *"specific suggestions and next steps"*.

## Goals / Non-Goals

**Goals:**
- Every `throw new Error(...)` in the code must include a suggestion of which MCP tool to use to resolve the problem
- "Not found" errors must mention specific search tools
- Validation errors must give the expected format
- State errors (staging, locks) must give the exact sequence of steps

**Non-Goals:**
- No error code system or structured error types are created
- Business logic is not modified — only the strings are enriched
- The tool contract is not changed

## Decisions

### Format: inline suggestion at the end of the message
Each error adds a second sentence after the main message, with an actionable suggestion. Format:

```
Error: <problem description>. <Suggestion with tool name and concrete action.>
```

Alternatives considered:
- **Error codes + separate documentation**: too heavy for the scope. The LLM would have to do a second lookup.
- **Structured error object with a `suggestion` field**: would require changing all handlers to return objects instead of throw. Breaks the current pattern.

### Error → suggested tool mapping

| Error category | Suggested tool(s) |
|---|---|
| Node not found | `search-nodes`, `get-flow-nodes` |
| Flow not found | `get-flows` |
| Subflow not found | `get-subflows` |
| Flow locked | explain that it is readonly, suggest `get-flow-nodes` for read-only inspection |
| Staging dirty | `deploy` or `get-staging-status` |
| Version mismatch (409) | `refresh-staging` → re-apply changes → `deploy` |
| Invalid param value | explain expected format + example |
| Ambiguous name | `search-nodes` to find by name and use `nodeId` |
| Mutually exclusive params | explain which to use depending on the case |

### Prioritization by usage frequency
The most common errors for an agent are:
1. Node/flow not found (when wiring or creating nodes)
2. Staging dirty (when trying to inject without deploying)
3. Invalid parameters (when passing wrong values)

These receive the most detailed suggestions.

## Risks / Trade-offs

- **[R] Longer messages consume more tokens** → Mitigation: suggestions are a single concise sentence (15-25 words). The savings in round-trips compensates the cost.
- **[R] If a suggested tool is renamed** → Mitigation: tool names are stable (defined in the MCP SDK as constant strings). If they change, integration tests will detect the inconsistency.
