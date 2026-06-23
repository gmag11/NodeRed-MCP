## Why

The Node-RED MCP server has no formal evaluations to verify that an LLM can use it effectively to solve complex real-world tasks. The MCP Server Development Guide mandates a dedicated Phase 4: create 10 evaluation questions with verifiable answers. Without this, there is no objective quality metric and no way to detect regressions in server usability.

## What Changes

- Create `evaluations.xml` at the project root with 10 QA pairs requiring multiple chained tool calls
- Each QA pair must test realistic Node-RED flow construction scenarios
- Evaluations must be read-only or use ephemeral flows that are cleaned up afterward
- Add an `npm run evaluate` script that runs the evaluations against a Node-RED instance
- Document the evaluation process in `docs/evaluation-guide.md`

## Capabilities

### New Capabilities
- `mcp-evaluations`: 10 complex evaluation questions with verifiable answers covering the complete flow construction cycle (create-flow, create-node, connect-nodes, deploy, inject-message, read-debug-messages, get-flow-nodes, get-flow-diagram)

### Modified Capabilities
<!-- None — this is a new capability with no requirement changes to existing specs -->

## Impact

- **New file**: `evaluations.xml` — 10 QA pairs with questions and answers
- **New script**: `scripts/evaluate.js` — runs evaluations against the MCP server
- **New documentation**: `docs/evaluation-guide.md` — guide for creating and running evaluations
- **package.json**: new `evaluate` script and possible dev dependency for the runner
- No impact on existing tools or the MCP server API
