## 1. Shared Utilities

- [ ] 1.1 Create `src/tools/flow-utils.js` with a `BLOCKLISTED_FIELDS` constant (Set containing `func`, `template`, `format`, `html`, `css`)
- [ ] 1.2 Implement `sanitizeNodeConfig(node)` — returns a copy of the node excluding blocklisted fields and internal Node-RED fields (`z`, `x`, `y`, `wires`, `id`, `type`, `d`, `name` which are returned as top-level metadata)
- [ ] 1.3 Implement `getFlowNodes(allNodes, flowId)` — filters nodes by `z === flowId`, throws if no tab/subflow with that ID exists
- [ ] 1.4 Implement `buildReverseWireIndex(nodes)` — returns a Map of targetId → Set of sourceIds, built from all nodes' `wires` arrays
- [ ] 1.5 Implement `getConnectedSubgraph(nodes, fromNodeId, direction, reverseIndex)` — BFS traversal returning the Set of node IDs reachable from `fromNodeId`; `direction` controls traversal (`"downstream"` = forward wires only, `"upstream"` = reverse wires only, `"both"` = full connected component); throws if `fromNodeId` not found
- [ ] 1.6 Implement `applyFilters(nodes, { disabledOnly, nodeType, fromNodeId, direction })` — chains filters in order: subgraph (with direction) → disabledOnly → nodeType
- [ ] 1.7 Implement `paginate(items, offset, limit)` — returns `{ items: slicedArray, totalCount, offset, limit, hasMore }`
- [ ] 1.8 Write unit tests for all utility functions in `tests/tools/flow-utils.test.js`

## 2. get-flow-nodes Tool

- [ ] 2.1 Create `src/tools/get-flow-nodes.js` with `transformFlowNodes(rawResponse, flowId, options)` — uses shared utilities to filter, sanitize, and paginate nodes; returns `{ nodes, totalCount, offset, limit, hasMore, flowId }`
- [ ] 2.2 Implement `handleGetFlowNodes(client, params)` — calls `client.request('GET', '/flows')`, delegates to `transformFlowNodes`, returns MCP content format
- [ ] 2.3 Register `get-flow-nodes` in `src/server.js` with Zod schema: `flowId` (string, required), `disabledOnly` (boolean, optional), `nodeType` (string, optional), `fromNodeId` (string, optional), `direction` (enum `"downstream"`/`"upstream"`/`"both"`, optional, default `"both"`), `offset` (number, optional, default 0), `limit` (number, optional, default 50)
- [ ] 2.4 Write unit tests in `tests/tools/get-flow-nodes.test.js` covering: basic retrieval, empty flow, flow not found, sanitization of function/template nodes, disabledOnly filter, nodeType filter, fromNodeId subgraph filter (downstream, upstream, both), pagination (first page, middle page, last page)

## 3. get-flow-diagram Tool

- [ ] 3.1 Create `src/tools/get-flow-diagram.js` with `generateMermaidDiagram(nodes)` — builds a `flowchart TD` string with node labels (name || type), edges from wires, output port labels for multi-output nodes, and `classDef disabled` styling
- [ ] 3.2 Implement `transformFlowDiagram(rawResponse, flowId, options)` — uses shared utilities to filter and paginate, then generates Mermaid from the paginated node slice; returns `{ diagram, totalCount, offset, limit, hasMore, flowId }`
- [ ] 3.3 Implement `handleGetFlowDiagram(client, params)` — calls `client.request('GET', '/flows')`, delegates to `transformFlowDiagram`, returns MCP content format
- [ ] 3.4 Register `get-flow-diagram` in `src/server.js` with Zod schema: `flowId` (string, required), `disabledOnly` (boolean, optional), `nodeType` (string, optional), `fromNodeId` (string, optional), `direction` (enum `"downstream"`/`"upstream"`/`"both"`, optional, default `"both"`), `offset` (number, optional, default 0), `limit` (number, optional, default 50)
- [ ] 3.5 Write unit tests in `tests/tools/get-flow-diagram.test.js` covering: simple flow diagram, disabled node styling, multi-output edges, empty flow, subgraph filter (downstream, upstream, both), pagination

## 4. get-config-nodes Tool

- [ ] 4.1 Create `src/tools/get-config-nodes.js` with `transformConfigNodes(rawResponse, options)` — filters nodes without `z` and with type not `tab`/`subflow`, applies nodeType filter, sanitizes config, paginates; returns `{ nodes, totalCount, offset, limit, hasMore }`
- [ ] 4.2 Implement `handleGetConfigNodes(client, params)` — calls `client.request('GET', '/flows')`, delegates to `transformConfigNodes`, returns MCP content format
- [ ] 4.3 Register `get-config-nodes` in `src/server.js` with Zod schema: `nodeType` (string, optional), `offset` (number, optional, default 0), `limit` (number, optional, default 50)
- [ ] 4.4 Write unit tests in `tests/tools/get-config-nodes.test.js` covering: basic listing, empty result, nodeType filter, sanitization, pagination

## 5. Integration Verification

- [ ] 5.1 Run the full test suite (`npm test`) and verify all new and existing tests pass
- [ ] 5.2 Start the MCP server locally and verify the three new tools appear in the tool list
