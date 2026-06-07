## MODIFIED Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the `deploy` tool before testing with `inject-message`
