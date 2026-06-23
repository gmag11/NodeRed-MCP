## Context

Skills are loaded from `.github/skills/*/SKILL.md` by `src/skills/loader.js`. Each skill has `name`, `description`, `content`, and `path`. The `list-skills` tool in `server.js` returns a flat array via `content: [{ type: 'text', text: JSON.stringify(skillList) }]` with no `structuredContent`. Skills are already organized by directory, but this grouping is not surfaced.

The existing `skill-resources` spec under `openspec/specs/skill-resources/` defines the skill loading contract but does not specify categories.

## Goals / Non-Goals

**Goals:**
- Add `category` field to loaded skills (from YAML frontmatter or inferred from directory name)
- Return `structuredContent` from `list-skills` with skills grouped by category
- Add `useCase` hints to help agents select the right skill
- Output a richer Markdown table in text content

**Non-Goals:**
- Do NOT reorganize the `.github/skills/` directory structure
- Do NOT change `get-skill` behavior beyond adding `category` to metadata
- Do NOT add new npm dependencies (use existing Zod for output schema)

## Decisions

### Decision 1: Category from frontmatter first, directory fallback

**Rationale**: Existing skills don't have `category` in frontmatter. Adding it is optional. The directory name (`nodered-patterns`, `nodered-fundamentals`) is a reliable fallback that requires zero changes to existing SKILL.md files.

**Alternative considered**: Require `category` in every SKILL.md. Rejected — increases migration effort without proportional benefit.

### Decision 2: structuredContent shape: `{ categories: [...] }`

**Rationale**: A grouped structure lets agents find skills by category without scanning the full flat list. Each category contains its skills as a nested array.

**Alternative considered**: Flat array with `category` field on each entry. Rejected — grouping by category in the structure itself is more useful for LLM consumption.

### Decision 3: Derive `useCase` from existing `description` field

**Rationale**: The frontmatter `description` already describes the skill's purpose. Using it as `useCase` avoids adding a new mandatory field while still providing the hint.

**Alternative considered**: New `useCase` field in frontmatter. Rejected — adds maintenance burden for skill authors.

## Risks / Trade-offs

- **[Risk] Category inference from directory name may be inconsistent** → Mitigation: Document the convention; skill authors can override with explicit `category` in frontmatter.
- **[Risk] structuredContent shape change may confuse existing clients** → Mitigation: The text content shape is unchanged; structuredContent is additive. No breaking change.

## Migration Plan

1. Update `src/skills/loader.js` to parse `category` from frontmatter with directory fallback
2. Update `list-skills` handler in `src/server.js` to group by category and return `structuredContent`
3. Optionally add `category: ...` to SKILL.md frontmatter files for explicit categorization
4. Run `npm test` to verify
