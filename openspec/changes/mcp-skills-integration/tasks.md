# Tasks: MCP Skills Integration

## Group 1 — Skill Loader
- [ ] 1.1 Create `src/skills/loader.js`: scan `.github/skills/*/SKILL.md`, parse YAML frontmatter, extract markdown body, return Map
- [ ] 1.2 Handle missing skills directory gracefully
- [ ] 1.3 Export `loadSkills(basePath)` function

## Group 2 — MCP Prompts
- [ ] 2.1 Import and call `loadSkills()` in `src/server.js`
- [ ] 2.2 Register one `server.prompt()` per skill
- [ ] 2.3 Prompt handler: return `{ messages: [{ role: 'user', content: { type: 'text', text: skillContent } }] }`

## Group 3 — MCP Resources
- [ ] 3.1 Register one `server.resource()` per skill with URI `nodered://skills/<name>`
- [ ] 3.2 Resource handler: return `{ contents: [{ uri, text: skillContent, mimeType: 'text/markdown' }] }`

## Group 4 — get-skill Tool
- [ ] 4.1 Register `get-skill` tool
- [ ] 4.2 Tool handler: look up skill from map, return content
- [ ] 4.3 Tool description: instruct LLM to call this BEFORE building flows

## Group 5 — Testing
- [ ] 5.1 Create test for skill loader
- [ ] 5.2 Verify prompts, resources, and tool registration
- [ ] 5.3 Verify graceful behavior when no skills exist
