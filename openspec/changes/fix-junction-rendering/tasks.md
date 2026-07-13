## 1. Colors — Junction Styling

- [x] 1.1 Add `junction` entry to `src/renderer/colors.js` with fill (#999999), stroke (#666666), and radius (12)

## 2. IR Builder — Junction Nodes + Wire Resolution

- [x] 2.1 Keep junctions in `nodes[]` instead of filtering them out; add `isJunction: true` flag on each junction IR node with `w: 24, h: 24` (matching circle diameter)
- [x] 2.2 Build `junctionsById` Map from raw junction nodes for O(1) lookup during wire resolution
- [x] 2.3 Add `resolveTargets(targetId, junctionsById, visited)` helper that BFS-traverses junction wires to find non-junction destination nodes
- [x] 2.4 Modify the link-building loop in `buildIR()` to call `resolveTargets()` when a wire target is a junction (found in `junctionsById`)

## 3. SVG Builder — Junction Circle Rendering

- [x] 3.1 Add `if (node.isJunction)` branch in `buildNodeSVG()` that emits a `<circle>` element at (x, y) with radius and colors from `colors.js`
- [x] 3.2 Ensure junction `<circle>` is rendered on the correct z-layer (between groups/links and regular nodes)

## 4. Mermaid Builder — Junction Circle Nodes

- [x] 4.1 In `buildMermaid()`, render junction nodes as Mermaid circle nodes `nodeId((...))` with no display label
- [x] 4.2 Add junction-specific class/style definition in the Mermaid output for consistent gray styling

## 5. HTML Builder — Junction Circle + Wire Resolution

- [x] 5.1 Stop filtering junctions out of `tabNodes` in `buildTabData()`; include them with `isJunction: true`
- [x] 5.2 Add junction circle rendering in the D3.js node drawing code (small `<circle>` instead of `<rect>` + `<text>`)
- [x] 5.3 Build `junctionsById` lookup map in `buildTabData()` from raw flows
- [x] 5.4 Add inline `resolveTarget()` helper and modify the link-building loop to resolve through junctions

## 6. Tests

- [ ] 6.1 Add test fixtures: node→junction→node, junction split (1→N), junction join (N→1), junction→junction chain, circular references
- [ ] 6.2 Add unit tests in `tests/renderer/ir-builder.test.js` for junction IR node generation (isJunction flag, dimensions) and wire resolution
- [ ] 6.3 Add unit tests in `tests/renderer/svg-builder.test.js` verifying junction `<circle>` output with correct attributes
- [ ] 6.4 Add unit tests in `tests/renderer/mermaid-builder.test.js` verifying junction `((...))` syntax
- [ ] 6.5 Add unit tests in `tests/renderer/html-builder.test.js` for junction circle rendering and wire resolution in D3 output
- [x] 6.6 Verify existing tests still pass (no regressions)

## 7. Validation

- [x] 7.1 Run full test suite: `npm test`
- [x] 7.2 Manually verify with the "Stations" flow (junction `6b5eeee2b4426a42`) that junctions appear as circles and wires are correctly connected in all three formats
