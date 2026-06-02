## ADDED Requirements

### Requirement: nodered-function-node skill file
The system SHALL provide a skill file at `.github/skills/nodered-function-node/SKILL.md` that guides the LLM in writing function node code via MCP tools.

#### Scenario: LLM knows where function code goes in MCP
- **WHEN** the skill is read
- **THEN** it clearly documents that function code goes in `properties.func` when calling `create-node` or `update-node`, and that `properties.outputs` must match the number of array elements returned

#### Scenario: LLM understands available APIs
- **WHEN** the skill is read
- **THEN** it documents: `msg` (the message object), `node.warn()` / `node.error()` / `node.log()`, `flow.get/set()`, `global.get/set()`, `env.get()` with examples

#### Scenario: LLM understands return semantics
- **WHEN** the skill is read
- **THEN** it explains: `return msg` (single output), `return null` (stop flow), `return [msg1, msg2]` (multiple outputs), `return [msg, null]` (route to first output only)

#### Scenario: LLM can write an async function node
- **WHEN** the skill is read
- **THEN** it provides an example using `node.send()` with async/await and explains why `return` alone doesn't work for async operations
