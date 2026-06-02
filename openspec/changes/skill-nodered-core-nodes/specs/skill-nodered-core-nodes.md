## ADDED Requirements

### Requirement: nodered-core-nodes skill file
The system SHALL provide a skill file at `.github/skills/nodered-core-nodes/SKILL.md` that catalogs built-in Node-RED node types for LLM consumption.

#### Scenario: LLM finds a node type quickly
- **WHEN** the skill is read
- **THEN** node types are grouped by category (common, network, sequence, parser, storage) and each entry includes: type string, description, key properties

#### Scenario: LLM is directed to get-node-type-detail for unlisted types
- **WHEN** the LLM encounters a node type not in the skill
- **THEN** the skill instructs it to call `get-node-type-detail` with the type string to get the authoritative property schema

#### Scenario: LLM can access JSON examples on demand
- **WHEN** the LLM needs a concrete JSON template for a node category
- **THEN** the skill tells it to read the corresponding file in `examples/<category>.json`

### Requirement: JSON example files per category
The system SHALL provide example JSON files at `.github/skills/nodered-core-nodes/examples/` for each category: `common.json`, `network.json`, `sequence.json`, `parser.json`, `storage.json`. Each file SHALL contain a JSON array of representative node objects for that category.
