## ADDED Requirements

### Requirement: nodered-patterns skill file
The system SHALL provide a skill file at `.github/skills/nodered-patterns/SKILL.md` that contains ready-made Node-RED flow patterns as MCP tool sequences.

#### Scenario: LLM builds an HTTP endpoint
- **WHEN** the skill is read
- **THEN** it provides the exact node topology (http in → function → http response) with key properties and wiring

#### Scenario: LLM builds an MQTT subscriber
- **WHEN** the skill is read
- **THEN** it provides the node topology (mqtt in → function/debug) with key properties including broker config node

#### Scenario: LLM routes messages based on a property
- **WHEN** the skill is read
- **THEN** it provides the switch node pattern with output port mapping

#### Scenario: LLM knows when to use import-flow for a pattern
- **WHEN** the skill describes a complex pattern (4+ nodes)
- **THEN** it notes that a companion JSON in `examples/` can be passed directly to `import-flow`

### Requirement: Pattern example JSON files
The system SHALL provide companion JSON files at `.github/skills/nodered-patterns/examples/` for patterns with 4+ nodes: `http-endpoint.json`, `mqtt-subscriber.json`, `timer-flow.json`, `error-handler.json`.
