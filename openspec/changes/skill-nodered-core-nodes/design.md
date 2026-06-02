## Context

The LLM calls `create-node` and `update-node` with a `properties` object that maps to Node-RED node properties. Each node type has a different schema. Node-RED exposes these schemas via `get-node-type-detail`, but the LLM should not call that tool for every common node type — it already knows them.

Source: https://nodered.org/docs/user-guide/nodes

## Goals / Non-Goals

**Goals:**
- SKILL.md: categorized index of all built-in node types with short descriptions and key properties
- SKILL.md: clear instruction to use `get-node-type-detail` for types not listed or for complete property schemas
- Example JSON sub-files: one per category (common, network, sequence, parser, storage), readable on demand

**Non-Goals:**
- Covering third-party palette nodes (use `get-node-type-detail`)
- Property validation rules (trust Node-RED's own validation)

## Decisions

### SKILL.md as index + on-demand example files

**Decision**: The SKILL.md lists node types with brief property summaries. Detailed JSON examples live in `examples/<category>.json`. The SKILL.md explicitly tells the LLM to read the relevant example file when it needs a concrete template.

**Rationale**: Embedding all JSON examples in the SKILL.md would make it too large for efficient context use. Keeping them as separate readable files lets the LLM fetch only what it needs.

### Categories: common, network, sequence, parser, storage

**Decision**: Group node types into 5 categories matching the Node-RED palette sections.

| Category | Nodes |
|----------|-------|
| common | inject, debug, complete, catch, status, link in/out/call, comment |
| network | http in, http response, http request, websocket in/out, tcp/udp, mqtt in/out |
| sequence | split, join, sort, batch |
| parser | json, xml, yaml, csv, html, markdown |
| storage | file, file in, watch |

**Rationale**: Mirrors the logical grouping users see in the Node-RED palette, making it easier to reason about.

## Risks / Trade-offs

- [Staleness] Node-RED properties can change across versions. Mitigated by instructing the LLM to prefer `get-node-type-detail` for authoritative schemas and treating the skill as a quick-reference only.
