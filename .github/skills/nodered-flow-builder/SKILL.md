---
name: nodered-flow-builder
description: >-
  Step-by-step operational guide for building, editing, testing, and debugging Node-RED flows using MCP tools.
tools:
  - refresh-staging
  - deploy
  - get-staging-status
  - get-flows
  - get-config-nodes
  - get-subflows
  - get-flow-nodes
  - get-flow-diagram
  - get-node-detail
  - create-flow
  - update-flow
  - delete-flow
  - create-node
  - update-node
  - delete-node
  - create-subflow
  - update-subflow
  - delete-subflow
  - create-subflow-instance
  - add-nodes-to-group
  - remove-nodes-from-group
  - update-group
  - connect-nodes
  - disconnect-nodes
  - export-flow
  - import-flow
  - inject-message
  - read-debug-messages
  - get-context
  - search-nodes
---

# Node-RED Flow Builder

Step-by-step operational guide for building, editing, testing, and debugging Node-RED flows via MCP tools. Follow the numbered sequences exactly.

> **Prerequisites:** Read `nodered-fundamentals` first for core vocabulary. Use `nodered-node-reference` for node type properties.

---

## 🔄 ALWAYS Sync Before Editing

**Before starting ANY workflow** (create, edit, delete, import), you MUST sync the staging state with the server. Follow this two-step sequence in order:

### Step 0a: Refresh staging (MANDATORY — do this FIRST)
```
refresh-staging()
```

⚠️ **CRITICAL:** This is the very first operation before ANY editing session. It discards any stale un-deployed changes and re-fetches the latest flow state from Node-RED. This prevents version mismatch errors (HTTP 409) when deploying. If you skip this step and the Node-RED editor has been used to modify flows, your deploy will fail and ALL your staged changes will be lost.

> **When to refresh:** Always call `refresh-staging` at the start of a new editing session. After deploy, staging is automatically synced — no manual refresh needed.

### Step 0b: Read current state
```
get-flows()
get-config-nodes()
get-subflows()
```

This returns the current list of flow tabs, their IDs, labels, node counts, lock status, config nodes, and subflows. Use this information to:
- Confirm the target flow exists and get its correct `flowId`
- Check if a flow is **locked** before attempting edits (locked flows reject modifications)
- Identify which flow to work on when the user refers to it by name
- Discover existing config nodes (groups, brokers, etc.) and subflows

**After every `deploy`**, the staging store automatically re-fetches flows from the server — you do NOT need to call `refresh-staging` or `get-flows` manually after deploy. The internal state is already synced.

---

## Workflow A — Build a Flow from Scratch

The primary workflow for creating a new flow. Follow these steps in order:

### Step 1: Create a flow tab
```
create-flow(label: "My Flow", info: "Description of what this flow does")
```
Save the returned `flowId` — you need it for every subsequent step.

### Step 2: Create nodes (one by one)
```
create-node(type: "inject", flowId: "<flowId>", properties: { name: "Trigger", payload: "hello", payloadType: "str" }, x: 100, y: 100)
create-node(type: "function", flowId: "<flowId>", properties: { name: "Transform", func: "msg.payload = msg.payload.toUpperCase();\nreturn msg;", outputs: 1 }, x: 300, y: 100)
create-node(type: "debug", flowId: "<flowId>", properties: { name: "Output", complete: "payload", targetType: "msg" }, x: 500, y: 100)
```
Save all returned `nodeId` values.

**💡 Setting a node description:** Add `info` to the `properties` object:
```
create-node(type: "ping", flowId: "<flowId>", properties: { name: "Ping", host: "192.168.1.1", info: "Pings the main server" }, x: 300, y: 100)
```
The `info` field corresponds to the **Description** shown in the Node-RED editor UI. When a user asks to "add a description" or "describe the node", they mean setting `info`.

**💡 Creating comment nodes:** Use `type: "comment"` to annotate flows. The `name` field is a **short label** (1-3 words, visible on canvas). Use `info` for detailed documentation (tooltip on hover):
```
create-node(type: "comment", flowId: "<flowId>", properties: { name: "My Section", info: "Detailed notes about this section of the flow" }, x: 100, y: 300)
```

**💡 Switch nodes — always set `outputs` explicitly:**
- **switch:** Set `outputs` to `rules.length`. Without it, the editor defaults to 1 visible port even if wires are connected. Also set `repair: false` and `checkall: "false"` (string, not boolean).

### Step 3: Wire nodes together
```
connect-nodes(fromNodeId: "<injectId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<debugId>")
```
**Critical:** Always wire after creating nodes. An unwired node is isolated and will never receive messages.

### Step 4: Verify the flow
```
get-flow-diagram(flowId: "<flowId>")
```
Review the Mermaid diagram. Confirm all nodes appear and wires connect as expected.

### Step 5: Deploy changes
**CRITICAL — Changes are staged, not live!** All create-node, connect-nodes, update-node, etc. operations stage changes in a local workspace. They are NOT active until you deploy:
```
deploy(deployType: "nodes")
```
Default deploy type is `"nodes"` (least disruptive — only modified nodes restart). Use `"flows"` to restart modified flow tabs, or `"full"` for a complete restart.

Check what's pending before deploying:
```
get-staging-status()
```

**🔄 Post-deploy sync:** The deploy tool automatically refreshes all flows from the server after a successful deploy. The staging store is always in sync with Node-RED after deploy completes — no manual refresh needed.

### Step 6: Test the flow
```
inject-message(nodeId: "<injectId>")
read-debug-messages(nodeName: "<debugNodeName>", last: 5)
```

**⚠️ Important:** You MUST deploy before testing. `inject-message` will error if there are undeployed changes.

---

## Port Numbering

All output ports are **0-indexed**. Port 0 is the leftmost output on the node.

```
 ┌──────────┐
 │  switch  │── port 0 (output 1)
 │          │── port 1 (output 2)
 │          │── port 2 (output 3)
 └──────────┘
```

**Example — switch node with 3 routes:**
```
connect-nodes(fromNodeId: "<switchId>", outputPort: 0, toNodeId: "<route1Id>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 1, toNodeId: "<route2Id>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 2, toNodeId: "<route3Id>")
```

**Batch wiring** (wire multiple ports in one call):
```
connect-nodes(fromNodeId: "<switchId>", connections: [
  { outputPort: 0, toNodeId: "<route1Id>" },
  { outputPort: 1, toNodeId: "<route2Id>" },
  { outputPort: 2, toNodeId: "<route3Id>" }
])
```

> ⚠️ **Never set `wires` in `update-node` properties.** Wiring is managed exclusively through `connect-nodes` and `disconnect-nodes`.

---

## Coordinate Grid & Node Dimensions

Node positions on the canvas follow a grid pattern to keep flows readable and avoid overlapping nodes. Understanding node dimensions is critical for calculating proper coordinates.

###  Standard Node Dimensions

Based on empirical measurements from Node-RED editor:

| Node Type | Width (px) | Height (px) | Notes |
|-----------|------------|-------------|-------|
| **Standard function/debug/inject** | ~160 | ~40 | Short names (≤20 chars) |
| **Long name function** | ~320+ | ~40 | Names >30 chars expand width |
| **Config nodes** | ~180 | ~40 | Slightly wider than standard |
| **Function w/ 1-3 outputs** | ~160 | ~40 | Height stays at ~40px |
| **Function w/ 4-5 outputs** | ~160 | ~60 | Height jumps ~20px at 4+ outputs |
| **Higher outputs (6+)** | ~160 | ~80+ | Extrapolated; verify empirically |

**Key observations:**
- All nodes have consistent **width** (~160px for standard names) regardless of output count
- Width varies based on node name length, NOT number of outputs
- Multiple output ports stack vertically on the right side — they do NOT expand width
- Height is stable (~40px) for 1-3 outputs, then jumps to ~60px at 4+ outputs
- Ports are positioned ~15px from left/right edges
- Minimum safe horizontal spacing between connected nodes: **120px center-to-center** (160px recommended)
- Minimum safe vertical spacing between rows: **40px center-to-center** for 1-3 outputs, **60px** for 4+ outputs

**Important:** When placing nodes with many outputs (4+), increase vertical spacing to avoid port overlap with adjacent rows. Use +60px Y delta instead of +40px.

### 📐 Height Formula (by output count)

Node height is **fixed at ~40px** for up to 3 outputs, then increases in ~20px steps for every additional group of 3 outputs:

```javascript
/**
 * Estimate a function node's height based on output count.
 * @param {number} outputs - Number of output ports (1-based)
 * @returns {number} Estimated height in pixels
 */
function estimateNodeHeight(outputs) {
  const baseHeight = 40;   // minimum height for 1-3 outputs
  const stepHeight = 20;   // extra height per group of 3 additional outputs
  const groupSize  = 3;    // outputs per height group
  const extra = Math.max(0, Math.floor((outputs - 1) / groupSize));
  return baseHeight + extra * stepHeight;
}
```

**Quick reference:**
| Outputs | Height | ΔY to next row |
|---------|--------|----------------|
| 1–3     | 40px   | +40px          |
| 4–6     | 60px   | +60px          |
| 7–9     | 80px   | +80px          |
| 10–12   | 100px  | +100px         |

```javascript
// When placing the next row, use the taller node's height:
const nextY = currentY + estimateNodeHeight(currentOutputs);
```

### 🎯 Positioning Guidelines

**📍 CRITICAL: First Node Position**

The first node in ANY flow MUST start at coordinates **(x=120, y=80)**. This is the absolute top-left starting point — nothing should be placed above y=80 or to the left of x=120. (When using groups with comments, the first node may shift down by ~30-50px to accommodate the group header.)

| Convention | X | Y | Use Case |
|------------|---|---|----------|
| **FIRST NODE (mandatory)** | **120** | **80** | **Absolute starting point** |
| Inline next node | +**180** | same Y | Sequential processing nodes (170-190px range) |
| Debug adjacent | +**10** | ±**40** | Debug alongside predecessor, above or below |
| Branch down (1-3 outs) | same X | +**60** | Alternative path from switch |
| Branch down (4+ outs) | same X | +**80** | Extra space for taller nodes |
| Branch row | +180 | +60 | Alternative row for complex branches |

```
─────────────────────────────────────────────────────────┐
│  CANVAS BOUNDARY                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │   [120,80] ← FIRST NODE STARTS HERE                │ │
│  │      ↓                                              │ │
│  │   Row 1: [inject]──(+200)──[function]──(+200)──[debug] │
│  │                             │                        │ │
│  │   Row 2:                    └─(+200, +60)──[debug:error] │
│  │                                                     │ │
│  │  ⚠️ Nothing above y=80 or left of x=120            │ │
│  └─────────────────────────────────────────────────────┘ │
─────────────────────────────────────────────────────────┘
```

**Why (120, 80)?**
- Provides adequate margin from canvas edges
- Matches Node-RED's default grid alignment
- Ensures consistent positioning across all flows
- Leaves room for node icons and ports without clipping

> 📐 **For advanced layout rules** (debug placement, branch-point centering, group spacing, comment positioning, bounding-box calculations), see **`nodered-flow-layout`**.

### 📐 Calculating Coordinates for Long Names

When placing nodes with long names, calculate width dynamically:

```javascript
// Estimate node width based on name length
function estimateNodeWidth(nodeName) {
  const baseWidth = 160; // minimum width for short names
  const charWidth = 8;   // approximate pixels per character
  const padding = 40;    // icon + ports padding
  
  const textWidth = nodeName.length * charWidth;
  return Math.max(baseWidth, textWidth + padding);
}

// Example calculations:
estimateNodeWidth("function 1")           // → 160px
estimateNodeWidth("This is a very long function name")  // → ~320px
```

**Placement strategy for long-name nodes:**
1. Calculate estimated width using formula above
2. Add extra horizontal spacing: `nextX = currentX + estimatedWidth + 40`
3. This ensures cables remain visible and nodes don't overlap

### ️ Important Rules

- **Never place two nodes at the same (x, y)** — they visually overlap
- **Keep connected nodes within ~400px horizontally** for readability
- **Account for name length** when positioning — long names need more space
- **Locked flows**: `create-node`, `update-node`, `delete-node`, `connect-nodes`, and `disconnect-nodes` all refuse to modify nodes in a locked flow. Check flow lock status with `get-flows`.

### 🔍 Real-World Example

From actual Node-RED deployment analysis:

```
Flow layout with 8 function nodes:

Row 1 (y=80):
  • function 1: x=120, y=80
  • function 2: x=240, y=80   ← Δx = 120px (standard spacing)

Row 2 (y=120):
  • function 3: x=120, y=120
  • function 4: x=240, y=120  ← Δx = 120px

Row 3 (y=160):
  • function 5: x=120, y=160
  • function 6: x=240, y=160  ← Δx = 120px

Row 4 (y=200):
  • Long name node: x=200, y=200
  • function 7:     x=400, y=200  ← Δx = 200px (extra space for long name)
```

**Takeaway:** Standard nodes use 120px spacing, but long-name nodes require 200px+ to prevent overlap.

### 🧪 Multi-Output Node Height Test

Empirical test with function nodes (1-5 outputs) placed at y=80 with debug reference nodes below:

```
Test flow: "Node Dimensions Test"

Row 1 (y=80):  [1 output] [2 outputs] [3 outputs] [4 outputs] [5 outputs]
                 x=120      x=280       x=440       x=600       x=760

Row 2 (debug):  [Debug 1]  [Debug 2]   [Debug 3]   [Debug 4]   [Debug 5]
                  y=120      y=120       y=120       y=140       y=140
```

**Results:**
| Outputs | Function Y | Debug Y | ΔY (height) | Node Height |
|---------|-----------|---------|-------------|-------------|
| 1       | 80        | 120     | 40px        | ~40px       |
| 2       | 80        | 120     | 40px        | ~40px       |
| 3       | 80        | 120     | 40px        | ~40px       |
| 4       | 80        | 140     | 60px        | ~60px       |
| 5       | 80        | 140     | 60px        | ~60px       |

**Key findings:**
- **Width is constant** (~160px) regardless of output count — extra ports stack vertically
- **Height is stable** (~40px) for 1-3 outputs
- **Height jumps** to ~60px at 4+ outputs
- **Horizontal spacing**: 160px between centers works for all output counts
- **Vertical spacing**: Use +40px for 1-3 outputs, +60px for 4+ outputs

**Placement rule for multi-output nodes:**
```javascript
// Use the estimateNodeHeight() formula from the Height section above
const nextY = currentY + estimateNodeHeight(currentOutputs);
```

---

## Workflow B — Import from JSON

Use `import-flow` when you have a pre-built flow JSON (from `export-flow` or an example file):

### Step 1: Choose a conflict strategy
- **`regenerate`** (default, safest): Remaps all IDs to new UUIDs. Always creates a duplicate — safe, no overwrites.
- **`overwrite`**: Replaces nodes with matching IDs. Use to update an existing flow with new configuration.

### Step 2: Import
```
import-flow(flowJson: "<json>", conflictStrategy: "regenerate")
```

### Step 3: (Optional) Target a specific tab
```
import-flow(flowJson: "<json>", targetFlowId: "<existingFlowId>")
```
This injects all non-tab nodes into the target tab. The tab node in the JSON is discarded.

**When to prefer import over build-from-scratch:**
- Duplicating or migrating an existing flow between instances
- Applying a known-good template from examples
- Restoring a flow from a backup (exported with `export-flow`)

---

## Workflow C — Edit an Existing Node

### Step 1: Read current state
```
get-node-detail(nodeId: "<nodeId>")
```
Review the returned node object to understand current configuration.

### Step 2: Apply changes
```
update-node(nodeId: "<nodeId>", properties: { name: "New Name", func: "return msg;" })
```
Only include fields you want to change. Omitted fields are preserved.

**💡 Adding or updating a description:** Set the `info` property — the **Description** field in the Node-RED editor UI:
```
update-node(nodeId: "<nodeId>", properties: { info: "This node filters messages with temperature > 30°C" })
```

### Step 3: Verify
```
get-node-detail(nodeId: "<nodeId>")
```
Confirm the changes took effect.

**🛑 Never include `wires`, `id`, or `z` in `properties`.** The tool silently ignores them.

---

## Workflow D — Delete

### Delete a single node
```
delete-node(nodeId: "<nodeId>")
```
Node-RED automatically cleans up dangling wire references on deploy. The `previousState` in the response contains the full node object — save it if you need to undo.

### Delete an entire flow tab
```
delete-flow(flowId: "<flowId>")
```
Returns `previousState` with ALL nodes in the tab. Refuses to delete locked flows.

**Undo a deletion:** Use `import-flow` with the `previousState` from the delete response and strategy `"regenerate"`.

---

## 🐛 Build & Debug Step-by-Step (RECOMMENDED)

**When building a new flow, validate each node's output before adding the next node.** This catches format errors, type mismatches, and missing properties early — before you've built 10 nodes on top of a broken foundation.

### The Golden Rule
> After EVERY processing node you add, wire it to a `debug` node, deploy, inject, and verify the output. Only then add the next node.

### Step-by-step pattern

```
// 1. Create first processing node + debug after it
create-node(type: "inject", flowId: "<fid>", properties: { name: "Start", payload: "test", payloadType: "str" }, x: 100, y: 100)
create-node(type: "debug", flowId: "<fid>", properties: { name: "Debug1", complete: "true", targetType: "full" }, x: 300, y: 100)
connect-nodes(fromNodeId: "<injectId>", toNodeId: "<debug1Id>")

// 2. Deploy — changes are NOT live until you do this
deploy()

// 3. Inject and check output format
inject-message(nodeId: "<injectId>")
read-debug-messages(last: 1)

// 4. If output looks good, remove the debug node (or keep it) and add next node
delete-node(nodeId: "<debug1Id>")
create-node(type: "function", flowId: "<fid>", properties: { name: "Process", func: "msg.payload = msg.payload * 2;\nreturn msg;", outputs: 1 }, x: 300, y: 100)
connect-nodes(fromNodeId: "<injectId>", toNodeId: "<functionId>")
create-node(type: "debug", flowId: "<fid>", properties: { name: "Debug2", complete: "true", targetType: "full" }, x: 500, y: 100)
connect-nodes(fromNodeId: "<functionId>", toNodeId: "<debug2Id>")

// 5. Deploy again and verify
deploy()
inject-message(nodeId: "<injectId>")
read-debug-messages(last: 1)

// 6. Repeat until flow is complete
```

**Why this matters:**
- A `function` node might return `undefined` or the wrong type — you catch it immediately
- A `change` node might not set the right property — you see it in debug output
- An `http request` might return unexpected JSON structure — you can adjust before building downstream nodes
- You avoid debugging a 10-node chain where the error is in node #2

**⚠️ NEVER FORGET TO DEPLOY.** Every edit is staged. If `inject-message` errors with "undeployed changes", call `deploy` first.

---

## Debug Workflow

Follow this numbered sequence whenever a flow doesn't behave as expected:

### 1️⃣ Ensure debug nodes are active
```
get-flow-nodes(flowId: "<flowId>", nodeType: "debug")
```
Check that each debug node has `active: true`. If not:
```
update-node(nodeId: "<debugId>", properties: { active: true })
```

### 2️⃣ Record a timestamp
Note the current time (e.g., `Date.now()`) before triggering. This gives you an `after` filter anchor for `read-debug-messages`.

### 3️⃣ Trigger the flow
```
inject-message(nodeId: "<injectId>")
```
Use `nodeId` (not name) when possible — it's unambiguous.

### 4️⃣ Wait briefly then read
Node-RED processes messages asynchronously. Wait ~500ms-1s, then:
```
read-debug-messages(nodeName: "<debugNodeName>", after: <timestamp>, limit: 10)
```
The `after` filter ensures you only see messages from this test run.

### 5️⃣ Analyze the output
Check `payload`, `topic`, and any custom properties. Is the value what you expected? Is the type correct?

### 6️⃣ Fix and repeat
Make the needed changes (via `update-node`, function `func` edit, or wiring fix), then repeat from step 2.

---

## Debug Node Configuration

| Property | Values | Description |
|----------|--------|-------------|
| `active` | `true/false` | Enable/disable output. Disabled nodes collect nothing. |
| `complete` | `"true"` (full msg), `"false"` (payload only), or property path like `"payload.temperature"` | What to display |
| `targetType` | `"full"` or `"msg"` | Use `"msg"` when `complete` is a property path |
| `console` | `true/false` | Also log to Node-RED server console |
| `tosidebar` | `true/false` | Display in debug sidebar (required for `read-debug-messages`) |

**Recommended debug node for flow validation:**
```
{ active: true, complete: "true", targetType: "full", tosidebar: true, console: false }
```
This captures the entire message — you can inspect all properties during debugging.

---

## inject-message Usage

Trigger an inject node to start a message through the flow:

```
// By nodeId (preferred — always unique)
inject-message(nodeId: "<injectId>")

// By name (convenient, but fails if duplicate names exist)
inject-message(name: "Trigger")
```

**Important notes:**
- The target node MUST be of type `"inject"`. Other node types will error.
- Injection is asynchronous — the command returns immediately, the message flows through Node-RED in the background.
- Use `flowId` to scope name-based lookups: `inject-message(name: "Trigger", flowId: "<flowId>")`.
- If multiple inject nodes share the same name without a `flowId`, the tool returns an error listing the matching IDs — pick one.

---

## read-debug-messages Filters

| Filter | Type | Use Case |
|--------|------|----------|
| `nodeId` | string | Pinpoint output from a specific debug node |
| `nodeName` | string | Match by name (case-insensitive substring) |
| `keyword` | string | Search within stringified message payload |
| `after` | timestamp (ms) | Only messages after this time (use `Date.now()` before trigger) |
| `before` | timestamp (ms) | Only messages before this time |
| `last` | number | Return the N most recent matching messages |
| `limit` | number | Return the first N matching messages (default 50) |

`last` and `limit` are **mutually exclusive** — use one or the other, not both.

**Typical debug read:**
```
read-debug-messages(nodeName: "Output", after: 1717526400000, last: 5)
```

---

## Common Debug Patterns

### "Is my flow even triggered?"
```
inject-message(nodeId: "<injectId>")
read-debug-messages(nodeName: "<firstDebugName>", last: 1)
```
If no message appears: check wiring (especially `connect-nodes`), verify the inject node fires, and confirm the debug node is on the same tab.

### "What is the payload at this point?"
Place a temporary debug node after the suspect node:
```
create-node(type: "debug", flowId: "<flowId>", properties: { name: "Checkpoint", complete: "true", targetType: "full" }, x: <afterNodeX>, y: <sameY>)
connect-nodes(fromNodeId: "<suspectNodeId>", outputPort: 0, toNodeId: "<checkpointId>")
```
Trigger, read, diagnose, then delete the checkpoint node.

### "Is my context value set?"
```
get-context(scope: "flow", id: "<flowId>", key: "myKey")
```
If `null`: your function node's `context.set()` or `flow.set()` isn't executing. Check that the function node is actually receiving messages.

### "Why is my function node not working?"
```
get-node-detail(nodeId: "<functionId>")
```
Review the `func` property. Common issues: missing `return msg;`, syntax errors, wrong property names.

---

## Verification

After building or modifying a flow, always verify:

### 1. Topology check
```
get-flow-diagram(flowId: "<flowId>")
```
Confirm the Mermaid diagram shows correct wiring — every node connected as intended, no dangling branches.

### 2. Inventory check
```
get-flow-nodes(flowId: "<flowId>")
```
Verify node count, types, and names. Look for:
- Unnamed nodes (`"name": ""`) — give them descriptive names
- Wrong node types — did you accidentally pick the wrong type?
- Missing nodes — did all your `create-node` calls succeed?

### 3. Wire check
Look at the `wires` arrays in `get-flow-nodes` output. Each source node should have its expected targets listed.

### 4. Functional test
Inject a message and read debug output. Confirm the payload transforms as expected at each step.

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **Not wiring after create** | New node never receives messages | Always call `connect-nodes` after `create-node`. Use the INSERT pattern: disconnect A→B, connect A→new, connect new→B |
| **Wrong port index** | Message goes to wrong output | Ports are 0-indexed. Switch output 1 = port 0, output 2 = port 1, output 3 = port 2 |
| **Setting wires in update-node** | Wires silently ignored | Use `connect-nodes`/`disconnect-nodes` exclusively for wiring |
| **Overlapping coordinates** | Nodes visually stack in editor | Use the grid: first at (100,100), inline +200 X, branch +100 Y |
| **Forgetting `return msg;`** in function | Message stops at function node | Every function must `return msg;` (or `return [msg1, msg2]` for multi-output). `return null;` explicitly stops the message |
| **`node.send()` without `return`** | Unpredictable behavior, duplicate messages | After calling `node.send()` in async code, ALWAYS `return;` immediately |
| **Debug node with `active: false`** | No output visible | Set `active: true` on all debug nodes used for testing |
| **Reading debug too soon** | `read-debug-messages` returns empty | Wait ~500ms after `inject-message` before reading; Node-RED processes asynchronously |
| **Deleting without backup** | Cannot undo accidental deletion | Use `export-flow` before destructive operations; `delete-*` responses include `previousState` for recovery |
| **Modifying locked flow** | Tool returns error | Check `get-flows` for `locked: true`; locked flows must be unlocked in the editor first |
