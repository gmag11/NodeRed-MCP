# Spec: Node-RED Flow Builder

## File
`.github/skills/nodered-flow-builder/SKILL.md`

## Front-matter
```yaml
---
name: nodered-flow-builder
description: >-
  Step-by-step operational guide for building, editing, testing, and debugging Node-RED flows using MCP tools.
tools:
  - get-flows
  - get-flow-nodes
  - get-flow-diagram
  - get-node-detail
  - create-flow
  - update-flow
  - delete-flow
  - create-node
  - update-node
  - delete-node
  - connect-nodes
  - disconnect-nodes
  - export-flow
  - import-flow
  - inject-message
  - read-debug-messages
  - get-context
  - search-nodes
---
```

## Description
This specification outlines the procedural steps that an LLM agent should follow to correctly author and test flows, from coordinate systems to 0-indexed port numbering and reliable asynchronous debugging using inject-message and read-debug-messages.

## Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the `deploy` tool before testing with `inject-message`
