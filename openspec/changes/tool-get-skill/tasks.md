## 1. Tool Registration

- [x] 1.1 Register `get-skill` tool in `src/server.js` with `name` parameter, reading from the existing `skills` Map and returning `{ name, description, content }`
- [x] 1.2 Handle skill-not-found case: return error listing available skills via `[...skills.keys()]`
- [x] 1.3 Update `list-skills` tool description to reference `get-skill` as an alternative for clients without MCP Resource support

## 2. Testing

- [x] 2.1 Create `tests/skills/get-skill.test.js` with tests for: existing skill returns correct content, non-existent skill returns error with available list, skill with empty content
- [x] 2.2 Verify existing `list-skills` tests still pass after description update
