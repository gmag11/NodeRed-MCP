# Design: Node-RED Flow Builder

## Output artifact(s)
`.github/skills/nodered-flow-builder/SKILL.md`

## Structure
### Sections

| Section | Content | Origin |
|---------|---------|--------|
| Workflow A — Build from scratch | create-flow → create-node × N → connect-nodes × N → get-flow-diagram | flow-builder |
| Port numbering | 0-indexed, switch example with 3 outputs, ASCII diagram | flow-builder |
| Coordinate grid | First node at (100,100), x+=200 inline, y+=100 branch, locked flows | flow-builder |
| Workflow B — Import from JSON | When to prefer import-flow, conflict strategies, targetFlowId | flow-builder |
| Workflow C — Edit existing node | get-node-detail → update-node → verify | flow-builder |
| Workflow D — Delete | delete-node, delete-flow, previousState for undo | flow-builder |
| Debug Workflow | Ensure debug active → record timestamp → inject-message → read-debug-messages with after filter → analyze → fix → repeat | debug |
| Debug Node Configuration | active (bool), complete (false/true/expression), console, tosidebar | debug |
| inject-message Usage | By nodeId (preferred) vs name, async nature, flowId scoping | debug |
| read-debug-messages Filters | nodeId, nodeName, keyword, after/before, last — each with use case | debug |
| Common Debug Patterns | "Is flow triggered?", "What is payload?", "Is context set?" | debug |
| Verification | get-flow-diagram for topology, get-flow-nodes for inventory | flow-builder |
| Common Mistakes | Not wiring after create, wrong port index, setting wires in update-node, overlapping coordinates | flow-builder + debug |

## Constraints
- Procedural (numbered steps).
- Language: English.
- Keep under 3500 words.
