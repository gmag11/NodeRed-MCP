## ADDED Requirements

### Requirement: nodered-concepts skill file
The system SHALL provide a skill file at `.github/skills/nodered-concepts/SKILL.md` that defines all core Node-RED concepts for LLM consumption.

#### Scenario: LLM understands the dual meaning of "flow"
- **WHEN** the skill is read
- **THEN** it clearly distinguishes "flow" as a tab (workspace area) from "flow" as a set of connected nodes, and maps the tab concept to the `flowId` parameter used in MCP tools

#### Scenario: LLM understands config nodes
- **WHEN** the skill is read
- **THEN** it explains that config nodes are shared configuration referenced by regular nodes, do not appear in the main workspace, and are retrieved via `get-config-nodes`

#### Scenario: LLM understands message structure
- **WHEN** the skill is read
- **THEN** it explains that messages are plain JS objects, conventionally have `msg.payload` as the main data carrier, and pass between nodes via wires

#### Scenario: LLM can map concepts to tools
- **WHEN** the skill is read
- **THEN** each concept includes a reference to the relevant MCP tools (e.g., "Flow → `get-flows`, `create-flow`, `update-flow`, `delete-flow`")

### Requirement: skill includes a message-flow diagram
The skill SHALL include an ASCII diagram showing a message passing through two or more nodes connected by wires.
