# skill-categories Specification

## Purpose
TBD - created by archiving change skill-discoverability. Update Purpose after archive.
## Requirements
### Requirement: Skills SHALL declare a category

Every skill loaded from `.github/skills/*/SKILL.md` SHALL expose a `category` field. The category SHALL be derived from either the YAML frontmatter `category` key, or inferred from the parent directory name when no explicit category is set.

#### Scenario: Category from frontmatter

- **WHEN** a SKILL.md file contains `category: fundamentals` in its YAML frontmatter
- **THEN** the skill SHALL report `category: "fundamentals"` in `list-skills` output

#### Scenario: Category inferred from directory

- **WHEN** a SKILL.md file has no `category` in frontmatter and resides in `.github/skills/nodered-patterns/`
- **THEN** the skill SHALL report `category: "nodered-patterns"` in `list-skills` output

### Requirement: list-skills SHALL return structuredContent

The `list-skills` tool SHALL return `structuredContent` in addition to text content. The structured output SHALL group skills by category and include category-level metadata.

#### Scenario: Structured output shape

- **WHEN** an agent calls `list-skills`
- **THEN** the response SHALL include `structuredContent` with shape `{ categories: [{ name: string, skills: [{ name, description, uri }] }] }`
- **AND** the text content SHALL contain a Markdown table grouped by category

### Requirement: list-skills SHALL surface skill use-cases

Each skill entry in `list-skills` SHALL include a `useCase` hint string that helps agents quickly identify when to use that skill.

#### Scenario: Use-case hint present

- **WHEN** an agent calls `list-skills`
- **THEN** each skill in the output SHALL have a `useCase` field (e.g., "Use when building Node-RED flows", "Use for JSONata expression reference")
