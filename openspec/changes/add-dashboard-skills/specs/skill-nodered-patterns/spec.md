# Spec: Node-RED Patterns & Recipes (Delta)

## Files
- `.github/skills/nodered-patterns/SKILL.md`

## Description
This delta specification adds a new "Dashboard / UI Patterns" section to the existing `nodered-patterns` skill. The new section provides a comparison table to help the LLM guide users toward the right UI tool (Dashboard 2.0 vs uibuilder) based on their specific use case, and cross-references the `flowfuse-dashboard` and `nodered-uibuilder` skills for detailed guidance.

## ADDED Requirements

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
