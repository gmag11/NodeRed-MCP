# Spec: MCP Skills Integration

## Files
- `src/skills/loader.js`
- `src/server.js`

## Description
This specification covers the implementation of a hybrid MCP skill integration. We will create a loader that parses `.github/skills/*/SKILL.md` files for frontmatter and body. Then, in `src/server.js`, we will map these into `server.prompt`, `server.resource`, and a custom `get-skill` tool. This ensures any MCP client can consume these Node-RED skills regardless of its specific capability support.
