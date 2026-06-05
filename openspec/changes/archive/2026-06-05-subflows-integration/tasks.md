## 1. Refactor get-flows

- [x] 1.1 Modify `transformFlows()` filter in `src/tools/get-flows.js` to only match `type === 'tab'` (remove `|| node.type === 'subflow'`)
- [x] 1.2 Update tool description in `src/server.js` to reflect tabs-only behavior and mention `get-subflows` for subflow discovery
- [x] 1.3 Update existing `get-flows` tests in `tests/tools/get-flows.test.js` to reflect tabs-only behavior

## 2. get-subflows tool

- [x] 2.1 Create `src/tools/get-subflows.js` with `transformSubflows()` function that filters `type === 'subflow'`, computes enriched metadata (ports, internals, instances)
- [x] 2.2 Register `get-subflows` tool in `src/server.js` (no parameters)
- [x] 2.3 Create `tests/tools/get-subflows.test.js` with test cases: no subflows, one subflow with instances, multiple subflows, subflow with no instances

## 3. get-subflow-detail tool

- [x] 3.1 Create `src/tools/get-subflow-detail.js` that fetches subflow definition, internal nodes, instances, and generates Mermaid diagram reusing logic from `get-flow-diagram.js`
- [x] 3.2 Register `get-subflow-detail` tool in `src/server.js` with `subflowId` parameter
- [x] 3.3 Create `tests/tools/get-subflow-detail.test.js` with test cases: valid subflow, unknown subflowId, empty subflow, subflow with internal wiring

## 4. create-subflow-instance tool

- [x] 4.1 Create `src/tools/create-subflow-instance.js` that validates subflowId/flowId, constructs instance node with auto-sized wires, uses existing `applyCreateNode` pattern
- [x] 4.2 Register `create-subflow-instance` tool in `src/server.js` with `subflowId`, `flowId`, `name`, `env`, `x`, `y` parameters
- [x] 4.3 Create `tests/tools/create-subflow-instance.test.js` with test cases: minimal instance, with name, with env vars, unknown subflowId, unknown flowId, locked flow, auto-sized wires

## 5. export-subflow tool

- [x] 5.1 Create `src/tools/export-subflow.js` that collects subflow definition + internal nodes + referenced config nodes (reusing `collectReferencedConfigNodes` from `export-flow.js`)
- [x] 5.2 Register `export-subflow` tool in `src/server.js` with `subflowId` parameter
- [x] 5.3 Create `tests/tools/export-subflow.test.js` with test cases: subflow with internals and config nodes, empty subflow, unknown subflowId, round-trip with import-flow

## 6. create-subflow tool

- [x] 6.1 Create `src/tools/create-subflow.js` with UUID generation, subflow definition node construction, and deploy via `POST /flows`
- [x] 6.2 Register `create-subflow` tool in `src/server.js` with `name` (required), `info`, `category`, `color`, `icon`, `in`, `out` parameters
- [x] 6.3 Create `tests/tools/create-subflow.test.js` with test cases: minimal create, with all metadata, with port definitions

## 7. update-subflow tool

- [x] 7.1 Create `src/tools/update-subflow.js` with allowed field filtering (`name`, `info`, `category`, `color`, `icon`, `in`, `out`), locked-flow check, partial merge
- [x] 7.2 Register `update-subflow` tool in `src/server.js` with `subflowId` and `updates` parameters
- [x] 7.3 Create `tests/tools/update-subflow.test.js` with test cases: update name, update ports, partial merge, unknown subflowId, locked subflow, empty updates

## 8. delete-subflow tool

- [x] 8.1 Create `src/tools/delete-subflow.js` that collects previousState (definition + internals + instances), removes nodes from flows array, supports `deleteInstances` flag
- [x] 8.2 Register `delete-subflow` tool in `src/server.js` with `subflowId` and `deleteInstances` parameters
- [x] 8.3 Create `tests/tools/delete-subflow.test.js` with test cases: cascade delete, keep instances, unknown subflowId, locked subflow, previousState for undo

## 9. Skill: nodered-subflows

- [x] 9.1 Create `.github/skills/nodered-subflows/SKILL.md` with YAML frontmatter (`name`, `description`, `tools` listing all subflow tools + `import-flow`)
- [x] 9.2 Document subflow vocabulary: definition, internal nodes, instances, ports (`in`/`out`), env variables
- [x] 9.3 Document creation workflow: `create-subflow` → populate with `create-node`/`connect-nodes` → define ports with `update-subflow`
- [x] 9.4 Document instantiation: `create-subflow-instance` with env parameterization
- [x] 9.5 Document export/import: `export-subflow` + `import-flow`
- [x] 9.6 Document editing: `update-subflow` for metadata, `update-node`/`connect-nodes`/`disconnect-nodes` for internals
- [x] 9.7 Document deletion: `delete-subflow` and recovery via `previousState`
- [x] 9.8 Document limitations: no nested subflows in UI, refresh required after MCP changes
- [x] 9.9 Verify skill is loaded by `src/skills/loader.js` (auto-discovered from `.github/skills/`)

## 10. Integration and verification

- [x] 10.1 Verify all 7 new tools appear in `get-palette-nodes` response (MCP tools list)
- [x] 10.2 Verify `get-flows` no longer returns subflows
- [x] 10.3 Run full test suite: `npm test`
- [x] 10.4 Manual smoke test against `localhost:1880`: create subflow → add internal nodes → instantiate → inspect → export → delete
