## Context

The Node-RED MCP server uses Zod to define parameter schemas in ~40 tools. Each parameter has a `.describe()` with explanatory text, but none include concrete examples of valid values. The MCP Server Development Guide explicitly recommends: *"Add examples in field descriptions"* as a best practice to improve tool discoverability by LLM agents.

Currently, an LLM that invokes `create-node` sees:
```
type: z.string().describe('Palette node type (e.g. "function", "debug")')
```

With enriched examples, it would see:
```
type: z.string().describe('Palette node type. Examples: "inject", "function", "debug", "http in", "mqtt in", "change", "switch", "template"')
```

## Goals / Non-Goals

**Goals:**
- Every Zod parameter in the ~40 tools must include at least one concrete example in its `.describe()`
- Examples must use real values from the Node-RED ecosystem (node types, ID formats, typical payloads)
- Maintain backward compatibility — only description strings are modified

**Non-Goals:**
- Zod validation logic is not modified
- No new tools are added and no existing ones are removed
- Output schemas are not changed
- Annotations are not touched

## Decisions

### Example format: inline in `.describe()`
Examples go inline in the `.describe()` string, using the pattern `". Examples: \"val1\", \"val2\""`. Alternatives considered:
- **Zod `.examples`**: not supported natively by Zod as a schema property (only exists in OpenAPI/specs). Rejected because it does not travel in the MCP tool definition.
- **Separate into external documentation**: would require the LLM to consult additional docs. Rejected because the goal is to have examples in the tool definition itself.

### Prioritization: string parameters first
`z.string()` parameters benefit most from examples, since numeric and boolean types are self-explanatory. `z.object({}).passthrough()` also benefits because the LLM needs to know which properties to put.

### Contextual examples, not generic ones
Each example must be realistic for the Node-RED context. For example:
- `type` in create-node → real palette names: `"inject"`, `"function"`, `"debug"`
- `flowId` → explain that it is a UUID of a flow tab
- `deployType` → `"nodes"`, `"flows"`, `"full"` (already in the enum, but not as examples)

## Risks / Trade-offs

- **[R] Increases token count of tool definitions** → Mitigation: examples are short (3-8 values) and the benefit in reduced invocation errors compensates the cost
- **[R] Examples may become outdated when new node types are added** → Mitigation: use the most common and stable types, not an exhaustive list
