## 1. Flow utils — group primitives

- [x] 1.1 Remove `'g'` from `METADATA_FIELDS` in `src/tools/flow-utils.js` so group membership is exposed
- [x] 1.2 Update `getFlowNodes()` to include `type: "group"` nodes (filter: `n.z === flowId && (('wires' in n) || n.type === 'group')`)
- [x] 1.3 Add `computeBoundingBox(nodes, padding)` helper: returns `{ x, y, w, h }` from min/max positions of given nodes + padding
- [x] 1.4 Add unit tests for `computeBoundingBox` in `tests/tools/flow-utils.test.js`
- [x] 1.5 Update existing `getFlowNodes` tests to reflect group node inclusion

## 2. add-nodes-to-group tool

- [x] 2.1 Create `src/tools/add-nodes-to-group.js` with `applyAddNodesToGroup(rawResponse, params)` function
- [x] 2.2 Implement logic: validate all nodes belong to same flow, find or create group node, compute bounding box for new groups, set `g` on members, update group's `nodes[]` array
- [x] 2.3 Handle auto-removal from previous group when node already has a different `g`
- [x] 2.4 Handle idempotent addition (node already in target group → no-op)
- [x] 2.5 Implement `handleAddNodesToGroup(client, params)` handler (GET /flows, apply, POST /flows)
- [x] 2.6 Create `tests/tools/add-nodes-to-group.test.js` with tests for: new group creation, existing group addition, bounding box computation, cross-flow rejection, locked flow rejection, idempotency, group reassignment

## 3. remove-nodes-from-group tool

- [x] 3.1 Create `src/tools/remove-nodes-from-group.js` with `applyRemoveNodesFromGroup(rawResponse, params)` function
- [x] 3.2 Implement logic: remove `g` from specified nodes (or all if none specified), remove node IDs from group's `nodes[]`, optionally reposition nodes outside group bounds
- [x] 3.3 Implement reposition strategy: place nodes in a vertical column at `group.x + group.w + 40`, spaced 40px apart
- [x] 3.4 Handle silent skip of nodes not in group (with warning)
- [x] 3.5 Implement `handleRemoveNodesFromGroup(client, params)` handler
- [x] 3.6 Create `tests/tools/remove-nodes-from-group.test.js` with tests for: specific removal, full removal, reposition, non-member skip, group not found, locked flow

## 4. update-group tool

- [x] 4.1 Create `src/tools/update-group.js` with `applyUpdateGroup(rawResponse, params)` function
- [x] 4.2 Validate target is `type: "group"`, then delegate to `applyNodeUpdate` from `update-node.js`
- [x] 4.3 Implement `handleUpdateGroup(client, params)` handler
- [x] 4.4 Create `tests/tools/update-group.test.js` with tests for: name update, style update, bounding box update, non-group rejection, group not found, locked flow, wires rejection

## 5. delete-group tool

- [x] 5.1 Create `src/tools/delete-group.js` with `applyDeleteGroup(rawResponse, params)` function
- [x] 5.2 Implement logic: if `deleteMembers: true`, remove all member nodes + group node; if `false`, strip `g` from members first then delete only the group
- [x] 5.3 Capture full `previousState` (group + members) for undo support
- [x] 5.4 Implement `handleDeleteGroup(client, params)` handler
- [x] 5.5 Create `tests/tools/delete-group.test.js` with tests for: delete with members, delete without members, empty group, group not found, locked flow, previousState shape

## 6. get-flow-nodes — expose groups

- [x] 6.1 Add `g: node.g || null` to the node shape in `transformFlowNodes()` in `src/tools/get-flow-nodes.js`
- [x] 6.2 Group nodes returned with their full style and nodes array (no `wires` field, `g: null`)
- [x] 6.3 Update existing tests in `tests/tools/get-flow-nodes.test.js` to verify `g` field presence and group node inclusion
- [x] 6.4 Add test for `nodeType: "group"` filter

## 7. get-flow-diagram — render groups

- [x] 7.1 Add `generateGroupSubgraphs(nodes)` function in `src/tools/get-flow-diagram.js` that wraps grouped nodes in Mermaid `subgraph` blocks
- [x] 7.2 Map group `style` properties to Mermaid `style` attributes (`fill`, `stroke`, `color`, `fill-opacity`)
- [x] 7.3 Handle edge cases: empty groups, groups split across pages, nodes without groups
- [x] 7.4 Update existing tests in `tests/tools/get-flow-diagram.test.js` for subgraph rendering
- [x] 7.5 Add tests for group style mapping, multiple groups, mixed grouped/ungrouped nodes

## 8. Server registration

- [x] 8.1 Import and register `add-nodes-to-group` tool in `src/server.js` with Zod schema
- [x] 8.2 Import and register `remove-nodes-from-group` tool in `src/server.js` with Zod schema
- [x] 8.3 Import and register `update-group` tool in `src/server.js` with Zod schema
- [x] 8.4 Import and register `delete-group` tool in `src/server.js` with Zod schema
- [x] 8.5 Update `get-flow-nodes` description to mention group support
- [x] 8.6 Update `get-flow-diagram` description to mention group rendering

## 9. Integration validation

- [x] 9.1 Run full test suite (`npx vitest run`) — all 480 tests pass
- [x] 9.2 Manually test `add-nodes-to-group` against live Node-RED instance
- [x] 9.3 Manually test `get-flow-nodes` with groups against live Node-RED instance
- [x] 9.4 Manually test `get-flow-diagram` with groups against live Node-RED instance
