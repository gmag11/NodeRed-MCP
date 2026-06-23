## 1. Remove prompt registration

- [ ] 1.1 Remove the `server.prompt()` loop (lines ~897-908) in `src/server.js` that registers each skill as an MCP prompt

## 2. Remove get-skill tool

- [ ] 2.1 Remove the `server.tool('get-skill', ...)` registration (lines ~947-980) in `src/server.js`

## 3. Update list-skills tool

- [ ] 3.1 Add `uri` field (`nodered://skills/${name}`) to each entry in the `list-skills` handler in `src/server.js`
- [ ] 3.2 Update `list-skills` tool description to reference resource URIs instead of the removed `get-skill` tool

## 4. Update tool descriptions that reference skills

- [ ] 4.1 In `create-subflow-instance` tool description (line ~197, `src/server.js`): replace `see the \`nodered-flow-layout\` skill` with `read the \`nodered://skills/nodered-flow-layout\` resource (use list-skills to discover available skill URIs)`
- [ ] 4.2 In `create-node` tool description (line ~558, `src/server.js`): replace `see the \`nodered-flow-layout\` skill` with `read the \`nodered://skills/nodered-flow-layout\` resource (use list-skills to discover available skill URIs)`

## 5. Update tests

- [ ] 5.1 Update `tests/skills/list-skills.test.js` — add `uri` field to expected output in all test assertions
- [ ] 5.2 Run existing test suite: `npm test` — verify no regressions in other tools

## 6. Verify

- [ ] 5.1 Start the MCP server and confirm `nodered://skills/*` resources are accessible
- [ ] 5.2 Confirm `get-skill` tool and skill prompts are no longer in the tool/prompt list
- [ ] 5.3 Confirm `list-skills` returns entries with `name`, `description`, and `uri` fields
