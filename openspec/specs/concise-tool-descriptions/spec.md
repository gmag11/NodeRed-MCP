# concise-tool-descriptions Specification

## Purpose
TBD - created by archiving change concise-tool-descriptions. Update Purpose after archive.
## Requirements
### Requirement: Tool descriptions SHALL be concise

Every tool registered in `server.js` SHALL have a description of at most 3 lines (approximately 250 characters). The description SHALL convey:

1. What the tool does (1 line)
2. Key behavior or constraint (1 line)
3. One cross-reference for deeper guidance (1 line)

#### Scenario: Description fits in 3 lines

- **WHEN** an LLM reads the tool description in `server.tool()`
- **THEN** the description SHALL NOT exceed 3 logical lines (concatenated string segments)
- **AND** the total character count SHALL be under approximately 250 characters

### Requirement: Skill resource URIs SHALL NOT appear in tool descriptions

Tool descriptions SHALL NOT contain inline `nodered://skills/…` URIs or explicit `list-skills` instructions. Agents discover skills through the `list-skills` tool, not through embedded cross-references in every tool description.

#### Scenario: No skill URI in description

- **WHEN** an agent reads the description of any tool (e.g., `create-node`, `create-subflow-instance`)
- **THEN** the description SHALL NOT contain any `nodered://skills/` URI
- **AND** the description SHALL NOT contain the string "use list-skills to discover"

### Requirement: Repeated staging boilerplate SHALL be standardized

Tools that modify the staging area (create, update, delete, wire operations) SHALL use a consistent, compact suffix to indicate staging behavior. The suffix SHALL be at most one line.

#### Scenario: Standardized staging notice

- **WHEN** a tool modifies the staging area (e.g., `create-node`, `deploy`, `connect-nodes`)
- **THEN** the description SHALL include the suffix "(staged — deploy to apply)" or equivalent standardized phrasing
- **AND** the staging notice SHALL NOT repeat explanations already present in the `deploy` tool description

### Requirement: Parameter descriptions SHALL remain unchanged

This change SHALL NOT modify any Zod `.describe()` strings on tool parameters. Parameter description improvements are covered by the `tool-param-examples` change.

#### Scenario: Parameter descriptions preserved

- **WHEN** the tool descriptions are shortened
- **THEN** all `.describe()` calls on Zod schemas SHALL remain exactly as they are
