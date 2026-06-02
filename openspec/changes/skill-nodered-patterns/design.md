## Context

The Node-RED Cookbook (https://cookbook.nodered.org/) provides well-tested recipes for common programming tasks. Each recipe translates into a specific node topology. This skill encodes the most valuable recipes as MCP tool sequences.

## Goals / Non-Goals

**Goals:**
- Cover: HTTP endpoint, HTTP request (GET/POST), MQTT subscribe, timer-triggered flow, message routing (switch), data transformation (change + function), error handling (catch), rate limiting (delay), join/split streams
- For each pattern: list required nodes, their key properties, and wiring sequence; note whether `import-flow` with a pre-built JSON is preferred over step-by-step construction

**Non-Goals:**
- Advanced patterns (real-time dashboards, file I/O, database queries) — too platform-specific
- Full node property listings (use `nodered-core-nodes`)

## Decisions

### Format: named recipe blocks

**Decision**: Each recipe is a named, scannable block: Pattern name → use case → nodes needed → wiring → key properties → example `import-flow` JSON path.

**Rationale**: The LLM can scan recipe names quickly to find the right one, then read only the relevant block.

### Include `import-flow`-ready JSON examples for complex patterns

**Decision**: For patterns with 4+ nodes (HTTP endpoint, MQTT subscriber), include a note pointing to a companion JSON file in `examples/` that the LLM can read and pass to `import-flow`.

**Rationale**: Reduces the number of steps for the most common cases.

## Risks / Trade-offs

- [Cookbook drift] The Cookbook may add new recipes or change existing ones. The skill should be treated as a curated subset, not a mirror.
