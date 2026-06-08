## Why

The `refactor-tool-architecture` change exported `*Definition` objects from all 38 tool modules, but these definitions only contain `name` and `handler` — they lack MCP protocol metadata (`annotations` and `outputSchema`) that was added per-tool in `server.js` during the `enrich-tool-metadata` change. Without this metadata in the definition objects, a registry loop in `server.js` cannot replace the ~38 individual `server.tool()` calls, leaving the architecture half-refactored.

## What Changes

- **Enrich all 38 tool definition exports** with `annotations` and `outputSchema` fields imported from shared constants and schemas
- **Refactor `src/server.js`** to import the enriched definitions and register tools via a single registry loop instead of individual `server.tool()` calls
- **Move annotation constants** from `server.js` into `src/tools/constants.js` so tool modules can import them
- **Remove ~200 lines of duplicated tool registration code** from `server.js`

## Capabilities

### New Capabilities

- `tool-definition-metadata`: Each tool module exports a complete self-contained definition (name, description, inputSchema, annotations, outputSchema, handler) that can be consumed by a registry loop

### Modified Capabilities

<!-- None: the refactoring of server.js registration is an implementation detail, not a spec-level behavior change. Tools remain identically registered. -->

## Impact

- **All 38 tool modules** in `src/tools/`: each gains imports for annotation constants and output schemas, and the definition export gains `annotations` + `outputSchema` fields
- **`src/server.js`**: ~200 lines of individual `server.tool()` calls replaced by ~50 lines of definition imports + registry loop
- **`src/tools/constants.js`**: gains annotation constant definitions (moved from `server.js`)
- **`src/schemas/responses.js`**: already has all needed output schemas (no changes needed)
- **Zero behavioral change**: tool names, descriptions, input schemas, annotations, and output schemas remain identical — only the registration mechanism changes
