## Context

The debug workflow uses: `inject-message` to trigger, `read-debug-messages` to observe, `get-node-detail` to inspect node state, and `get/set-context` to control stateful flows. The skill must explain how to position debug nodes in a flow for maximum observability and how to use filter parameters effectively.

Source: https://nodered.org/docs/user-guide/editor/sidebar/debug

## Goals / Non-Goals

**Goals:**
- Explain debug node configuration: what to output (`msg.payload` vs complete msg vs expression)
- Explain `active` property: debug nodes must have `active: true` to emit messages
- Step-by-step debug workflow using MCP tools
- Filtering guidance: when to use `nodeId`, `nodeName`, `keyword`, `since`
- How to interpret common debug output shapes

**Non-Goals:**
- Runtime error debugging (catch nodes) — covered in `nodered-patterns`

## Decisions

### Workflow-first structure

**Decision**: Lead with the complete debug workflow as a numbered sequence, then explain each component.

**Rationale**: The LLM is task-oriented; it needs the sequence first, details second.

### Document `active` property prominently

**Decision**: Prominently note that debug nodes are created with `active: true` by default but can be disabled, and that `read-debug-messages` will receive nothing from an inactive debug node.

**Rationale**: This is the most common silent failure in debug workflows.

## Risks / Trade-offs

- [Timing] `inject-message` fires asynchronously; the LLM should call `read-debug-messages` after a short implicit delay or check `since` timestamp. The skill documents this.
