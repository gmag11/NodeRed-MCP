# Design: MCP Skills Integration

## Output artifact(s)
- `src/skills/loader.js`
- Modification of `src/server.js`

## Structure
### Sections

| Section | Content |
|---------|--------|
| Skill Loader Module | New `src/skills/loader.js` that scans `.github/skills/*/SKILL.md`, parses YAML frontmatter, caches content. Exports `loadSkills()` returning Map |
| Server Capability Update | Change `new McpServer({...})` — the SDK auto-detects capabilities from registered prompts/resources |
| MCP Prompts Registration | `server.prompt(name, description, {section: z.string().optional()}, handler)` returns messages array with skill content |
| MCP Resources Registration | `server.resource(name, 'nodered://skills/<name>', {description, mimeType: 'text/markdown'}, handler)` returns contents array |
| get-skill Tool | New tool `get-skill` with params `topic` and optional `section`. Returns skill content |
| Integration in server.js | Call `loadSkills()` at server creation, iterate skills map to register prompts + resources + the tool |

## Architecture
```
.github/skills/*/SKILL.md  (source of truth)
         ↓
src/skills/loader.js       (parse + cache)
         ↓
src/server.js              (register via 3 channels)
    ├── server.prompt()     (MCP Prompts)
    ├── server.resource()   (MCP Resources)
    └── server.tool()       (get-skill tool)
```

## Constraints
- Skills directory is relative to project root.
- Skill content is loaded once at startup and cached.
- The SDK auto-detects capabilities from registered handlers.
