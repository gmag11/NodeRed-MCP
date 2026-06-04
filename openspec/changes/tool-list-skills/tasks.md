## 1. Tool Registration

- [x] 1.1 Register `list-skills` tool in `src/server.js` alongside `get-skill`, with description instructing LLM to call it first to discover available skill names
- [x] 1.2 Tool handler: iterate over `skills` Map, return `{ content: [{ type: 'text', text: JSON.stringify([...skills].map(([name, s]) => ({ name, description: s.description }))) }] }`
- [x] 1.3 Handle empty skills list gracefully (return empty array `[]`)

## 2. Testing

- [x] 2.1 Verify `list-skills` returns correct array when skills are loaded
- [x] 2.2 Verify `list-skills` returns empty array when no nodered-* skills exist
- [x] 2.3 Verify each entry contains `name` and `description` fields
