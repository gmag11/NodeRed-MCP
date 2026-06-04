# Design: Node-RED Node Reference

## Output artifact(s)
- `.github/skills/nodered-node-reference/SKILL.md`
- `.github/skills/nodered-node-reference/examples/common.json`
- `.github/skills/nodered-node-reference/examples/network.json`
- `.github/skills/nodered-node-reference/examples/sequence.json`
- `.github/skills/nodered-node-reference/examples/parser.json`
- `.github/skills/nodered-node-reference/examples/storage.json`

## Structure
### Sections

| Section | Content | Origin |
|---------|---------|--------|
| Introduction | How to use, when to call get-node-type-detail, example file structure | core-nodes |
| Common Nodes | inject, debug, complete, catch, status, link in/out/call, comment — type, description, key properties | core-nodes |
| Logic & Transform Nodes | switch, change, range, template, filter (RBE) | core-nodes |
| Flow Control Nodes | delay, trigger, split, join, sort, batch | core-nodes |
| Network Nodes | http in/response/request, websocket, tcp, udp, mqtt in/out | core-nodes |
| Data Parsing Nodes | json, xml, yaml, csv, html | core-nodes |
| Storage Nodes | file, file in, watch | core-nodes |
| Exec Node | exec — running system commands | core-nodes |
| Function Node Deep-Dive | Setting code via MCP (func property, outputs), available globals, return semantics, context API, async patterns, logging/errors, inline code examples | function-node |

## Constraints
- SKILL.md ≤ 4000 words.
- Each JSON file ≤ 150 lines.
