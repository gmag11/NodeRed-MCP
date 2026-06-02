## ADDED Requirements

### Requirement: nodered-flow-architecture skill file
The system SHALL provide a skill file at `.github/skills/nodered-flow-architecture/SKILL.md` that guides the LLM in organizing Node-RED flows according to best practices.

#### Scenario: LLM organizes flows into tabs by concern
- **WHEN** the skill is read
- **THEN** it recommends one tab per domain/concern with examples, and shows how to set the `label` and `info` fields via `create-flow`/`update-flow`

#### Scenario: LLM names nodes descriptively
- **WHEN** the skill is read
- **THEN** it provides naming conventions with MCP parameter examples (e.g., `properties.name: "Validate Stripe signature"` not `"function 1"`)

#### Scenario: LLM documents flows and nodes
- **WHEN** the skill is read
- **THEN** it explains using the `info` field on tabs and nodes, and using comment nodes (type `"comment"`) for inline documentation

#### Scenario: LLM uses search-nodes for auditing
- **WHEN** the skill is read
- **THEN** it shows how to use `search-nodes` with no `name` filter to find unnamed nodes (those with default names like `"function 1"`) that need to be renamed

#### Scenario: LLM understands link nodes as subflow alternative
- **WHEN** the skill is read
- **THEN** it explains link in / link out / link call nodes as a way to reuse flow segments across tabs pending subflow support in MCP
