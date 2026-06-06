## MODIFIED Requirements

### Requirement: Pre-deploy guard
The tool SHALL check the staging status before attempting to inject a message.

#### Scenario: Staging has pending changes
- **WHEN** the tool is called
- **WHEN** the staging store has pending undeployed changes
- **THEN** the tool returns an error instructing the LLM to deploy first
