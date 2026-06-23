## Why

The MCP Server Development Guide requires: *"Add examples in field descriptions"* as part of tool design best practices. Currently, no Zod parameter in the server's ~40 tools includes concrete examples in its `.describe()`. This makes it hard for LLMs to infer the correct format of values, especially for parameters like node IDs, palette type names, or complex object structures. Adding examples reduces the error rate in invocations and improves tool discoverability.

## What Changes

- Enrich ALL `.describe()` of Zod parameters in `src/server.js` and tool definition files with concrete examples
- Each parameter must include at least one representative example in its description
- Examples must use real values from the Node-RED ecosystem (node types, IDs, payloads)
- No tool logic is modified — only descriptions

## Capabilities

### New Capabilities
- `tool-param-examples`: Audit and enrichment of all Zod parameter descriptions in the MCP server tools with concrete, contextual examples

### Modified Capabilities
<!-- None — this is a documentation/metadata improvement, no requirement changes -->

## Impact

- **`src/server.js`**: ~200 lines of `.describe()` updated with examples in the ~40 `server.tool()` registrations
- **Definition files in `src/tools/`**: each `*Definition` export that includes `inputSchema` with Zod
- No impact on the API, tool behavior, or dependencies
- No breaking changes — only description strings are enriched
