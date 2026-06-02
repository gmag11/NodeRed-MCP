## 1. SKILL.md

- [ ] 1.1 Create `.github/skills/nodered-patterns/SKILL.md` with YAML frontmatter (name, description, when to use)
- [ ] 1.2 Write "HTTP Endpoint" pattern: http in → function → http response; key properties, wiring, note about `examples/http-endpoint.json`
- [ ] 1.3 Write "HTTP GET Request" pattern: inject → http request → debug; key properties including url, method
- [ ] 1.4 Write "MQTT Subscriber" pattern: mqtt in → function → debug; key properties including broker config node; note about `examples/mqtt-subscriber.json`
- [ ] 1.5 Write "Timer-Triggered Flow" pattern: inject (repeat interval) → function → output node
- [ ] 1.6 Write "Message Routing" pattern: inject → switch → multiple outputs; port mapping explanation
- [ ] 1.7 Write "Data Transformation" pattern: inject → change/function → debug; when to use change vs function
- [ ] 1.8 Write "Error Handler" pattern: catch → function → debug; scope setting (flow-level vs specific node)
- [ ] 1.9 Write "Rate Limiting" pattern: inject → delay → output
- [ ] 1.10 Write "Join Streams" pattern: multiple inputs → join → output; mode (count vs timeout)

## 2. JSON Example Files

- [ ] 2.1 Create `.github/skills/nodered-patterns/examples/http-endpoint.json` (http in + function + http response flow)
- [ ] 2.2 Create `.github/skills/nodered-patterns/examples/mqtt-subscriber.json` (mqtt broker config + mqtt in + debug)
- [ ] 2.3 Create `.github/skills/nodered-patterns/examples/timer-flow.json` (inject on interval + function + debug)
- [ ] 2.4 Create `.github/skills/nodered-patterns/examples/error-handler.json` (catch + function + debug)
