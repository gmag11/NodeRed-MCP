# Spec: Node-RED Fundamentals

## File
`.github/skills/nodered-fundamentals/SKILL.md`

## Front-matter
```yaml
---
name: nodered-fundamentals
description: >-
  Core vocabulary of Node-RED: nodes, flows (tabs), wires, messages, context, config nodes,
  design principles, and basic error handling concepts.
tools:
  - get-flows
  - get-flow-nodes
  - get-flow-diagram
  - get-config-nodes
  - get-node-detail
  - get-palette-nodes
  - get-node-type-detail
  - create-flow
  - update-flow
  - delete-flow
  - create-node
  - update-node
  - delete-node
  - connect-nodes
  - disconnect-nodes
  - get-context
  - delete-context
  - inject-message
  - search-nodes
  - export-flow
  - import-flow
  - read-debug-messages
  - install-node
  - uninstall-node
---
```

## Description
This specification dictates that `.github/skills/nodered-fundamentals/SKILL.md` must be created containing the foundational vocabulary of Node-RED, disambiguation of terms like "flow", a clear explanation of how the Node-RED data-flow model works, and best practices for architecture and documentation.

## Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the `deploy` tool before testing with `inject-message`
