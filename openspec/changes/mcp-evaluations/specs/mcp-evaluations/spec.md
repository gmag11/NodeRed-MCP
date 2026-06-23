## ADDED Requirements

### Requirement: Evaluation XML file with 10 QA pairs
The project SHALL include an `evaluations.xml` file at the repository root containing exactly 10 QA pairs following the format defined in the MCP Server Development Guide.

#### Scenario: XML file is parseable
- **WHEN** the evaluation XML file is read by an XML parser
- **THEN** it SHALL contain exactly 10 `<qa_pair>` elements, each with a `<question>` and `<answer>` child element

#### Scenario: All questions are complex
- **WHEN** each question is analyzed for required tool calls
- **THEN** each question SHALL require a minimum of 4 distinct MCP tool invocations to answer

#### Scenario: All answers are verifiable
- **WHEN** an answer is compared against the expected value
- **THEN** the comparison SHALL be an exact string match or a numeric equality

### Requirement: Evaluation runner script
The project SHALL include a script `scripts/evaluate.js` that reads `evaluations.xml` and executes each QA pair against a running Node-RED instance.

#### Scenario: Script validates prerequisites
- **WHEN** the evaluation script is executed
- **THEN** it SHALL verify connectivity to the Node-RED instance before running any evaluation, and exit with a clear error message if unreachable

#### Scenario: Script reports per-question results
- **WHEN** the evaluation script completes
- **THEN** it SHALL output a summary with per-question PASS/FAIL status and an overall pass rate

#### Scenario: Script cleans up temporary resources
- **WHEN** an evaluation question creates temporary flows or nodes
- **THEN** the script SHALL delete those resources after the question is evaluated, regardless of pass/fail outcome

### Requirement: npm evaluate script
The `package.json` SHALL include an `evaluate` script that invokes the evaluation runner.

#### Scenario: npm run evaluate works
- **WHEN** `npm run evaluate` is executed in the project directory
- **THEN** it SHALL execute `node scripts/evaluate.js` with the correct arguments

### Requirement: Evaluation documentation
The project SHALL include a `docs/evaluation-guide.md` that documents the evaluation workflow.

#### Scenario: Guide covers creation workflow
- **WHEN** the evaluation guide is read
- **THEN** it SHALL explain how to create new evaluation questions, run existing evaluations, and interpret results

#### Scenario: Guide covers question categories
- **WHEN** the evaluation guide is read
- **THEN** it SHALL document the 4 question categories (Flow construction, Flow inspection, Debug & diagnostics, Subflows & config)

### Requirement: Question category coverage
The 10 evaluation questions SHALL be distributed across 4 categories to ensure balanced coverage of MCP tool capabilities.

#### Scenario: Category distribution
- **WHEN** the evaluation questions are categorized
- **THEN** at least 2 questions SHALL belong to each of these categories: Flow construction, Flow inspection, Debug & diagnostics, and Subflows & config
