## Context

The Node-RED MCP server exposes ~40 tools that let an LLM build, edit, test, and debug flows. The MCP Server Development Guide establishes a mandatory Phase 4: create 10 complex evaluations with verifiable answers that test whether an agent can use the server effectively.

Currently no evaluation mechanism exists. There is no way to:
- Objectively measure whether the server is usable by LLM agents
- Detect regressions after tool changes
- Compare the effectiveness of different prompting strategies

## Goals / Non-Goals

**Goals:**
- Create `evaluations.xml` with 10 QA pairs that test the complete flow construction cycle
- Each question must require a minimum of 4-5 chained tool calls to resolve
- Questions must be either read-only or use ephemeral flows that are cleaned up afterward
- Provide an `npm run evaluate` script that runs the XML against a configurable instance
- Document the process so future contributors can add evaluations

**Non-Goals:**
- Not a unit/integration test suite (that already exists with Vitest)
- Not integrated with CI in this iteration (manual execution only)
- Does not modify any existing MCP server tool

## Decisions

### Format: XML with the standard MCP structure
The XML format defined in the guide (`<evaluation><qa_pair><question>/<answer></qa_pair></evaluation>`) is used because:
- It is the standard documented in the MCP guide
- It is parseable by automated tooling
- It allows verification by exact string comparison

### Runner: simple Node.js script
A Node.js script reads `evaluations.xml`, invokes the MCP server via its tools API (not via transport), and compares responses. Alternatives considered:
- **MCP Inspector**: rejected due to the known bug with `@mcpjam/inspector` v2.18.0
- **Python script**: rejected to keep the stack homogeneous (JS)
- **Bash + curl**: too fragile for 10 complex questions

### Question categories
The 10 questions cover 4 categories to ensure balanced coverage:
1. **Flow construction** (3 questions): create nodes, connect them, deploy
2. **Flow inspection** (3 questions): read existing flows, navigate structure
3. **Debug & diagnostics** (2 questions): inject messages, read debug output
4. **Subflows & config** (2 questions): work with subflows and config nodes

### Ephemeral flows
Questions that modify flows use a temporary flow (`eval-temp`) created and deleted within the same evaluation session. This avoids polluting production flows.

## Risks / Trade-offs

- **[R] Evaluations depend on a running Node-RED instance** → The script validates connectivity before running and emits clear messages if unreachable
- **[R] Answers may vary by Node-RED version** → Questions use stable properties (IDs, node types, counts) not subject to version changes
- **[R] An LLM could "guess" answers without using the tools** → Questions require dynamic values (generated IDs, timestamps, transformed payloads) that cannot be predicted
