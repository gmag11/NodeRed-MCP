---
name: nodered-subflows
description: >-
  Comprehensive guide for working with Node-RED subflows via MCP tools.
  Covers subflow vocabulary, discovery, creation from scratch, instantiation,
  editing, export/import, deletion, common patterns, and limitations.
tools:
  - get-subflows
  - get-subflow-detail
  - create-subflow
  - update-subflow
  - delete-subflow
  - create-subflow-instance
  - export-subflow
  - import-flow
---

# Node-RED Subflows

Comprehensive guide for creating, managing, and using Node-RED subflows via MCP tools.

> **Prerequisites:** Read `nodered-fundamentals` first for core vocabulary and `nodered-flow-builder` for basic flow construction patterns.

---

## Subflow Vocabulary

A subflow is a **reusable, encapsulated flow** that can be instantiated multiple times across different flow tabs. It has three layers in the Node-RED JSON:

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUBFLOW MODEL                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEFINITION (type: "subflow")                                 │
│     - id, name, info (markdown description)                      │
│     - in  → input port definitions (where messages enter)        │
│     - out → output port definitions (where messages exit)        │
│     - category, color, icon → palette metadata                   │
│                                                                  │
│  2. INTERNAL NODES (z = subflowId)                               │
│     - Regular nodes placed inside the subflow canvas             │
│     - Wired together to form the internal logic                  │
│     - Managed with the same tools as flow tab nodes              │
│                                                                  │
│  3. INSTANCES (type: "subflow:<subflowId>")                      │
│     - Placed in flow tabs (z = tabId)                            │
│     - Each has its own name, env vars, and wire connections      │
│     - Output wires auto-size to match definition's out ports     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Key properties

| Concept | Field | Example |
|---------|-------|---------|
| Subflow ID | `id` | `"7b6d939fa36f99ef"` |
| Instance type | `type` | `"subflow:7b6d939fa36f99ef"` |
| Internal parent | `z` | `z = "7b6d939fa36f99ef"` |
| Instance location | `z` | `z = "c9a401de7611c87e"` (tab ID) |
| Input ports | `in` | Array of `{ x, y, wires: [{ id, port }] }` |
| Output ports | `out` | Array of `{ x, y, wires: [{ id, port }] }` |
| Instance env vars | `env` | Array of `{ name, value, type }` |

---

## Workflow A — Discover Available Subflows

### Step 1: List all subflows
```
get-subflows()
```
Returns enriched summary of each subflow: name, description, input/output counts, internal node types, instance count and locations.

### Step 2: Inspect a subflow deeply
```
get-subflow-detail(subflowId: "<subflowId>")
```
Returns the full definition, all internal nodes (with sanitized configs), all instances and their locations, and a Mermaid diagram of the internal flow. **Always call this before instantiating or modifying a subflow** to understand what it does.

---

## Workflow B — Create a Subflow from Scratch

Follow these steps in exact order:

### Step 1: Create the subflow definition (empty container)
```
create-subflow(name: "My Subflow", info: "Processes incoming data and routes by type")
```
Save the returned `subflowId` — you'll use it as `flowId` for internal nodes.

### Step 2: Populate internal nodes
```
create-node(type: "mqtt in", flowId: "<subflowId>", properties: { topic: "test/#", broker: "<brokerId>" }, x: 100, y: 100)
create-node(type: "switch", flowId: "<subflowId>", properties: { property: "topic", outputs: 3 }, x: 300, y: 100)
create-node(type: "debug", flowId: "<subflowId>", properties: { complete: "payload" }, x: 500, y: 100)
```
Use `<subflowId>` as `flowId` — the same `create-node` tool works for subflow internals.

### Step 3: Wire internal nodes
```
connect-nodes(fromNodeId: "<mqttId>", outputPort: 0, toNodeId: "<switchId>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 0, toNodeId: "<debugId>")
```

### Step 4: Define input/output ports
```
update-subflow(subflowId: "<subflowId>", updates: {
  out: [
    { x: 600, y: 100, wires: [{ id: "<switchId>", port: 0 }] },
    { x: 600, y: 180, wires: [{ id: "<switchId>", port: 1 }] },
    { x: 600, y: 260, wires: [{ id: "<switchId>", port: 2 }] }
  ]
})
```
**Important:** Port wires must reference internal node IDs. The `x`/`y` values are the port position on the subflow's input/output bar in the UI.

### Step 5: Verify
```
get-subflow-detail(subflowId: "<subflowId>")
```
Check the Mermaid diagram shows correct internal wiring.

---

## Workflow C — Instantiate a Subflow in a Flow Tab

### Basic instantiation
```
create-subflow-instance(
  subflowId: "<subflowId>",
  flowId: "<tabId>"
)
```
The tool auto-sizes output wires to match the subflow's output port count. Returns `nodeId`.

### With environment variables
```
create-subflow-instance(
  subflowId: "<subflowId>",
  flowId: "<tabId>",
  name: "Sensor Processor",
  env: [
    { name: "THRESHOLD", value: "42", type: "num" },
    { name: "API_URL", value: "https://example.com", type: "str" }
  ]
)
```
Environment variables are passed to internal nodes. Inside a function node, access them with `env.get("THRESHOLD")`.

### Wire the instance outputs
```
connect-nodes(fromNodeId: "<instanceId>", outputPort: 0, toNodeId: "<target1Id>")
connect-nodes(fromNodeId: "<instanceId>", outputPort: 1, toNodeId: "<target2Id>")
```
Each output port corresponds to one entry in the subflow's `out` array (0-indexed).

---

## Workflow D — Editing Subflows

### Editing metadata or ports
```
update-subflow(subflowId: "<subflowId>", updates: {
  name: "New Name",
  info: "Updated description",
  out: [ ... new port definitions ... ]
})
```
Only allowed fields are updated: `name`, `info`, `category`, `color`, `icon`, `in`, `out`. All other fields are preserved.

### Editing internal nodes
Use the standard tools with `flowId` set to the subflow ID:
```
update-node(nodeId: "<internalNodeId>", properties: { ... })
connect-nodes(fromNodeId: "<a>", toNodeId: "<b>")
disconnect-nodes(fromNodeId: "<a>", toNodeId: "<b>")
create-node(type: "function", flowId: "<subflowId>", ...)
delete-node(nodeId: "<internalNodeId>")
```

### Editing an instance
Instances are just nodes — use standard tools:
```
update-node(nodeId: "<instanceId>", properties: { name: "New Name", env: [...] })
```

---

## Workflow E — Exporting and Importing

### Export a subflow
```
export-subflow(subflowId: "<subflowId>")
```
Returns a JSON string containing the subflow definition, all internal nodes, and any referenced config nodes (e.g., mqtt-broker). Instances are NOT included — they belong to their parent flow tabs.

### Import (duplicate or restore)
```
import-flow(flowJson: "<exportedJson>", conflictStrategy: "regenerate")
```
Use `"regenerate"` to create a safe duplicate with new IDs. Use `"overwrite"` to replace an existing subflow by ID.

---

## Workflow F — Deleting a Subflow

### Cascade delete (default, safest)
```
delete-subflow(subflowId: "<subflowId>")
```
Removes: the subflow definition + all internal nodes + all instances. The `previousState` response enables undo via `import-flow`.

### Delete definition only, keep instances
```
delete-subflow(subflowId: "<subflowId>", deleteInstances: false)
```
⚠️ **Dangerous**: instances become orphan nodes of type `subflow:<deletedId>`. They will appear as "unknown" in the Node-RED UI. Only use this when migrating instances to a new subflow.

### Recover from deletion
```
import-flow(flowJson: JSON.stringify(previousState.definition, ...previousState.internalNodes, ...previousState.instances), conflictStrategy: "regenerate")
```

---

## Common Patterns

### Parametrized subflow pattern
Create a subflow with env variables for configuration:
1. Define the subflow with a function node reading `env.get("PARAM")`
2. Instantiate with different `env` values per instance
3. Each instance behaves differently based on its env vars

### Subflow as data pipeline
```
[tab: Main Flow]
  [mqtt in] → [subflow instance: Transform] → [debug]
                           │
[tab: Analytics]           │
  [http in] → [subflow instance: Transform] → [http response]
```
Same subflow, different contexts.

### When to use subflows vs link nodes vs tabs
- **Subflow**: Reusable logic with configurable parameters (env vars)
- **Link nodes**: Cross-tab message passing without duplication
- **Separate tabs**: Organizational separation, not functional reuse

---

## Limitations

- **No nested subflows**: Node-RED's UI does not support placing a subflow instance inside another subflow. While technically possible in JSON, the UI will not render it correctly.
- **UI refresh required**: Subflow changes made via MCP tools may not be immediately visible in the Node-RED editor. The user may need to refresh the browser.
- **Port wiring**: Input/output port `wires` in the subflow definition must reference internal node IDs. Invalid references will cause a deploy error.
- **Config node sharing**: Config nodes (mqtt-broker, etc.) referenced by subflow internal nodes are included in `export-subflow` but shared across instances at runtime.
