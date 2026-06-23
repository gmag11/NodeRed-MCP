## 1. Setup and infrastructure

- [ ] 1.1 Create `scripts/evaluate.js` with MCP client setup, XML parsing, and prerequisite validation (connectivity check)
- [ ] 1.2 Add `"evaluate": "node scripts/evaluate.js"` to `package.json` scripts
- [ ] 1.3 Add `xmldom` or equivalent XML parsing dependency to `devDependencies` (if needed beyond Node.js built-in)

## 2. Flow construction evaluations (3 questions)

- [ ] 2.1 Q1: Create a flow with inject → function → debug, deploy it, inject a message, and read the debug output to verify the function transforms the payload correctly
- [ ] 2.2 Q2: Create a flow with inject → change → debug, verify the change node modifies `msg.topic`, and confirm via debug output
- [ ] 2.3 Q3: Create a flow with inject → switch (routing by msg.payload value) → two debug nodes, verify routing works correctly for both paths

## 3. Flow inspection evaluations (3 questions)

- [ ] 3.1 Q4: Given a known flow ID, use get-flow-nodes to count nodes of a specific type and verify the count
- [ ] 3.2 Q5: Given a known flow, use get-flow-diagram to verify the diagram contains specific node names in Mermaid output
- [ ] 3.3 Q6: Use get-flows to list all tabs, then use get-flow-nodes on each to find which tab contains a specific node type

## 4. Debug & diagnostics evaluations (2 questions)

- [ ] 4.1 Q7: Inject a message with a known payload into an existing inject node, capture the debug output, and verify the payload value in the output
- [ ] 4.2 Q8: Inject a message, then use read-debug-messages with keyword filter to find only messages containing a specific string

## 5. Subflows & config evaluations (2 questions)

- [ ] 5.1 Q9: Use get-subflows to list all subflows, pick one, use get-subflow-detail to inspect its internal nodes, and verify the internal node count
- [ ] 5.2 Q10: Use get-config-nodes to list all config nodes, filter by type, and count how many config nodes exist of a specific type

## 6. Documentation

- [ ] 6.1 Create `docs/evaluation-guide.md` covering: how to run evaluations, how to create new questions, category descriptions, and interpretation of results
- [ ] 6.2 Add a section in `docs/evaluation-guide.md` about the cleanup contract (temporary flows are deleted after each question)

## 7. Validation

- [ ] 7.1 Run all 10 evaluations against a clean Node-RED instance and verify 100% pass rate
- [ ] 7.2 Verify `npm run evaluate` exits with code 0 on full pass and non-zero on any failure
- [ ] 7.3 Verify temporary flows/nodes are cleaned up after evaluation run (check via get-flows that no `eval-*` flows remain)
