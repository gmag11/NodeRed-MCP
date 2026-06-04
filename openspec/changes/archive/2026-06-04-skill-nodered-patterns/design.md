# Design: Node-RED Patterns & Recipes

## Output artifact(s)
- `.github/skills/nodered-patterns/SKILL.md`
- `.github/skills/nodered-patterns/examples/http-endpoint.json`
- `.github/skills/nodered-patterns/examples/mqtt-subscriber.json`
- `.github/skills/nodered-patterns/examples/timer-flow.json`
- `.github/skills/nodered-patterns/examples/error-handler.json`

## Structure
### Sections

| Section | Content | Origin |
|---------|---------|--------|
| HTTP Endpoint | http in → function → http response, key properties, wiring | patterns |
| HTTP GET Request | inject → http request → debug | patterns |
| MQTT Subscriber | mqtt in → function → debug, broker config node | patterns |
| Timer-Triggered Flow | inject (repeat) → function → output | patterns |
| Message Routing | inject → switch → N outputs, port mapping | patterns |
| Data Transformation | change vs function guidance | patterns |
| Error Handler | catch → function → debug, scope | patterns |
| Rate Limiting | inject → delay → output | patterns |
| Join Streams | N inputs → join → output | patterns |
| Retry with Backoff | Error → delay → retry pattern | flow-architecture |
| Cross-Tab Reuse with Link Nodes | link in/out/call for modularization | flow-architecture |
| Subflows | Reusable sub-graphs, env vars in subflows | flow-architecture |

Recipe format:
```
### <Pattern Name>
**Use when**: <one-line trigger>
**Nodes**: <node-1> → <node-2> → ...
**Key properties**: table
**Wiring**: connect-nodes calls
**Import shortcut**: (if JSON file exists)
```

## Constraints
- SKILL.md ≤ 4000 words.
- Each JSON file ≤ 100 lines.
