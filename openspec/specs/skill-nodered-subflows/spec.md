## Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the `deploy` tool before testing with `inject-message`

### Requirement: nodered-subflows skill
The system SHALL include a skill file at `.github/skills/nodered-subflows/SKILL.md` with valid YAML frontmatter containing `name`, `description`, and `tools` fields. The skill SHALL provide LLM guidance on working with Node-RED subflows via MCP tools.

#### Scenario: Skill has required frontmatter
- **WHEN** the skill file is loaded by the skill loader
- **THEN** it SHALL be parsed successfully and its `tools` list SHALL be available for tool discovery

#### Scenario: Skill lists all subflow-related tools
- **WHEN** the skill is inspected
- **THEN** its `tools` field in YAML frontmatter SHALL list: `get-subflows`, `get-subflow-detail`, `create-subflow`, `update-subflow`, `delete-subflow`, `create-subflow-instance`, `export-subflow`, `import-flow`

### Requirement: Skill covers subflow vocabulary
The skill SHALL define the three-layer subflow model: definition (`type: "subflow"`), internal nodes (`z === subflowId`), and instances (`type: "subflow:<subflowId>"`).

#### Scenario: Vocabulary is documented
- **WHEN** an LLM reads the skill
- **THEN** it SHALL understand the difference between subflow definitions, internal nodes, and instances

### Requirement: Skill covers creation workflow
The skill SHALL document the step-by-step sequence for creating a subflow from scratch: `create-subflow` → populate internals with `create-node` / `connect-nodes` → define ports with `update-subflow`.

#### Scenario: Creation workflow is clear
- **WHEN** an LLM needs to create a subflow programmatically
- **THEN** the skill SHALL provide the exact tool call sequence

### Requirement: Skill covers instantiation
The skill SHALL document how to place a subflow instance in a flow tab using `create-subflow-instance`, including env variable parameterization.

#### Scenario: Instantiation pattern is documented
- **WHEN** an LLM needs to use a subflow in a flow
- **THEN** the skill SHALL show how to call `create-subflow-instance` with env vars

### Requirement: Skill covers export and import
The skill SHALL document how to export a subflow with `export-subflow` and re-import it with `import-flow`.

#### Scenario: Export/import pattern is documented
- **WHEN** an LLM needs to share or duplicate a subflow
- **THEN** the skill SHALL show the export → import workflow

### Requirement: Skill covers limitations
The skill SHALL warn that Node-RED's UI does not support nested subflows (subflows inside subflows) and that subflow modification via MCP may not be visible in the UI until a page refresh.

#### Scenario: Limitations are documented
- **WHEN** an LLM reads the skill
- **THEN** it SHALL be aware of nesting limitations and UI refresh requirements
