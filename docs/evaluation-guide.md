# Node-RED MCP Evaluation Guide

## Overview

The evaluation system verifies that an LLM agent can use the Node-RED MCP server
effectively to build, inspect, debug, and manage Node-RED flows. It consists of:

- **`evaluations.xml`** — 10 QA pairs covering 4 categories
- **`scripts/evaluate.js`** — Runner that executes each question against a live Node-RED instance
- **`npm run evaluate`** — Convenience command to run all evaluations

## Prerequisites

1. A running Node-RED instance (local or Docker)
2. The `NODERED_URL` environment variable set (or `.env` file in project root)
3. Node.js >= 18

The evaluation runner spawns the MCP server as a child process via stdio
transport, which in turn connects to the Node-RED instance using the
configured URL and authentication.

## Running Evaluations

```bash
# Using the npm script (reads NODERED_URL from .env)
npm run evaluate

# Or directly with explicit URL
NODERED_URL=http://localhost:1880 npm run evaluate

# Or run the script directly
node scripts/evaluate.js
```

### Expected Output

```
╔══════════════════════════════════════════════╗
║   Node-RED MCP Evaluation Runner              ║
╚══════════════════════════════════════════════╝

Node-RED URL: http://localhost:1880
Evaluations:  /path/to/evaluations.xml

Loaded 10 evaluation questions.

Starting MCP server (stdio transport)...
Connected to MCP server.

  Q1 (flow-construction)... ✓ PASS
  Q2 (flow-construction)... ✓ PASS
  ...
  Q10 (subflows-config)... ✓ PASS

Cleaning up temporary flows...
Cleanup complete.

═══════════════════════════════════════════
  Total:   10
  Passed:  10  ✓
  Failed:  0
  Rate:    100.0%
═══════════════════════════════════════════
```

The script exits with code 0 when all questions pass, and code 1 if any fail.

## Question Categories

The 10 evaluation questions are distributed across 4 categories:

### 1. Flow Construction (Q1–Q3)
Tests the complete flow construction cycle: creating flows, adding nodes of
different types, wiring them together, deploying, injecting messages, and
reading debug output.

| ID | Scenario | Tools Used |
|----|----------|------------|
| Q1 | inject → function → debug (payload transformation) | create-flow, create-node, connect-nodes, deploy, inject-message, read-debug-messages |
| Q2 | inject → change → debug (msg.topic modification) | create-flow, create-node, connect-nodes, deploy, inject-message, read-debug-messages |
| Q3 | inject → switch → two debug nodes (conditional routing) | create-flow, create-node, connect-nodes, deploy, inject-message, read-debug-messages, update-node |

### 2. Flow Inspection (Q4–Q6)
Tests read-only inspection tools for understanding existing flows and their
structure.

| ID | Scenario | Tools Used |
|----|----------|------------|
| Q4 | Count tab-type nodes in a flow | get-flows, get-flow-nodes |
| Q5 | Generate and validate Mermaid diagram | get-flows, get-flow-diagram |
| Q6 | Verify tab count consistency across flows | get-flows, get-flow-nodes |

### 3. Debug & Diagnostics (Q7–Q8)
Tests message injection and debug output filtering capabilities.

| ID | Scenario | Tools Used |
|----|----------|------------|
| Q7 | Inject message and verify payload in debug output | create-flow, create-node, connect-nodes, deploy, inject-message, read-debug-messages |
| Q8 | Keyword filtering on debug messages | create-flow, create-node, connect-nodes, deploy, inject-message, update-node, read-debug-messages |

### 4. Subflows & Config (Q9–Q10)
Tests subflow inspection and configuration node management tools.

| ID | Scenario | Tools Used |
|----|----------|------------|
| Q9 | Inspect subflow internal nodes | get-subflows, get-subflow-detail |
| Q10 | Count config nodes by type | get-config-nodes |

## Cleanup Contract

**Temporary flows are automatically deleted** after all evaluations complete.

Questions that create flows (Q1–Q3, Q7–Q8) use flow names prefixed with
`eval-q` (e.g., `eval-q1-flow`). The cleanup phase at the end of the
evaluation run:

1. Lists all flows via `get-flows`
2. Deletes any flow whose label starts with `eval-q`
3. Deploys the deletions

If the evaluation script crashes mid-run, you can manually delete leftover
`eval-q*` flows from the Node-RED editor.

## Creating New Questions

To add a new evaluation question:

### 1. Add the QA pair to `evaluations.xml`

```xml
<qa_pair id="Q11" category="flow-construction">
  <question>
    Describe what the question tests in natural language.
    This is for human consumption and LLM understanding.
  </question>
  <answer>expected-value</answer>
</qa_pair>
```

- `id`: Unique identifier (Q1–Q10 are reserved)
- `category`: One of `flow-construction`, `flow-inspection`, `debug-diagnostics`, `subflows-config`
- `question`: Human-readable description
- `answer`: Expected result (exact string match)

### 2. Add the evaluation function to `scripts/evaluate.js`

```javascript
async function evalQ11(client) {
  // Call MCP tools via callTool(client, 'tool-name', { args })
  const result = await callTool(client, 'some-tool', { param: 'value' });
  
  // Return actual value and expected value
  return { actual: String(result.someField), expected: 'expected-value' };
}
```

### 3. Register the function in the QUESTION_MAP

```javascript
const QUESTION_MAP = {
  // ... existing entries
  Q11: { fn: evalQ11, category: 'flow-construction', cleanup: true },
};
```

### Guidelines

- Each question should require **at least 4 distinct tool calls** to answer
- Questions that create flows **must** use the `cleanup: true` flag
- Flow names for cleanup-eligible questions **must** start with `eval-q`
- Answers must be **verifiable by exact string match** or numeric equality
- Read-only questions are preferred when possible (no cleanup needed)

## Interpreting Results

| Status | Meaning |
|--------|---------|
| ✓ PASS | The actual result matched the expected answer |
| ✗ FAIL | The actual result did not match — indicates a bug or regression |
| 💥 ERROR | An exception occurred during evaluation — check the error message |
| ⚠ SKIP | The question could not be evaluated (e.g., no subflows exist) |

A 100% pass rate indicates the MCP server tools are working correctly for all
tested scenarios. Any failure should be investigated before deploying tool
changes.

## Troubleshooting

### "Failed to connect to MCP server"
- Ensure Node-RED is running and accessible at `NODERED_URL`
- Check authentication settings in `.env`
- Verify the MCP server starts correctly: `node index.js --transport=stdio`

### "No debug message found"
- The debug message may not have arrived yet; the script waits 1 second
- Check that the inject node payload is correctly formatted
- Verify the flow is deployed before injecting

### "version_mismatch" errors
- Another client (e.g., Node-RED editor) modified flows concurrently
- Run evaluations against a dedicated/clean Node-RED instance for best results

### Stale `eval-q*` flows remain
- Run `npm run evaluate` again — the cleanup phase runs at the start too
- Or manually delete them from the Node-RED editor
