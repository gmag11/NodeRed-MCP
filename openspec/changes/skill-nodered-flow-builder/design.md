## Context

The MCP flow-building workflow is: create flow → add nodes → wire nodes → verify. Each step maps to specific tools, and there are important constraints (e.g., nodes must exist before wiring; you must know a node's output port count before connecting it). The skill encodes this procedural knowledge.

Source: https://nodered.org/docs/user-guide/editor/workspace

## Goals / Non-Goals

**Goals:**
- Step-by-step guide for the most common flow-building workflows: build from scratch, import, edit existing, delete
- Port numbering explanation (output ports are 0-indexed arrays in wires)
- How to verify a flow after building (get-flow-diagram, get-flow-nodes)
- When to use `import-flow` vs. node-by-node construction

**Non-Goals:**
- Node property details (covered in `nodered-core-nodes`)
- Pattern-level recipes (covered in `nodered-patterns`)

## Decisions

### Primary workflow: build from scratch with node-by-node construction

**Decision**: The main section walks through: 1) `create-flow`, 2) `create-node` for each node with layout coordinates, 3) `connect-nodes`, 4) `get-flow-diagram` to verify.

**Rationale**: This is the most atomic and learnable workflow. The LLM can apply it for any flow regardless of complexity.

### Secondary workflow: import-flow for known patterns

**Decision**: A secondary section explains when to use `import-flow`: when the user provides a JSON, when replicating a known Cookbook pattern, when complexity is high.

**Rationale**: `import-flow` is faster but requires knowing the full node JSON upfront. For novel flows, node-by-node is safer.

### Coordinate strategy

**Decision**: Include a grid recommendation: first node at x=100, y=100; each subsequent node +200 x or +100 y for branches.

**Rationale**: Without coordinate guidance the LLM stacks all nodes at 0,0 producing overlapping layouts that are hard to read in the Node-RED UI.

## Risks / Trade-offs

- [Port numbering errors] The most common wiring error is using 1-based port numbers instead of 0-based. The skill must prominently document 0-based indexing.
