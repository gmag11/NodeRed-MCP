# Spec: Node-RED UIBuilder Architecture & Patterns

## File
`.github/skills/nodered-uibuilder/SKILL.md`

## Documentation URL
https://totallyinformation.github.io/node-red-contrib-uibuilder/

## Front-matter
```yaml
---
name: nodered-uibuilder
version: 7.7.3
description: >-
  Architecture and communication patterns for node-red-contrib-uibuilder v7.7.3,
  a versatile bridge between Node-RED flows and custom web frontends.
  Covers the single-node bridge model, filesystem-based frontend structure,
  Socket.IO bidirectional messaging, framework integration patterns
  (Vue, React, Svelte, vanilla JS), and common recipes. Docs:
  https://totallyinformation.github.io/node-red-contrib-uibuilder/
tools:
  - install-node
  - create-node
  - update-node
  - get-node-type-detail
  - get-node-detail
  - inject-message
  - read-debug-messages
  - refresh-staging
  - deploy
---
```

## Description
This specification dictates that `.github/skills/nodered-uibuilder/SKILL.md` must be created containing a comprehensive architecture and communication patterns guide for node-red-contrib-uibuilder. The skill covers the single-node bridge model, filesystem frontend structure, Socket.IO bidirectional messaging, framework integration patterns, and common recipes. It SHALL include a link to the official documentation at https://totallyinformation.github.io/node-red-contrib-uibuilder/ so implementers can use up-to-date data.

## ADDED Requirements

### Requirement: UIBuilder skill file
The system SHALL include a skill file at `.github/skills/nodered-uibuilder/SKILL.md` with valid YAML frontmatter containing `name`, `version`, `description`, and `tools` fields. The `version` field SHALL record the npm package version documented (7.7.3). The skill SHALL provide LLM guidance on building custom web UIs connected to Node-RED via uibuilder.

#### Scenario: Skill has required frontmatter
- **WHEN** the skill file is loaded by the skill loader
- **THEN** it SHALL be parsed successfully and its metadata SHALL be available for skill discovery

#### Scenario: Skill includes official documentation URL
- **WHEN** an implementer reads the skill
- **THEN** the skill SHALL reference https://totallyinformation.github.io/node-red-contrib-uibuilder/ as the authoritative source for up-to-date configuration and API details

#### Scenario: Skill records documented version
- **WHEN** a maintainer reviews the skill
- **THEN** the skill frontmatter SHALL include `version: 7.7.3` indicating the npm package version at time of writing
- **THEN** the skill body SHALL mention the documented version in its introductory section

### Requirement: Skill covers uibuilder architecture — the bridge model
The skill SHALL document uibuilder's fundamental architecture: a single Node-RED node that acts as a bidirectional bridge to a full web application stored on the filesystem. Communication happens via Socket.IO. The skill SHALL use an ASCII diagram to illustrate the architecture.

#### Scenario: LLM learns uibuilder architecture
- **WHEN** an LLM reads the skill
- **THEN** it SHALL understand that one uibuilder node connects to one web application
- **THEN** it SHALL understand that the frontend code lives in `~/.node-red/uibuilder/<url>/src/` on the filesystem
- **THEN** it SHALL understand that communication is bidirectional: NR → frontend via Socket.IO, frontend → NR via Socket.IO
- **THEN** it SHALL understand that the MCP tools manage only the Node-RED side (the uibuilder node), while frontend code is edited outside the MCP domain

### Requirement: Skill covers setup and configuration
The skill SHALL document how to install the package (`install-node("node-red-contrib-uibuilder")`) and create a uibuilder node. It SHALL cover key properties: `url` (the URL path for the frontend), `name` (label), and template/startup behavior.

#### Scenario: LLM sets up uibuilder
- **WHEN** an LLM needs to create a new uibuilder-based UI
- **THEN** the skill SHALL show the `install-node` call to add the package
- **THEN** the skill SHALL show the `create-node` call with type `"uibuilder"` and key properties

### Requirement: Skill covers Node-RED → frontend communication (msg._ui protocol)
The skill SHALL document the `msg._ui` protocol used to send updates from Node-RED flows to the frontend. It SHALL cover common methods: `addToDom`, `update`, `remove`, `notify`, `navigate`. Each method SHALL be documented with its required fields (method, selector, data/props).

#### Scenario: LLM sends data from NR to the frontend
- **WHEN** an LLM needs to update the frontend UI from a Node-RED flow
- **THEN** the skill SHALL show how to construct a `msg._ui` array with the appropriate method and data
- **THEN** the skill SHALL provide examples for adding DOM content, updating existing elements, and showing notifications

### Requirement: Skill covers frontend → Node-RED communication
The skill SHALL document how the frontend sends messages back to Node-RED flows. It SHALL cover the `uibuilder.onChange('msg', callback)` pattern and the `uibuilder.send()` method. It SHALL document that messages arrive at the uibuilder node's output as standard `msg` objects.

#### Scenario: LLM handles frontend data in NR flow
- **WHEN** an LLM needs to process data sent from the frontend (e.g., form submission, button click)
- **THEN** the skill SHALL show that wiring the uibuilder node's output to other nodes receives the frontend's message as a standard `msg` object

### Requirement: Skill covers framework integration patterns
The skill SHALL document that uibuilder supports any frontend framework — vanilla JavaScript, Vue, React, Svelte, and others. For each framework, it SHALL provide a minimal integration example showing how to connect to the uibuilder Socket.IO library. The skill SHALL link to the official documentation for detailed framework-specific guides.

#### Scenario: LLM advises on framework choice
- **WHEN** a user asks which frontend framework to use with uibuilder
- **THEN** the skill SHALL explain that any framework works and provide minimal connection snippets for the most common frameworks
- **THEN** the skill SHALL direct to official docs for full framework integration guides

### Requirement: Skill provides common uibuilder recipes
The skill SHALL include ready-to-use recipes for common uibuilder patterns. Recipes SHALL cover at minimum: real-time data display, form submission to NR and response back to frontend, and NR as a WebSocket relay for external data.

#### Scenario: LLM builds a uibuilder recipe
- **WHEN** an LLM needs to build a common uibuilder pattern
- **THEN** the skill SHALL provide Node-RED-side node configurations and wiring calls

### Requirement: Skill includes references section with official documentation URL
The skill SHALL include a dedicated references section at the end of the body that lists the official documentation URL (https://totallyinformation.github.io/node-red-contrib-uibuilder/) and any other relevant resources.

#### Scenario: Implementer needs up-to-date uibuilder API data
- **WHEN** an implementer needs current API details for uibuilder
- **THEN** the skill SHALL direct them to the official documentation at https://totallyinformation.github.io/node-red-contrib-uibuilder/
