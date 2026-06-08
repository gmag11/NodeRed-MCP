# Proposal: refactor-tool-architecture

## What

Extract tool definitions (Zod schemas + descriptions) from the monolithic `src/server.js` into individual tool modules, and centralize response/error formatting through shared utility functions.

## Why

Currently, `src/server.js` is ~860 lines with 38 inline tool registrations. Each registration contains:
- A long description string (10-30 lines)
- A Zod input schema object (5-15 lines)
- An async handler wrapper (1 line)

This creates several problems:
1. **Poor maintainability**: Editing a tool requires navigating an 860-line file
2. **DRY violations**: The "⚠️ STAGING: Changes are NOT live until you call `deploy`" message is repeated in ~15 description strings
3. **Inconsistent response format**: Each handler manually constructs `{ content: [{ type: 'text', text: JSON.stringify(...) }] }` 
4. **No single source of truth**: Tool name, description, schema, and handler are separated from the handler implementation

## Scope

- Extract each tool's Zod schema + description into the tool's handler module
- Create `src/tools/response-utils.js` with `formatSuccess(data)` and `formatError(message)` helpers
- Refactor `src/server.js` to import tool definitions and register them in a loop or helper function
- Update all handlers to use the centralized response helpers

## Non-goals

- Changing tool behavior
- Changing the staging store or client
- Moving to a plugin-based architecture (out of scope)
- TypeScript migration
