# resources-skills Specification

## Purpose

Ensure Node-RED skill documentation is bundled with the npm package so that `list-skills` and `get-skill` tools are functional when the server is installed via `npm install`.

## Requirements

### Requirement: Skills ship with npm package

The system SHALL include the `resources/skills/` directory in the npm publication tarball via the `"files"` field in `package.json`.

#### Scenario: npm pack includes skills

- **WHEN** the package is packed with `npm pack`
- **THEN** the tarball SHALL contain the `resources/skills/` directory with all `nodered-*` subdirectories and their `SKILL.md` files

### Requirement: Skills directory is self-contained

The `resources/skills/` directory SHALL contain only Node-RED skill subdirectories. Each subdirectory SHALL contain exactly one `SKILL.md` file with valid YAML frontmatter.

#### Scenario: Directory contains only Node-RED skills

- **WHEN** listing the contents of `resources/skills/`
- **THEN** every subdirectory name SHALL start with `nodered-`
- **THEN** no `openspec-*` or `mcp-builder` directories SHALL be present

### Requirement: Skills are loadable from installed package

When the package is installed from npm, the skill loader SHALL find and parse all skills from `resources/skills/` at server startup.

#### Scenario: list-skills returns skills after npm install

- **WHEN** the server is started after `npm install nodered-mcp-server`
- **THEN** calling `list-skills` SHALL return a non-empty array of available skills with names starting with `nodered-`
