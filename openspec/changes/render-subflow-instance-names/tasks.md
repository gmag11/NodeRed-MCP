## 1. IR builder — name resolution

- [ ] 1.1 In `src/renderer/ir-builder.js`, add a helper function `resolveSubflowInstanceName(node, flows)` that:
  - Returns `node.name` if non-empty
  - If `node.type` starts with `subflow:`, extracts the definition ID after the colon
  - Finds the definition node (`{type: "subflow", id}`) in flows
  - Returns definition's `.name` if found, else `node.type`
- [ ] 1.2 Update the `IRNode` creation to call the resolver for the `name` field

## 2. Color — subflow instance color

- [ ] 2.1 In `src/renderer/colors.js`, replace the wildcard fallback with an explicit check: if `type` starts with `subflow:`, return `#9BC7D4` before falling through to `DEFAULT_COLOR`

## 3. Mermaid — subflow indicator

- [ ] 3.1 In `src/renderer/mermaid-builder.js`, detect subflow instance nodes (via `type.startsWith('subflow:')`) and prefix the label with `[Subflow] `

## 4. SVG — subflow badge

- [ ] 4.1 In `src/renderer/svg-builder.js`, detect subflow instance nodes and render a small badge (colored rectangle with "S" text) in the top-right corner of the node rectangle

## 5. HTML — client-side name resolution + badge

- [ ] 5.1 In `src/renderer/html-builder.js`, update the client-side IR construction to resolve subflow instance names using the embedded `ALL_FLOWS` array (same logic as task 1.1)
- [ ] 5.2 In `src/renderer/html-builder.js`, add the subflow badge rendering to the D3 `drawNode` function (same badge as SVG)
- [ ] 5.3 Add CSS class `subflow-instance` to subflow instance nodes in the HTML output

## 6. Tests

- [ ] 6.1 Add tests in `tests/renderer/ir-builder.test.js`: subflow instance with explicit name, without name (falls back to definition), without name and missing definition
- [ ] 6.2 Add tests in `tests/renderer/mermaid-builder.test.js`: subflow instance label includes `[Subflow]` prefix and resolved name
- [ ] 6.3 Add tests in `tests/renderer/svg-builder.test.js`: subflow instance includes badge element
- [ ] 6.4 Add tests in `tests/renderer/html-builder.test.js`: subflow instance node has CSS class `subflow-instance` and badge
- [ ] 6.5 Add tests in `tests/renderer/colors.test.js`: subflow instance type returns distinct color

## 7. Verify and deploy

- [ ] 7.1 Run full test suite: `npm test`
- [ ] 7.2 Rebuild and redeploy MCP server
- [ ] 7.3 Verify via staging render that subflow instances show correct names and visual indicator
