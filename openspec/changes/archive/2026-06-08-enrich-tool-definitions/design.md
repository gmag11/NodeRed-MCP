## Context

The `refactor-tool-architecture` change exported `*Definition` objects from all 38 tool modules (e.g., `getFlowsDefinition = { name, handler }`). However, during the parallel `enrich-tool-metadata` change, MCP protocol metadata — `annotations` and `outputSchema` — was added as a 5th argument to each `server.tool()` call in `server.js`. These two changes were applied independently, and the definitions never absorbed the metadata.

**Current state:**
- `server.js`: ~38 individual `server.tool(name, desc, inputSchema, handler, { annotations, outputSchema })` calls (~200 lines)
- Tool modules: `export const xyzDefinition = { name, handler }` — missing `annotations` and `outputSchema`
- Annotation constants: defined inline in `server.js`, not importable by tool modules
- Output schemas: in `src/schemas/responses.js`, already importable

**Target state:**
- `server.js`: single registry loop iterating over imported definitions (~50 lines)
- Tool modules: `export const xyzDefinition = { name, description, inputSchema, annotations, outputSchema, handler }`
- Annotation constants: moved to `src/tools/constants.js`

## Goals / Non-Goals

**Goals:**
- Every tool definition export becomes self-contained with all MCP registration metadata
- `server.js` tool registration collapses from ~38 individual calls to a single loop
- Annotation constants move to a shared location importable by tool modules
- Zero behavioral change: identical tool names, descriptions, schemas, annotations

**Non-Goals:**
- Changing any tool's behavior, input schema, or output format
- Modifying the 8 "edge case" handlers that don't use `formatSuccess` (handled in prior change)
- Structured content support (deferred from `enrich-tool-metadata`)
- Reducing the number of tool modules (one file per tool is intentional)

## Decisions

### Decision 1: Annotation constants live in `src/tools/constants.js`

**Rationale**: Currently defined in `server.js`, but tool modules can't import from `server.js` (circular dependency). `constants.js` already exists for shared description strings and is imported by tool modules. Adding annotations there is the natural home.

**Alternatives considered:**
- `src/schemas/responses.js` — mixes runtime constants with Zod schema definitions; less clean
- Separate `src/tools/annotations.js` — adds a file for 9 constant groups; overkill

### Decision 2: Definition objects include `description` and `inputSchema`

**Rationale**: The original `refactor-tool-architecture` design.md showed definitions with these fields, but the actual implementation kept them minimal (`name` + `handler` only). For a complete registry loop, the definition must carry everything `server.tool()` needs. However, extracting `description` and `inputSchema` from the existing `server.tool()` calls into each tool module is a significant amount of code movement and risks introducing inconsistencies.

**Decision**: For now, add only `annotations` and `outputSchema` to definitions (the metadata that blocks the registry loop). `description` and `inputSchema` remain in `server.js`. The registry loop will look like:

```js
const toolDefinitions = [
  { ...getFlowsDefinition, description: '...', inputSchema: {} },
  // ...
];
```

**Alternative considered**: Moving `description` and `inputSchema` into each definition — cleaner long-term but increases scope and risk. Defer to a follow-up.

### Decision 3: Registry loop passes `staging` and `nodeRedClient` implicitly

**Rationale**: All handlers receive `(staging, params)` or `(staging, nodeRedClient, params)`. The loop wraps each handler to inject these dependencies:

```js
for (const def of toolDefinitions) {
  server.tool(def.name, def.description, def.inputSchema, async (params) => {
    return def.handler(staging, nodeRedClient, params);
  }, { annotations: def.annotations, outputSchema: def.outputSchema });
}
```

This preserves the existing handler signatures without any changes to tool modules.

### Decision 4: Skills tools remain inline in server.js

**Rationale**: `list-skills` and `get-skill` depend on a `skills` Map loaded at startup via `loadSkills()`. Their definitions don't follow the same pattern as other tools. They stay as inline registrations.

## Risks / Trade-offs

- **[Risk] Definition drift**: If someone adds a tool to `server.js` without updating the corresponding definition export, the registry loop won't pick it up → **Mitigation**: The registry loop is the single source of truth; new tools must follow the definition pattern
- **[Risk] Import explosion in tool modules**: Each tool module gains 2-3 new imports (annotation constant, output schema) → **Mitigation**: Imports are localized and the pattern is uniform across all modules
- **[Trade-off] Description/inputSchema duplication**: These remain in both `server.js` (for the registry) and implicitly in the Zod schemas → **Mitigation**: Acceptable for now; a follow-up change can extract them fully

## Open Questions

- Should `description` and `inputSchema` be extracted from `server.js` into tool modules in this change or deferred? **Decision: Deferred** — scope is already 38 files touched for annotations + outputSchema
