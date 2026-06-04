## 1. Tool Registration

- [ ] 1.1 Register `list-skills` tool in `src/server.js` alongside `get-skill`, with description instructing LLM to call it first to discover available skill names
- [ ] 1.2 Tool handler: iterate over `skills` Map, return `{ content: [{ type: 'text', text: JSON.stringify([...skills].map(([name, s]) => ({ name, description: s.description }))) }] }`
- [ ] 1.3 Handle empty skills list gracefully (return empty array `[]`)

## 2. Testing

- [ ] 2.1 Verify `list-skills` returns correct array when skills are loaded
- [ ] 2.2 Verify `list-skills` returns empty array when no nodered-* skills exist
- [ ] 2.3 Verify each entry contains `name` and `description` fields
