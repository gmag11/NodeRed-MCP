## Context

The MCP server already loads skills via `loadSkills()` and exposes them through three channels: `server.prompt()`, `server.resource()`, and the `get-skill` tool. However, there is no way for the LLM to discover *which* skills are available without trial-and-error — calling `get-skill` with a guessed name and parsing the error message. The skills Map already provides `name` and `description` for each skill, so adding a listing tool is straightforward.

## Goals / Non-Goals

**Goals:**
- Add a `list-skills` MCP tool that returns an array of `{ name, description }` for every available nodered-* skill
- Zero parameters — the tool lists everything, client filters if needed
- Leverage existing `skills` Map (no loader changes)

**Non-Goals:**
- Listing non-nodered-* skills (already filtered out in server.js)
- Filtering by category or keyword (no parameters needed for current use case)
- Changing the `get-skill` tool

## Decisions

**1. Tool vs Resource for listing skills**

Chose **MCP Tool** over MCP Resource.

*Rationale:* The LLM needs model-initiated discovery — "what skills do you have?" before calling `get-skill`. Tools are invoked explicitly by the model. Resources are better for passive data subscription. A `list-skills` tool fits the discovery workflow: `list-skills` → pick a topic → `get-skill`.

*Alternative considered:* A resource like `nodered://skills` returning the list. Rejected because resources are less discoverable for LLM agents — most MCP clients surface tools more prominently than resources.

**2. Return format: array of `{ name, description }`**

Each entry maps directly from the existing `skills` Map entries. No transformation needed.

**3. Registration location: alongside `get-skill` in `src/server.js`**

Both tools operate on the same `skills` Map. Co-locating them keeps the integration block cohesive.

## Risks / Trade-offs

- **Risk:** Adding too many skills makes the `list-skills` response large.
  → **Mitigation:** Skills are small in number (4 currently), and each entry is only name + description. If the list grows beyond ~20, consider pagination in a future iteration.

- **Risk:** Skill descriptions could be stale if SKILL.md files change.
  → **Mitigation:** Skills are loaded once at server startup. A restart picks up changes. This is acceptable — skills change infrequently.
