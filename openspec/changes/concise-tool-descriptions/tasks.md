## 1. Audit

- [ ] 1.1 Identify all tool descriptions in `src/server.js` that exceed 3 concatenated lines — list them with line numbers
- [ ] 1.2 Categorize: which embed skill URIs, which repeat staging boilerplate, which are just verbose

## 2. Rewrite long descriptions

- [ ] 2.1 Shorten flow/scaffold tools: `get-flows`, `get-subflows`, `get-flow-nodes`, `get-subflow-detail`, `get-flow-diagram`
- [ ] 2.2 Shorten creation tools: `create-flow`, `create-node`, `create-subflow`, `create-subflow-instance`
- [ ] 2.3 Shorten mutation tools: `update-node`, `update-flow`, `update-subflow`, `update-group`, `delete-node`, `delete-flow`, `delete-subflow`, `delete-group`
- [ ] 2.4 Shorten wiring tools: `connect-nodes`, `disconnect-nodes`
- [ ] 2.5 Shorten group tools: `add-nodes-to-group`, `remove-nodes-from-group`
- [ ] 2.6 Shorten import/export tools: `export-flow`, `import-flow`, `export-subflow`
- [ ] 2.7 Shorten deploy & staging tools: `deploy`, `get-staging-status`, `refresh-staging`, `render-staging`
- [ ] 2.8 Shorten inject/debug tools: `inject-message`, `read-debug-messages`
- [ ] 2.9 Shorten palette/inspect tools: `get-palette-nodes`, `get-node-detail`, `get-node-type-detail`, `get-config-nodes`, `search-nodes`
- [ ] 2.10 Shorten context tools: `get-context`, `delete-context`
- [ ] 2.11 Shorten package tools: `install-node`, `uninstall-node`
- [ ] 2.12 Shorten skill tools: `get-skill`, `list-skills`

## 3. Remove skill references

- [ ] 3.1 Remove all `nodered://skills/…` URIs from tool descriptions
- [ ] 3.2 Remove all "use list-skills to discover" phrases from tool descriptions
- [ ] 3.3 Remove BUILD WORKFLOW, LAYOUT, NODE REFERENCE cross-references from tool descriptions

## 4. Standardize staging boilerplate

- [ ] 4.1 Add "(staged — deploy to apply)" suffix to all tools that modify staging
- [ ] 4.2 Remove verbose staging explanations that duplicate the `deploy` tool description

## 5. Verify

- [ ] 5.1 Run `npm test` — all tests must pass (tests validate handler behavior, not description text)
- [ ] 5.2 Spot-check 5 tool descriptions against the spec (≤3 lines, no skill URIs, staging suffix where applicable)
