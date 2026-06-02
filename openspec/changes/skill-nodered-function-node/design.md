## Context

The function node executes JavaScript inside Node-RED's runtime. Its code goes in the `func` property of the node JSON. The execution environment differs from standard Node.js: `require` is restricted, special globals are injected, and return values have specific semantics.

Source: https://nodered.org/docs/user-guide/writing-functions

## Goals / Non-Goals

**Goals:**
- Cover: `msg`, `node`, `context`, `flow`, `global`, `env`, `RED` APIs
- Explain: return semantics (return msg vs null vs array), multiple outputs, async patterns
- Explain: how to set/get context from within function code (vs. MCP `get/set-context`)
- Explain: how to set the `func` property via `create-node`/`update-node`
- Provide code examples for common patterns: transform payload, conditional output, stateful counter, async HTTP

**Non-Goals:**
- Node initialization code (`initialize` tab) — advanced topic
- `done()` and `send()` APIs for async nodes — mentioned but not deep-dived

## Decisions

### Include concrete code examples inline

**Decision**: Unlike other skills that reference external example files, function node code examples are short enough to inline in the SKILL.md.

**Rationale**: Function code is typically 5–20 lines. Keeping examples inline reduces the number of file reads the LLM needs.

### Emphasize the func property in node JSON

**Decision**: Prominently document that function node code goes in `properties.func` when calling `create-node` or `update-node`, and that `outputs` must match the number of array elements in `return`.

**Rationale**: This is the most common source of errors when the LLM creates function nodes.

## Risks / Trade-offs

- [require restrictions] The allowed `require` modules vary by Node-RED configuration. The skill notes this and recommends using only modules that are guaranteed to be available (built-in Node.js modules + installed palette).
