## Why

`list-skills` returns a flat array of `{name, description, uri}` without categorization, structured content, or rich formatting. Skills are already organized into logical groups (fundamentals, patterns, node-reference, dashboards, subflows) by their directory structure under `.github/skills/`, but this grouping is invisible to the LLM. Agents must scan the full flat list to find relevant skills, which wastes context and increases the chance of missing the right skill.

## What Changes

- **Add `category` metadata** to each skill, derived from the existing directory structure or YAML frontmatter.
- **Return `structuredContent`** in `list-skills` — currently it only returns text content.
- **Group skills by category** in the output and expose the categories.
- **Add use-case hints** to help agents quickly identify which skill applies to their current task.

## Capabilities

### New Capabilities

- `skill-categories`: Each skill SHALL declare a `category` field. The `list-skills` tool SHALL return skills grouped by category with `structuredContent`.
- `skill-structured-output`: `list-skills` SHALL return `structuredContent` (in addition to text) so LLM clients can parse the skill list programmatically.

### Modified Capabilities

- `skill-resources`: The existing skill resource definition spec SHALL add a `category` field to the skill metadata contract.

## Impact

- `src/skills/loader.js` — add category parsing from frontmatter or directory name
- `src/server.js` — rewrite `list-skills` handler to group by category and return `structuredContent`
- `.github/skills/*/SKILL.md` — optional: add `category` to YAML frontmatter (can also be inferred from directory)
- No API changes to other tools
- No breaking changes — `list-skills` output shape expands but is backward-compatible
