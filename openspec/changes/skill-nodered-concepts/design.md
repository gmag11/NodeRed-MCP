## Context

The skill targets an LLM that has access to Node-RED MCP tools. It needs to understand the conceptual model to interpret tool results correctly and issue correct tool calls. Source: https://nodered.org/docs/user-guide/concepts

## Goals / Non-Goals

**Goals:**
- Define all core Node-RED concepts clearly: Node, Flow (tab), Wire, Message, Context, Config Node, Subflow, Palette, Workspace
- Clarify the dual meaning of "flow" (tab vs. connected nodes)
- Map each concept to the MCP tools that relate to it
- Be brief enough to include in context without excessive token cost

**Non-Goals:**
- Implementation details of creating nodes (covered in `nodered-flow-builder`)
- Node type catalog (covered in `nodered-core-nodes`)

## Decisions

### Structure as a concept glossary with MCP tool cross-references

**Decision**: Each concept gets a short definition followed by which MCP tools the LLM uses to interact with it.

**Rationale**: The LLM reads this skill to orient itself before acting. Cross-references to tools make the skill immediately actionable.

### Include a data flow diagram

**Decision**: Include a simple ASCII diagram showing how a message flows through nodes via wires.

**Rationale**: Visual representation aids comprehension and reduces errors in wiring logic.

## Risks / Trade-offs

- [Staleness] If new tools are added, the cross-references in this skill need updating. Mitigation: the tool list is stable; new tool cross-references should be added when new tools ship.
