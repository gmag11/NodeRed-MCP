## 1. SKILL.md

- [ ] 1.1 Create `.github/skills/nodered-flow-architecture/SKILL.md` with YAML frontmatter
- [ ] 1.2 Write "Tab organization" section: one tab per domain/concern; show `create-flow` call with descriptive `label` and `info`; anti-pattern: one giant tab
- [ ] 1.3 Write "Node naming" section: descriptive names via `properties.name`; examples of good vs bad names; note that default names like "function 1" are a code smell
- [ ] 1.4 Write "Flow and node documentation" section: `info` field on flows (via `create-flow`/`update-flow`) and on nodes (via `properties.info`); comment node (`type: "comment"`) for inline annotations
- [ ] 1.5 Write "Auditing with search-nodes" section: use `search-nodes` with `type: "function"` and no `name` to find unnamed function nodes; use `search-nodes` with `name` to verify naming conventions
- [ ] 1.6 Write "Link nodes as subflow alternative" section: link in/out for cross-tab reuse, link call for synchronous cross-tab calls; note subflow MCP support is deferred
- [ ] 1.7 Write "Environment variables" section: use `env` array on flows for configuration, reference via `env.get()` in function nodes
