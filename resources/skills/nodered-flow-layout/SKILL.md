---
name: nodered-flow-layout
description: >-
  Comprehensive rules for positioning and arranging nodes in Node-RED flows.
  Covers debug node placement, vertical centering around branch points,
  horizontal spacing standards, comment placement, group spacing, and
  bounding-box calculations. Use whenever creating or rearranging multi-node
  flows to ensure visual clarity and avoid overlapping elements.
tools:
  - refresh-staging
  - get-flows
  - get-flow-nodes
  - create-node
  - add-nodes-to-group
  - remove-nodes-from-group
  - update-group
  - update-node
  - deploy
---

# Node-RED Flow Layout

Positioning rules extracted from real-world flow analysis. These ensure flows are readable, well-organized, and visually balanced. Use these rules when creating multi-node flows, adding groups, or rearranging existing flows.

> **Prerequisites:** Read `nodered-fundamentals` for core vocabulary. See `nodered-flow-builder` for node dimension tables and the `estimateNodeHeight()` formula.

---

## 1️⃣ Debug Node Placement

Debug nodes can be placed **above** or **below** the node they monitor, never on the same horizontal row — unless they are the final terminal node of a branch.

| Scenario | Placement | ΔY | Example |
|----------|-----------|-----|---------|
| Intermediate debug | Above source node | −40px | `Alerts (y=540)` above `Alert (y=580)` |
| Intermediate debug | Below source node | +40px | `Out A (y=120)` below `Process A (y=80)` |
| Terminal debug (end of branch) | Same row as predecessor | +0px | Allowed only if no further nodes follow |

```
✅ CORRECT:
  [function: Alert]               [function: Alert]
       ↓                                   ↓
  [debug: Alerts] (y−40)          [debug: Alerts] (y+40)

✅ CORRECT (terminal only):
  [function: Process A]──[debug: Out A]   (same y, end of branch)

❌ WRONG:
  [function: Alert]──[debug: Alerts]──[function: Next]   (debug inline in middle of chain)
```

**Rule of thumb:** Debug nodes are diagnostic tools. Place them where they don't interrupt the visual flow of the main processing chain. Above/below their source node keeps the main row clean.

---

## 2️⃣ Vertical Centering Around Branch Points

### Before a split (switch / multi-output)

Position the splitting node at the **vertical midpoint** of its output branches.

```javascript
/**
 * Calculate the Y position for a node that fans out to multiple branches.
 * @param {number[]} branchYValues - Y coordinates of each branch target
 * @returns {number} Centered Y coordinate
 */
function centerYForSplit(branchYValues) {
  const sum = branchYValues.reduce((a, b) => a + b, 0);
  return Math.round(sum / branchYValues.length);
}
```

```
Example: Route switch → 3 branches at y=80, y=220, y=400
  centerY = (80 + 220 + 400) / 3 = 233 → rounded to 220
  Route placed at y=220 ✓

Example: Threshold? switch → 2 branches at y=580, y=680
  centerY = (580 + 680) / 2 = 630 → rounded to 640
  Threshold? placed at y=640 ✓
```

### After a merge (join / link in)

Same principle — position the merged node at the vertical center of its input branches.

```
Branch A (y=200) ──┐
                    ├── [join: Merge] (centered y)
Branch B (y=300) ──┘

  centerY = (200 + 300) / 2 = 250
```

### General centering rule

Whenever N wires converge on or diverge from a single node, that node's Y should equal the **arithmetic mean** of the Y coordinates at the other ends of those wires.

---

## 3️⃣ Horizontal Spacing Standards

| Transition | ΔX | Use Case |
|------------|-----|----------|
| inject → function | **+170 to +190** | Starting a row |
| function → function | **+170 to +200** | Sequential processing |
| function/change → debug (adjacent) | **+10** | Debug alongside predecessor |
| switch → branch node | **+240** | Crossing group boundaries |

```
Measured from real reference flows:
  Start(110) → Validate(290) → Route(480)     Δx = 180, 190
  Sanitize(300) → Enrich(470) → Validate(640)  Δx = 170, 170
  Out A(930) right next to Process A(920)      Δx = 10   (debug adjacent)
```

### Long-name node adjustment

When a node has a name >25 characters, increase the horizontal gap:

```javascript
function spacingForNode(nodeName) {
  const baseSpacing = 180;
  if (nodeName.length > 25) {
    return baseSpacing + (nodeName.length - 25) * 8; // +8px per extra char
  }
  return baseSpacing;
}

// Examples:
spacingForNode("Process A")                        // → 180
spacingForNode("Handle Type C (extended)")         // → 180 + 2*8 = 196 → ~200
```

---

## 4️⃣ Comment Node Placement

| Comment refers to... | Placement | Position |
|----------------------|-----------|----------|
| **A group** | Inside that group | Top of group rectangle (y = group.y + margin) |
| **A single node** | Above the node | Directly above, Δy ≈ −30px |
| **A section (no group)** | Above the first node | Left-aligned with first node, above it |

```
✅ Comments inside groups:
  ┌─ Main Router ─────────────────────────────┐
  │ 🟢 Main Routing Flow — routes by category │  ← comment inside group
  │ [Start] → [Validate] → [Route]            │
  └───────────────────────────────────────────┘

✅ Comment above a single node:
  ⚠️ Alert Path — threshold ≥ 10        ← comment above node (Δy = −30)
  [function: Alert] → [debug: Alerts]
```

**When creating a group with a comment:**
1. Create the comment node first (at the group's intended top)
2. Create the group, including the comment in its `nodeIds`
3. Position functional nodes below the comment within the group

---

## 5️⃣ Group-to-Group Vertical Spacing

When stacking independent groups vertically, use the following spacing conventions:

| Relationship | Gap | Use |
|-------------|-----|-----|
| **Closely related** (branches of same switch) | ~40px | Branch A → Branch B → Branch C |
| **Loosely related** (same flow section) | ~80px | Branch C → Scheduled Pipeline |
| **Unrelated** (different flow section) | ~100px | Scheduled Pipeline → Manual ETL |

### Vertical Packing Formula

Calculate the gap based on what sits between rows:

```javascript
/**
 * Calculate vertical gap between consecutive rows.
 * @param {number} debugCount - Number of debug nodes between rows (0-2)
 * @param {boolean} hasComment - Whether next row starts with a comment
 * @param {string} relationship - 'same-group' | 'related' | 'unrelated'
 * @returns {number} Gap in pixels
 */
function verticalGap(debugCount = 0, hasComment = true, relationship = 'related') {
  const baseGaps = { 'same-group': 40, 'related': 60, 'unrelated': 80 };
  const debugOverhead = debugCount * 20;   // each debug adds half its offset
  const commentOverhead = hasComment ? 10 : 0;
  return baseGaps[relationship] + debugOverhead + commentOverhead;
}

// Examples:
verticalGap(0, true, 'same-group')   // → 50  (comment overhead inside group)
verticalGap(1, false, 'related')     // → 80  (one debug between related groups)
verticalGap(0, true, 'unrelated')    // → 90  (comment to unrelated section)
```

```
Measured from compact layout:

Group A bottom (y + h):  ~310
  ↓  +80px (related sections with debug overhead)
Group B top (y):          ~390

Group B bottom:           ~440
  ↓  +100px (unrelated sections)
Group C top:              ~540
```

---

## 6️⃣ Group Bounding Box Calculation

When creating groups via `add-nodes-to-group`, calculate the bounding box to enclose all member nodes plus any comments:

```javascript
/**
 * Calculate group bounding box from member node positions.
 * @param {Array<{x: number, y: number}>} positions - Node coordinates
 * @param {Object} options
 * @param {number} options.padding - Edge padding (default 20)
 * @param {boolean} options.hasComment - Extra top space for a comment (default true)
 * @returns {{x: number, y: number, w: number, h: number}}
 */
function calculateGroupBounds(positions, options = {}) {
  const { padding = 10, hasComment = true } = options;
  const xs = positions.map(n => n.x);
  const ys = positions.map(n => n.y);

  const topCommentSpace = hasComment ? 30 : 0;

  return {
    x: Math.min(...xs) - padding,
    y: Math.min(...ys) - padding - topCommentSpace,
    w: Math.max(...xs) - Math.min(...xs) + 20,   // 10px margin each side
    h: Math.max(...ys) - Math.min(...ys) + 20 + topCommentSpace  // 10px margin + comment
  };
}

// Usage with add-nodes-to-group:
// const bounds = calculateGroupBounds(memberPositions);
// Then update the group:
// update-group(groupId, { properties: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h } });
```

**Constants used:**
- Node width: **160px** (standard)
- Node height: **40px** (standard, 1-3 outputs), **60px** (4-6 outputs)
- Comment top space: **30px** (allows one line of text)
- Edge padding: **10px** (tight, minimum distance from group border to nodes)

---

## 7️⃣ Compact Layout Principles

These principles produce tighter, more readable flows than the baseline rules alone. Apply after the basic positioning rules above.

### 7.1 Column Grid System

Align every node to a shared set of X columns. Nodes of the same functional role share the same column regardless of which chain they belong to. This creates a grid that is easier to scan and reduces total width.

| Column | X    | Node types                                    |
|--------|------|-----------------------------------------------|
| C0     |  120 | `inject`, `http in`, `comment`                |
| C1     |  300 | `function` (Δx = 180 from C0)                 |
| C2     |  480 | `http response`, `template`, `debug` (mid-chain) |
| C3     |  660 | `http response` (extended chain, Δx = 180 from C2) |
| C4     |  840 | `change`, `switch` (branch processing, Δx = 240 from C3) |
| C5     | 1020 | `debug` (terminal, end of branch, Δx = 180 from C4) |

```
Column alignment example (top-down view):

 C0 (120)    C1 (300)    C2 (480)    C3 (660)    C4 (780)    C5 (1000)
 ──────────────────────────────────────────────────────────────────────
 [HTTP In] → [Function] → [Response]                          [Debug]  ← status chain
 [HTTP In] → [Function] → [Template] → [Response]                      ← health chain
 [Inject ] → [Function] → [Debug]                                       ← test chain
 [Comment]              [Switch  ] → [Change]              → [Debug]    ← alert chain
                                 ↘ [Change]              → [Debug]
                                 ↘ [Delay ]              → [Debug]
```

### 7.2 Switch Bridge Placement

When a switch node bridges two groups (source group → switch → target group with branches), position it close to its source, not centered among its branches:

```javascript
/**
 * Y for a switch bridging between groups.
 * @param {number} sourceY - Y of the upstream node
 * @param {number[]} branchYValues - Y coordinates of branch targets
 * @returns {number} Switch Y position
 */
function switchBridgeY(sourceY, branchYValues) {
  const minBranch = Math.min(...branchYValues);
  // Hug the top of the branches, but don't go above source + 40
  return Math.max(sourceY + 40, minBranch - 20);
}

// Example: source at y=80, branches at [560, 660, 780]
//   max(80+40, 560-20) = max(120, 540) = 540
//   switch at y=540 ✓ (close to source, near top of branches)
```

| Rule | Old (center) | New (bridge) |
|------|-------------|--------------|
| Switch Y | avg(branches) → 660 | max(source+40, min(branch)-20) → 540 |
| Visual effect | Switch floats mid-group | Switch hugs top, wire shorter |

### 7.3 Debug-on-Response

When a debug node shares its X column with an `http response` or terminal node, place it **on the response**, offset vertically by −20px, rather than on the source function:

```
❌ Debug on function:               ✅ Debug on response:
[Func]──[Resp]                      [Func]──[Resp]
    ↘ [Debug] (y-40)                    [Debug] (y-20, shares X with Resp)
```

```javascript
function debugY(sourceNode, sameColumnNode) {
  // If debug shares X with a terminal node, attach to terminal
  if (sameColumnNode && isTerminal(sameColumnNode)) {
    return sameColumnNode.y - 20;
  }
  // Otherwise, standard ±40px from source
  return sourceNode.y - 40;
}
```

### 7.4 Tight Group Boxing

When groups have no internal comment, reduce the top padding:

```javascript
function tightGroupBounds(positions, hasComment = true) {
  const xs = positions.map(n => n.x);
  const ys = positions.map(n => n.y);
  const margin = 10;
  const commentSpace = hasComment ? 30 : 0;
  return {
    x: Math.min(...xs) - margin,
    y: Math.min(...ys) - margin - commentSpace,
    w: Math.max(...xs) - Math.min(...xs) + margin * 2,
    h: Math.max(...ys) - Math.min(...ys) + margin * 2 + commentSpace
  };
}
```

### 7.5 Row Height Budget

Each functional row uses approximately **60px** (40px node + 20px clearance). When planning vertical layout, count rows:

```
Row budget = (numberOfRows * 60) + (numberOfInterRowGaps * avgGapSize)

Example: 4 rows with 3 gaps
  Rows:   4 × 60 = 240px
  Gaps:   (50 + 80 + 90) = 220px
  Total:  460px vertical footprint
```

---

## 🎯 Quick Reference Card

| Rule | Key Value |
|------|-----------|
| Horizontal spacing (node→node) | **170–190px** |
| Horizontal spacing (long names >25 chars) | **+8px per extra char** |
| Debug offset from parent | **±40px** vertical |
| Debug on terminal node | **−20px** from terminal Y |
| Debug terminal inline | Same row allowed |
| Comment above single node | **Δy = −30px** |
| Comment inside group | At group top (+30px in bounding box) |
| Branch point centering | **Average** of branch Y values |
| Switch bridging groups | **max(src+40, min(branch)−20)** |
| Unrelated group gap | **~100px** |
| Related group (same section) gap | **~80px** |
| Same-group row gap | **~50px** |
| First node position | **(x=120, y=80)** absolute |
| Node width (standard) | **160px** |
| Node height (standard) | **40px** (1-3 outs), **60px** (4-6 outs) |
| Edge padding (groups) | **10px** (tight) |
| Row height budget | **60px** per row (node + clearance) |

---

## 🔗 Related Skills

- **`nodered-flow-builder`** — Node dimension tables, `estimateNodeHeight()` formula, and basic positioning grid. Always consult before placing nodes.
- **`nodered-fundamentals`** — Core vocabulary: nodes, flows, wires, groups.
