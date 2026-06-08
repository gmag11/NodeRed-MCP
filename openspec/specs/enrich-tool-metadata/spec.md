## Purpose
Enrich all MCP tool registrations with annotations, output schemas, and structured content for better LLM client integration.

## Requirements

### Requirement: All tools must have MCP annotations
The system SHALL provide `annotations` (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) for every registered MCP tool.

#### Scenario: Read-only tool has correct annotations
- **WHEN** an MCP client inspects a read-only tool (e.g., `get-flows`)
- **THEN** the tool reports `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true`

#### Scenario: Destructive tool warns clients
- **WHEN** an MCP client inspects a destructive tool (e.g., `delete-node`)
- **THEN** the tool reports `destructiveHint: true`

#### Scenario: Deploy is idempotent
- **WHEN** an MCP client inspects the `deploy` tool
- **THEN** the tool reports `idempotentHint: true`

### Requirement: Tools must have output schemas
The system SHALL define a Zod `outputSchema` for every tool that returns structured data.

#### Scenario: get-flows output schema
- **WHEN** `get-flows` is invoked
- **THEN** the response validates against `z.array(FlowSummarySchema)`

#### Scenario: create-node output schema
- **WHEN** `create-node` is invoked successfully
- **THEN** the response contains `nodeId` (string) and `staging` (StagingSummarySchema)

### Requirement: Handlers must return structuredContent
The system SHALL include `structuredContent` in every tool response alongside the `content` text representation.

#### Scenario: Text and structured content coexist
- **WHEN** any tool handler returns a response
- **THEN** the response includes both `content` (text) and `structuredContent` (typed object)
