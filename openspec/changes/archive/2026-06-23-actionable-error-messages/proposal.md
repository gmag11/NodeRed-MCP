## Why

The MCP Server Development Guide requires: *"Error messages should guide agents toward solutions with specific suggestions and next steps."* Currently, many error messages in the server's tools are generic (e.g. `Node '${id}' not found`) without telling the agent which tool to use to resolve the problem. This causes LLMs to spin trying random tools instead of receiving clear guidance toward a solution. Actionable error messages reduce friction and speed up error resolution.

## What Changes

- Enrich ALL error messages (`throw new Error(...)`) in tool handlers and apply functions with next-step suggestions
- Each error must mention at least one MCP tool the agent can use to resolve the problem
- "Not found" errors should suggest search/list tools (search-nodes, get-flow-nodes, get-flows, get-subflows)
- Validation errors should explain the expected format and give examples
- State errors (staging dirty, version mismatch) should indicate the exact sequence of steps to resolve

## Capabilities

### New Capabilities
- `actionable-error-messages`: All error messages in the MCP server include actionable suggestions with specific tool names and concrete next steps

### Modified Capabilities
<!-- None — this is a quality improvement to existing error handling, no requirement changes -->

## Impact

- **`src/staging-store.js`**: lock errors, version mismatch, node/flow not found
- **`src/tools/connect-nodes.js`**: node not found, parent flow lock
- **`src/tools/disconnect-nodes.js`**: node not found
- **`src/tools/create-node.js`**: flow not found, flow lock
- **`src/tools/inject-message.js`**: inject not found, ambiguous name, staging dirty
- **`src/tools/deploy.js`**: invalid deploy type, version mismatch
- **`src/tools/read-debug-messages.js`**: mutually exclusive parameters
- **Remaining `src/tools/`**: ~30 handler files with `throw new Error()`
- No impact on the API or functional behavior — only error strings are enriched
