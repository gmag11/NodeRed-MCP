## 1. Skill File

- [ ] 1.1 Create `.github/skills/nodered-concepts/SKILL.md` with YAML frontmatter (name, description, when to use)
- [ ] 1.2 Write "Node" section: definition, input/output ports, trigger types, MCP tools (`create-node`, `update-node`, `delete-node`, `get-node-detail`, `get-flow-nodes`)
- [ ] 1.3 Write "Flow (Tab)" section: definition, dual meaning clarification, `flowId` in MCP tools, MCP tools (`get-flows`, `create-flow`, `update-flow`, `delete-flow`)
- [ ] 1.4 Write "Wire" section: definition, how they convey messages, MCP tools (`connect-nodes`, `disconnect-nodes`)
- [ ] 1.5 Write "Message" section: plain JS object, `msg.payload` convention, multiple outputs, MCP tools (`inject-message`)
- [ ] 1.6 Write "Context" section: node/flow/global scopes, in-memory vs persistent, MCP tools (`get-context`, `delete-context`); note that writing context via Admin API is not supported — use a function node with `flow.set()` / `global.set()`
- [ ] 1.7 Write "Config Node" section: shared config, not in main workspace, MCP tools (`get-config-nodes`)
- [ ] 1.8 Write "Subflow" section: reusable node group, deferred in MCP tools
- [ ] 1.9 Write "Palette" section: available node types, MCP tools (`get-palette-nodes`, `get-node-type-detail`)
- [ ] 1.10 Add ASCII message-flow diagram showing inject → function → debug connected by wires
