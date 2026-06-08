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

### Requirement: Skill includes Dashboard / UI patterns section
The skill SHALL include a "Dashboard / UI Patterns" section that introduces the two recommended approaches for building user interfaces in Node-RED: `@flowfuse/node-red-dashboard` (Dashboard 2.0) and `node-red-contrib-uibuilder`.

#### Scenario: LLM discovers UI options
- **WHEN** an LLM reads the nodered-patterns skill
- **THEN** it SHALL find a dedicated "Dashboard / UI Patterns" section that describes both options

### Requirement: Dashboard / UI section includes a comparison table
The skill SHALL include a comparison table that contrasts Dashboard 2.0 and uibuilder across at minimum these dimensions: effort required, flexibility, real-time update mechanism, custom styling capability, learning curve, and best-for use case.

#### Scenario: LLM helps user choose a UI tool
- **WHEN** a user asks which dashboard tool to use
- **THEN** the comparison table SHALL provide enough information for the LLM to recommend the appropriate tool based on the user's stated needs (e.g., quick monitoring → Dashboard 2.0; custom SPA → uibuilder)

### Requirement: Dashboard / UI section cross-references the dedicated skills
The comparison table SHALL include explicit references to the `flowfuse-dashboard` and `nodered-uibuilder` skills, instructing the LLM to consult those skills for detailed widget catalogs, wiring patterns, and communication protocols.

#### Scenario: LLM needs detailed widget or protocol info
- **WHEN** the LLM has selected a tool using the comparison table
- **THEN** the skill SHALL direct the LLM to read `flowfuse-dashboard` for Dashboard 2.0 details or `nodered-uibuilder` for uibuilder details
