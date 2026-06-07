# Spec: Node-RED Patterns & Recipes

## Files
- `.github/skills/nodered-patterns/SKILL.md`
- JSON examples in `.github/skills/nodered-patterns/examples/`

## Front-matter
```yaml
---
name: nodered-patterns
description: >-
  Recipe book of common Node-RED flow patterns: HTTP endpoints, MQTT subscribers, timers,
  message routing, data transformation, error handling, and modularization.
tools:
  - create-flow
  - create-node
  - update-node
  - connect-nodes
  - disconnect-nodes
  - import-flow
  - export-flow
  - inject-message
  - read-debug-messages
  - get-flow-diagram
  - get-node-type-detail
---
```

## Description
This specification ensures the creation of a comprehensive recipe book that details how to build out standard integrations and Node-RED patterns rapidly, along with accompanying JSON file imports for the most complex patterns.

## Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the `deploy` tool before testing with `inject-message`
