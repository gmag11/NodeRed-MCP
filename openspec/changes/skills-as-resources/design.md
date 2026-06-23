## Context

Currently `src/server.js` registers skills three ways after loading them via `src/skills/loader.js`:
1. **MCP Prompts** — `server.prompt(skillName, ...)` for each skill
2. **MCP Resources** — `server.resource(skillName, 'nodered://skills/...', ...)` for each skill
3. **MCP Tools** — `list-skills` (discovery) and `get-skill` (retrieval by name)

The skills loader (`src/skills/loader.js`) reads `.github/skills/*/SKILL.md` files and returns a `Map<string, {name, description, content, path}>`. This module requires no changes.

The change is scoped entirely to `src/server.js` lines ~884–980, which contain the skills integration block.

## Goals / Non-Goals

**Goals:**
- Remove redundant skill exposure mechanisms (prompts, get-skill tool)
- Keep MCP Resources as the single content delivery mechanism
- Keep `list-skills` tool for resource URI discovery
- Update `list-skills` description to reference resources instead of `get-skill`
- Keep backward compatibility of `list-skills` response shape

**Non-Goals:**
- Changing the skill loader or SKILL.md format
- Adding new skills or modifying skill content
- Changing resource URI scheme (`nodered://skills/{name}` stays)
- Adding pagination or filtering to `list-skills`
- Modifying any other MCP tools

## Decisions

### Decision 1: Resources over Prompts
**Choice**: Keep MCP Resources, remove MCP Prompts for skills.

**Rationale**: Resources are purpose-built for content retrieval with structured URIs and mime types. Prompts are designed for templated messages and user-facing interactions — skills are reference documentation, not conversation templates. Having both creates unnecessary duplication.

**Alternatives considered**:
- Keep prompts only → Resources provide better URI-based access and mime type metadata
- Keep both → Adds maintenance burden and bloats the API surface with no added value

### Decision 2: Remove get-skill tool
**Choice**: Remove the `get-skill` tool entirely.

**Rationale**: With resources, clients can directly read `nodered://skills/{name}`. The `get-skill` tool duplicates this functionality. The `list-skills` tool provides the discovery layer — clients iterate the list and read the resources they need.

**Alternatives considered**:
- Keep get-skill as a convenience → Redundant with resource reads; MCP clients that support resources don't need it
- Keep get-skill, remove resources → Resources are a better fit for content; tools are for actions

### Decision 3: Keep list-skills as a tool
**Choice**: Keep `list-skills` as an MCP tool (not a resource).

**Rationale**: `list-skills` is a discovery operation — it queries the loaded skill set and returns a dynamic list. Resources are for static/semi-static content. The tool describes available resources, which is a natural pattern.

### Decision 4: list-skills output adds resource URI
**Choice**: Add a `uri` field to each entry in `list-skills` output.

**Rationale**: The LLM needs to know the resource URI to read a skill. Adding `uri: "nodered://skills/{name}"` to each entry makes discovery → retrieval a one-step flow.

## Risks / Trade-offs

- **[Low] Breaking clients using prompts**: Any MCP client that reads skills via prompts will break → Mitigation: prompts were added as a convenience alongside resources; the primary mechanism was always resources. Update documentation.
- **[Low] Breaking clients using get-skill**: Clients calling `get-skill` directly will get a tool-not-found error → Mitigation: provide clear migration path in changelog (use resource reads instead).
- **[None] Skill content unchanged**: The loader and SKILL.md files are untouched → no risk of content regressions.
