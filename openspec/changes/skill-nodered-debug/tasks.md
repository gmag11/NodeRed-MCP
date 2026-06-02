## 1. SKILL.md

- [ ] 1.1 Create `.github/skills/nodered-debug/SKILL.md` with YAML frontmatter
- [ ] 1.2 Write "Debug workflow" section as a numbered sequence: position debug node → ensure active → inject → read-debug-messages → analyze → fix → repeat
- [ ] 1.3 Write "Debug node configuration" section: `active` (bool), `complete` property values (`"false"` = payload only, `"true"` = full msg, expression string = specific property), `console` flag
- [ ] 1.4 Write "inject-message usage" section: inject by nodeId vs by name, what happens after injection (async), how to target the right inject node
- [ ] 1.5 Write "read-debug-messages filters" section: each parameter with use case; timing note about using `since` with pre-inject timestamp
- [ ] 1.6 Write "Common debug patterns" section: "Is my flow being triggered?" (filter by flowId nodes), "What is msg.payload at this point?" (add debug after specific node), "Is my context being set?" (get-context after inject)
