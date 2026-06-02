## ADDED Requirements

### Requirement: nodered-flow-builder skill file
The system SHALL provide a skill file at `.github/skills/nodered-flow-builder/SKILL.md` that guides the LLM through building and editing Node-RED flows via MCP tools.

#### Scenario: LLM builds a flow from scratch
- **WHEN** the skill is read
- **THEN** it provides a numbered sequence: create-flow → create-node per node → connect-nodes → verify with get-flow-diagram

#### Scenario: LLM understands port numbering
- **WHEN** the skill is read
- **THEN** it clearly states that output ports in `connect-nodes` are 0-indexed arrays

#### Scenario: LLM understands when to use import-flow
- **WHEN** the skill is read
- **THEN** it explains that `import-flow` is preferred for patterns with 4+ nodes or when the user provides a JSON

#### Scenario: LLM lays out nodes without overlap
- **WHEN** the skill is read
- **THEN** it provides a coordinate grid recommendation (first node x=100,y=100; +200 x for next inline node)
