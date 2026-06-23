## Why

Tool descriptions in `server.js` average 5–8 lines with embedded skill resource references (`nodered://skills/…`) and repeated staging disclaimers. This inflates LLM context consumption, makes tool discovery slower, and duplicates information already available via `list-skills`. Shorter, focused descriptions help agents select the right tool faster.

## What Changes

- **Shorten all tool descriptions to 2–3 lines** — one sentence per concept: what it does, key behavior, and one cross-reference.
- **Remove inline `nodered://skills/…` resource URIs** from descriptions. Agents already discover skills via `list-skills`.
- **Replace repeated staging/deploy boilerplate** with a compact standardized suffix where applicable.
- **Keep parameter `.describe()` strings unchanged** — they already have examples in some cases and are covered by a separate change.

## Capabilities

### New Capabilities

- `concise-tool-descriptions`: All 40+ tool descriptions in `server.js` SHALL be 2–3 lines maximum, with skill cross-references removed in favor of `list-skills` discovery.

### Modified Capabilities

- `mcp-server-core`: The main `server.js` description strings are implementation details of the core server, not spec-level requirement changes — no delta spec needed.

## Impact

- `src/server.js` — ~40 description strings shortened (no logic changes, no API changes)
- No test changes expected (tests validate handler behavior, not description text)
- No breaking changes — tool names, parameters, and return types unchanged
