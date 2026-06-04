# Design: Node-RED Fundamentals

## Output artifact(s)
`.github/skills/nodered-fundamentals/SKILL.md`

## Structure
### Sections
| Section | Content | Origin |
|---------|---------|--------|
| What is Node-RED | Flow-based visual programming, event-driven model | concepts |
| Node | Definition, key fields (id, type, name, z, x, y, wires), MCP tools | concepts |
| Flow (Tab) | Definition, dual meaning disambiguation, flowId in MCP, MCP tools | concepts |
| Wire | Definition, 0-indexed output ports, wires array structure, MCP tools | concepts |
| Message | msg object, payload, topic, _msgid, MCP tools | concepts |
| Context | Three scopes (node, flow, global), read via get-context, delete via delete-context, NO write via Admin API note | concepts |
| Config Node | Shared resources, z:0 global vs z:<flowId> scoped, MCP tools | concepts |
| Subflow | Brief description, MCP support deferred | concepts |
| Palette | Registry of available types, MCP tools | concepts |
| Tab Organization | One tab per domain/concern, descriptive labels, info descriptions | flow-architecture |
| Node Naming | Descriptive names, anti-patterns, auditing with search-nodes | flow-architecture |
| Documentation | info field on flows/nodes, comment nodes | flow-architecture |
| Error Handling Basics | Catch nodes, scope (flow-level vs specific), error object structure | debug + flow-architecture |
| Link Nodes | link in/out/call for cross-tab reuse, subflow alternative | flow-architecture |
| Environment Variables | env array on flows, env.get() in function nodes | flow-architecture |
| Message-Flow Diagram | ASCII diagram showing inject → function → debug | concepts |

## Constraints
- File must be self-contained.
- Language: English.
- Keep under 2500 words.
