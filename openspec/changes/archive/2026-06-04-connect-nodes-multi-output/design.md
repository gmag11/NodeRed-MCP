## Context

`connect-nodes` and `disconnect-nodes` both accept an `outputPort` integer (default 0) and operate on one wire per call. Nodes with multiple outputs (Switch, Function with multiple `msg.send()` calls, Subflows) require N separate tool calls to fully wire all their outputs. This increases latency and token cost for the AI.

The existing implementation stores wires in Node-RED's native format: `node.wires = [["id1", "id2"], ["id3"], ...]` where each array index corresponds to an output port.

## Goals / Non-Goals

**Goals:**
- Allow a single `connect-nodes` call to add wires across multiple output ports.
- Allow a single `disconnect-nodes` call to remove wires across multiple output ports.
- Allow `disconnect-nodes` to clear all wires from a specific output port without enumerating targets.
- Preserve full backwards compatibility — the existing single-wire parameters continue to work unchanged.

**Non-Goals:**
- Replacing all wires on a node atomically (a full `wires` overwrite belongs in `update-node`).
- Validating whether a node type actually has N outputs (that would require node-type metadata lookup).
- Adding wires between nodes on different flows.

## Decisions

### 1. Extend via optional `connections` array, not a new tool

**Decision**: Add an optional `connections` parameter to both existing tools rather than creating `batch-connect-nodes` / `batch-disconnect-nodes`.

**Rationale**: Keeps the surface area small. The AI already knows `connect-nodes`; teaching it one optional param is cheaper than routing to a new tool. The single-connection path remains unchanged.

**Alternative considered**: New batch tools — rejected because it doubles the tool count without adding expressiveness and leaves ambiguity about which tool to use.

### 2. Mutual exclusivity between single-wire and batch params

**Decision**: If `connections` is provided, `toNodeId` and `outputPort` are ignored. If `connections` is absent, the existing `fromNodeId` + `outputPort` + `toNodeId` path is used.

**Rationale**: Avoids ambiguous merging of two modes. Simple rule, easy to document.

### 3. `clearPort` flag on `disconnect-nodes`

**Decision**: `disconnect-nodes` gains an optional boolean `clearPort` (default `false`). When `true` and used with a single-wire call (`outputPort` specified, `toNodeId` omitted), it removes all targets from that port.

**Rationale**: Common pattern when rewiring a multi-output node — remove everything from port X before reconnecting. Without `clearPort` the AI has to read wires first, then issue N disconnect calls.

**Alternative considered**: Accept `toNodeId` as optional (null = clear all). Rejected because the existing schema declares `toNodeId` required, and making it optional is a broader schema change with more edge cases.

### 4. `applyConnect` / `applyDisconnect` stay pure functions

**Decision**: Keep logic in the pure `apply*` functions, extend them to loop over a `connections` array internally before writing to Node-RED once.

**Rationale**: Existing tests cover the pure functions; extending them keeps coverage straightforward. A single `putFlows` call keeps the operation atomic from Node-RED's perspective.

## Risks / Trade-offs

- **Schema change is additive** — existing callers unaffected, but MCP clients that cache tool schemas must refresh. Mitigation: backwards-compatible defaults.
- **clearPort + connections together** — combining both in one call is not meaningful; server should ignore `clearPort` when `connections` is provided. Mitigation: document clearly and add guard in implementation.
- **Port-count validation gap** — if the caller specifies `outputPort: 5` on a node that only has 2 outputs, Node-RED will accept the wires array but the visual editor may display incorrectly. This was already true before this change; no regression.
