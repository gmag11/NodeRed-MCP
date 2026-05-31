## Context

The NodeRed-MCP server currently exposes a single tool (`get-flows`) that returns a high-level summary of flows. To be useful for debugging, understanding, and modifying Node-RED automations, an LLM needs to inspect individual nodes within a flow — their types, configuration, connections, and state — and to visualize the flow topology.

The Node-RED Admin API `GET /flows` returns a flat array of all node objects in v2 format (`{ rev, flows }`). Each node has an `id`, `type`, optional `z` (parent flow ID), `wires` (outgoing connections), and type-specific configuration fields. Some node types (e.g., `function`, `template`) contain large text blobs in fields like `func`, `template`, and `format` that would waste LLM context tokens.

The existing codebase follows a clean pattern: tool handlers in `src/tools/*.js`, registered in `src/server.js` via `server.tool()`, all using the shared `nodeRedClient.request()` for API access.

## Goals / Non-Goals

**Goals:**
- Provide detailed node inspection within a specific flow (metadata + sanitized config)
- Offer multiple filtering modes: by disabled state, by node type, and by connected subgraph (reachability from a specific node)
- Generate Mermaid flowchart diagrams representing flow topology
- List global configuration nodes separately
- Handle large flows gracefully via offset-based pagination
- Keep response payloads LLM-friendly (compact, relevant, no noise)

**Non-Goals:**
- Modifying or deploying flows (read-only tools)
- Streaming real-time node status or messages
- Supporting Node-RED's deprecated v1 API format
- Full-text content of function/template nodes (these are explicitly excluded to save context)

## Decisions

### D1: Three separate tools instead of one monolithic tool

**Decision**: Create `get-flow-nodes`, `get-flow-diagram`, and `get-config-nodes` as three independent MCP tools.

**Rationale**: Each serves a distinct purpose — structured data inspection, visual topology, and global config — and each has different input parameters and output formats. A single tool with mode switching would have a complex schema and confusing descriptions for LLMs.

**Alternative considered**: A single `inspect-flow` tool with a `mode` parameter. Rejected because it makes the tool description harder for LLMs to understand and the Zod schema overly complex.

### D2: Offset-based pagination over cursor-based

**Decision**: Use `offset` + `limit` pagination with sensible defaults (`offset=0`, `limit=50`).

**Rationale**: The node list from `GET /flows` is fetched entirely in memory each time (Node-RED doesn't support server-side pagination). Since the data is fully available, offset-based pagination is simpler to implement, simpler for LLMs to use ("give me nodes 50-100"), and doesn't require maintaining cursor state. The response includes `totalCount`, `offset`, `limit`, and `hasMore` metadata so the LLM knows whether to request more.

**Alternative considered**: Cursor-based pagination (opaque token encoding position). Rejected because there's no persistent server-side state — the entire flow is re-fetched on each call anyway, making cursor tokens unnecessary complexity.

### D3: Field sanitization via blocklist

**Decision**: Exclude known large text fields (`func`, `template`, `format`, `html`, `css`, `rules` when array) from node configuration output. Include all other config fields.

**Rationale**: A blocklist approach is safer than an allowlist because Node-RED has hundreds of node types with varying config schemas. A blocklist catches the known large-text offenders while preserving useful config data from community nodes. The excluded fields are documented in the tool description so LLMs know what's omitted.

**Alternative considered**: Allowlist of safe fields per node type. Rejected because it's impossible to maintain for the open ecosystem of community nodes.

### D4: Mermaid for flow diagrams

**Decision**: Use Mermaid `flowchart TD` syntax for diagram output.

**Rationale**: Mermaid is compact (much fewer tokens than a JSON graph), natively understood by LLMs, and renderizable in many environments (VS Code, GitHub, Claude, ChatGPT). It conveys topology semantically — `A --> B` is immediately clear. Disabled nodes are styled with dashed borders and a distinct class.

**Alternative considered**: JSON adjacency list. Rejected because it's verbose, harder for LLMs to reason about visually, and offers no rendering benefit.

### D5: Connected subgraph filter via directional BFS

**Decision**: When filtering by `fromNodeId`, accept an additional `direction` parameter (`"downstream"` | `"upstream"` | `"both"`, default `"both"`). Perform a BFS/DFS traversal from the specified node:
- `"downstream"`: follow `wires` forward only (what happens after this node?)
- `"upstream"`: follow reverse-indexed wires backward only (where does this node's data come from?)
- `"both"`: follow both directions to return the full connected component

This requires building a reverse wire index (target → sources) in addition to the existing forward wires. BFS is O(V+E) and straightforward. The `direction` parameter gives the LLM precise control over context scope.

**Rationale**: A bidirectional-only approach returns the full connected component, which can still be large. Allowing directional traversal lets the LLM ask focused questions: "show me everything downstream of this function node" or "trace back the data sources feeding into this debug node". This dramatically reduces context noise.

**Alternative considered**: Always bidirectional (no direction parameter). Rejected because it doesn't allow the LLM to focus on one direction of data flow, which is the most common use case when debugging.

### D6: Shared transformation module

**Decision**: Extract common logic (node filtering, pagination, field sanitization, wire indexing) into a shared utility module `src/tools/flow-utils.js`.

**Rationale**: Both `get-flow-nodes` and `get-flow-diagram` need to fetch flow nodes, apply the same filters, and paginate. Duplication would be a maintenance burden and introduce inconsistency risk.

## Risks / Trade-offs

- **[Full flow re-fetch on every call]** → The Node-RED API doesn't support querying nodes by flow ID; we must fetch all flows and filter client-side. For instances with thousands of nodes, this adds latency. Mitigation: pagination keeps response sizes manageable; caching is a future optimization (out of scope).
- **[Blocklist may miss new large fields]** → New community node types may introduce large text fields not in our blocklist. Mitigation: the blocklist is centralized in one utility and easy to extend. Tool descriptions mention that some fields may be truncated.
- **[Mermaid rendering limits]** → Mermaid diagrams with 200+ nodes may be hard to read. Mitigation: pagination limits the number of nodes per diagram page, and the subgraph filter allows focusing on relevant sections.
- **[Disconnected subgraph filter returns partial flow]** → When filtering by a node, the LLM only sees one connected component, potentially missing relevant context in other parts of the flow. Mitigation: the filter is opt-in; without it, all nodes are returned.
