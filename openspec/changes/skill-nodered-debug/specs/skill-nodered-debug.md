## ADDED Requirements

### Requirement: nodered-debug skill file
The system SHALL provide a skill file at `.github/skills/nodered-debug/SKILL.md` that guides the LLM through the debug workflow using MCP tools.

#### Scenario: LLM knows the complete debug workflow
- **WHEN** the skill is read
- **THEN** it provides a numbered sequence: add debug node to flow → verify `active: true` → inject-message → read-debug-messages with appropriate filters → analyze → fix → repeat

#### Scenario: LLM configures debug nodes correctly
- **WHEN** the skill is read
- **THEN** it documents the key debug node properties: `active` (bool, default true), `complete` (what to output: "false"=payload, "true"=full msg, expression string), `console` (bool)

#### Scenario: LLM uses read-debug-messages filters effectively
- **WHEN** the skill is read
- **THEN** it explains each filter parameter with use cases: `nodeId` for specific node, `nodeName` for name-based targeting, `keyword` for content search, `since` for post-inject filtering

#### Scenario: LLM understands the timing gap
- **WHEN** the skill is read
- **THEN** it notes that debug messages arrive asynchronously and recommends using the `since` filter with the timestamp just before calling `inject-message`
