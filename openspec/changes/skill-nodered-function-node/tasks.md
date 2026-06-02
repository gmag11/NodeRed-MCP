## 1. SKILL.md

- [ ] 1.1 Create `.github/skills/nodered-function-node/SKILL.md` with YAML frontmatter
- [ ] 1.2 Write "Setting function code via MCP" section: `create-node` with `type: "function"`, `properties.func`, `properties.outputs`
- [ ] 1.3 Write "Available globals" section: `msg`, `node`, `context`, `flow`, `global`, `env`, `RED` — each with description and example
- [ ] 1.4 Write "Return semantics" section: single output, null, array for multiple outputs, routing with null elements
- [ ] 1.5 Write "Context API" section: `flow.get/set()`, `global.get/set()` in function code vs `get-context`/`set-context` MCP tools
- [ ] 1.6 Write "Async patterns" section: `node.send()` with async/await, `done()` callback
- [ ] 1.7 Write "Logging and errors" section: `node.log()`, `node.warn()`, `node.error(msg, originalMsg)`
- [ ] 1.8 Write inline code examples: transform payload, conditional routing, stateful counter using flow context, async fetch
