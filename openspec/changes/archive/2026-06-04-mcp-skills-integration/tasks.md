# Tasks: MCP Skills Integration

## Group 1 — Skill Loader
- [x] 1.1 Create `src/skills/loader.js`: scan `.github/skills/*/SKILL.md`, parse YAML frontmatter, extract markdown body, return Map
- [x] 1.2 Handle missing skills directory gracefully
- [x] 1.3 Export `loadSkills(basePath)` function

## Group 2 — MCP Prompts
- [x] 2.1 Import and call `loadSkills()` in `src/server.js`
- [x] 2.2 Register one `server.prompt()` per skill
- [x] 2.3 Prompt handler: return `{ messages: [{ role: 'user', content: { type: 'text', text: skillContent } }] }`

## Group 3 — MCP Resources
- [x] 3.1 Register one `server.resource()` per skill with URI `nodered://skills/<name>`
- [x] 3.2 Resource handler: return `{ contents: [{ uri, text: skillContent, mimeType: 'text/markdown' }] }`

## Group 4 — get-skill Tool
- [x] 4.1 Register `get-skill` tool
- [x] 4.2 Tool handler: look up skill from map, return content
- [x] 4.3 Tool description: instruct LLM to call this BEFORE building flows

## Group 5 — Testing
- [x] 5.1 Create test for skill loader
- [x] 5.2 Verify prompts, resources, and tool registration
- [x] 5.3 Verify graceful behavior when no skills exist
