## 1. Skill loader: add category support

- [ ] 1.1 Update `loadSkills()` in `src/skills/loader.js` to parse `category` from YAML frontmatter
- [ ] 1.2 Add directory-name fallback: if no `category` in frontmatter, infer from parent directory name (e.g., `.github/skills/nodered-patterns/` → `nodered-patterns`)
- [ ] 1.3 Add `useCase` field to loaded skill objects, derived from frontmatter `description`

## 2. Update list-skills handler

- [ ] 2.1 Rewrite `list-skills` handler in `src/server.js` to group skills by category
- [ ] 2.2 Add `structuredContent` to `list-skills` response with shape `{ categories: [{ name, skills: [{ name, description, uri, useCase }] }] }`
- [ ] 2.3 Add a rich Markdown table to text content, grouped by category with use-case hints
- [ ] 2.4 Add output schema for `list-skills` (currently has none) using Zod

## 3. Optional: enrich SKILL.md frontmatter

- [ ] 3.1 Review existing SKILL.md files and add explicit `category:` where the directory name is not descriptive enough
- [ ] 3.2 Example: add `category: dashboard` to `skill-flowfuse-dashboard/SKILL.md`

## 4. Verify

- [ ] 4.1 Run existing tests: `npm test` — tests in `tests/skills/list-skills.test.js` and `tests/skills/get-skill.test.js` must pass
- [ ] 4.2 Update test expectations if tests check exact output shape
- [ ] 4.3 Verify `structuredContent` is present and correctly shaped in `list-skills` output
