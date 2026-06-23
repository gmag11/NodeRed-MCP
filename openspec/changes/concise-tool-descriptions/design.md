## Context

`src/server.js` registers ~40 MCP tools via `server.tool()`. Each call includes a string description built with `+` concatenation. Currently, 15+ tools have descriptions of 5–8 lines because they embed:

- Skill resource references (`nodered://skills/nodered-flow-builder`)
- Explicit `list-skills` instructions
- Detailed staging/deploy explanations
- BUILD WORKFLOW / LAYOUT guidance that belongs in skills, not tool descriptions

These long descriptions consume LLM context and make the tool list harder to scan. The same cross-reference information is already discoverable via `list-skills`.

## Goals / Non-Goals

**Goals:**
- Reduce ALL tool descriptions to 2–3 lines maximum
- Remove inline `nodered://skills/…` URIs and `list-skills` references
- Standardize staging-related boilerplate into a consistent suffix
- Keep the change purely textual (no logic changes)

**Non-Goals:**
- Do NOT change Zod `.describe()` strings on parameters (separate change)
- Do NOT change tool names, parameter shapes, or return types
- Do NOT remove the Staging/Deploy concept from descriptions (just shorten)
- Do NOT restructure how tools are registered (separate change: DRY registration)

## Decisions

### Decision 1: Remove skill references, rely on `list-skills`

**Rationale**: The `list-skills` tool already provides skill discovery. Repeating skill URIs in every tool description is redundant and wastes context. Agents are expected to call `list-skills` once to discover available guides.

**Alternative considered**: Keep a single reference to `list-skills` as suffix. Rejected — adds a line to every description without meaningful value; agents already know about `list-skills` from the `get-skill` description.

### Decision 2: Use "(staged — deploy to apply)" as standard suffix

**Rationale**: This 4-word suffix conveys the staging model without repeating the full explanation. The `deploy` tool description provides the details.

**Alternative considered**: Remove staging mention entirely. Rejected — the staging model is a core design concept unique to this server and agents need the reminder.

### Decision 3: Target 2-3 lines, not a strict character limit

**Rationale**: Some tools genuinely need more explanation than others. A hard character limit would force awkward truncation. The guideline is "2-3 logical lines" with common sense.

## Risks / Trade-offs

- **[Risk] Agents may not discover skills** → Mitigation: `get-skill` and `list-skills` descriptions already explain discovery. No change needed there.
- **[Risk] Some nuance lost in shortened descriptions** → Mitigation: The spec, design, and skills provide full detail. Tool descriptions are summaries, not documentation.
