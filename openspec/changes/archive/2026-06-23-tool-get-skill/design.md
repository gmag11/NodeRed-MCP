## Context

The MCP server currently loads skills via `loadSkills()` and exposes them exclusively as MCP resources (`nodered://skills/{name}`). Some MCP clients (Cursor, continue.dev, etc.) do not support the Resources capability, leaving them unable to access skill content. The `list-skills` tool already exists and returns `name`, `description`, and `uri` for each skill, but the uri is only usable by clients that support resource reads.

The skill data is already loaded in memory as a `Map<string, { name, description, content, path }>` in `src/server.js`. Adding a tool to retrieve skill content from this Map is straightforward — the data is there, it just needs a tool-level access path.

## Goals / Non-Goals

**Goals:**
- Add a `get-skill` MCP tool that accepts a `name` parameter and returns the full skill content (YAML frontmatter + Markdown body)
- Update the `list-skills` tool description to direct clients to `get-skill` alongside resource URIs
- Handle missing skill names gracefully with a clear error message listing available skills

**Non-Goals:**
- Changing the skill loader or resource registration (resources stay for clients that support them)
- Adding filtering, search, or category-based retrieval
- Changing the data model of the skills Map

## Decisions

**1. Tool name: `get-skill`**

Matches the original tool name from the initial skills integration (before it was replaced by resources). Consistent with the `list-skills` naming pattern.

**2. Single required parameter: `name` (string)**

The skill name is the same key used for resources (`nodered://skills/{name}`) and returned by `list-skills`. Users call `list-skills` first to discover names, then pass the chosen name to `get-skill`. This is the simplest possible API — no ambiguity, no optional params.

**3. Return full Markdown including frontmatter**

Return `skill.content` (which includes the raw Markdown body after YAML parsing by gray-matter) plus frontmatter metadata. This gives the LLM the complete skill content. Structured as `{ name, description, content }` in the response JSON.

**4. Not-found behavior: error message with available list**

When the requested skill name doesn't exist, return a descriptive error that lists all available names (same pattern as the original `get-skill` tool). This aids discovery without requiring a separate `list-skills` call.

**5. Tool description references both resources and tool**

The description tells clients that if they support resources, they should use `nodered://skills/{name}`; otherwise, use `get-skill`. This is a graceful degradation pattern.

## Risks / Trade-offs

- **Dual path maintenance**: Both resources and tool must be kept in sync if the skill model changes. Mitigation: both paths read from the same `skills` Map, so they're inherently consistent.
- **Tool output size**: Some skills are large Markdown files. The MCP tool response is a single text block, so no fragmentation issues. If size becomes a concern, no changes needed — MCP handles large text content.
