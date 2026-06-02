## Context

The "Developing Flows" guide (https://nodered.org/docs/developing-flows/) covers flow structure, message design, and documentation. For an LLM building flows via MCP, the most actionable guidance is: when to split into multiple tabs, how to name flows and nodes for clarity, and how to use comment nodes and info fields for documentation.

## Goals / Non-Goals

**Goals:**
- Tab organization: one tab per domain/concern, not one tab for everything
- Node naming conventions: descriptive names, not default type names
- Flow documentation: using the `info` field on flows/nodes and comment nodes
- When to use subflows (deferred) — note that subflow creation is not yet in MCP
- `search-nodes` as a tool for auditing and finding naming inconsistencies

**Non-Goals:**
- Message design (msg property naming conventions) — advanced topic
- Subflow creation — deferred

## Decisions

### Practical over theoretical

**Decision**: Each guideline is accompanied by a concrete "do this, not that" example using MCP tool parameters.

**Rationale**: Abstract principles are less useful to an LLM than concrete parameter examples. e.g., "Set `info: 'Receives webhook from Stripe, validates signature, routes to payment handler'` on the flow, not just `info: 'Webhook'`."

## Risks / Trade-offs

- [Subflows] The most powerful organizational tool in Node-RED is not yet in MCP. The skill should explicitly note this gap and suggest alternatives (e.g., link nodes for cross-flow calls).
