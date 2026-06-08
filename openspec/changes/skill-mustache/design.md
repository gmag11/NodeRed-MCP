## Context

The MCP (Model Context Protocol) server for Node-RED includes a skill system that loads `.github/skills/*/SKILL.md` files as LLM guidance documents. Each skill has YAML frontmatter with `name`, `description`, and optionally `tools` fields. The existing skills cover Node-RED fundamentals, flow building, subflows, patterns, node references, and JSONata. There is currently no skill covering Mustache, which is one of the templating engines supported by Node-RED's "template" node and is widely used across many programming languages and frameworks.

The skill content is sourced from the official Mustache documentation at https://mustache.github.io/, covering version 1.3.0 of the specification including the optional extensions for lambdas and inheritance.

## Goals / Non-Goals

**Goals:**
- Provide a comprehensive, self-contained Mustache reference for LLMs building Node-RED flows
- Cover all Mustache tag types: variables (escaped and unescaped), sections, inverted sections, comments, partials, blocks, parents, and set delimiters
- Document dotted-name resolution, implicit iterator (`.`), and context traversal
- Document lambda/callable support for both variables and sections
- Cover the inheritance extension: blocks, parents, and dynamic names
- Include Node-RED-specific usage notes for the template node
- Follow the existing skill format conventions (YAML frontmatter, markdown body, clear section headings)

**Non-Goals:**
- Creating new MCP tools for Mustache evaluation or validation
- Modifying existing MCP tool implementations
- Creating a Mustache parser or runtime
- Covering third-party Mustache extensions or non-standard implementations beyond the official spec v1.3.0
- Replicating every single detail from the official docs verbatim (focus on practical reference)

## Decisions

1. **Skill name: `mustache`** — kept simple as "mustache" rather than prefixed with "nodered-" since Mustache is a standalone templating language with its own identity, even though it's used within Node-RED contexts.

2. **No associated MCP tools** — unlike most other skills, the Mustache skill has no `tools` list because there are no Mustache-specific MCP operations. The skill is purely a reference/guidance document. The YAML frontmatter will omit the `tools` field.

3. **Organization by tag type** — following the official man page structure: variables, sections, inverted sections, comments, partials, blocks, parents, and set delimiters. Each tag type gets its own section with syntax, behavior, and examples.

4. **Include Node-RED context** — a dedicated section maps Mustache concepts to Node-RED template node configuration (format type, template field, message property binding).

5. **Version anchoring** — explicitly reference Mustache spec v1.3.0 to help the LLM understand the feature set available, including optional extensions for lambdas and inheritance.

6. **Examples follow official documentation patterns** — using the classic "Chris" and "repo" examples from the man pages to ensure consistency with the broader Mustache ecosystem.

7. **Document HTML escaping behavior** — clarify the difference between `{{}}` (escaped), `{{{}}}` (unescaped/raw), and `{{&}}` (unescaped/raw) since this is a common source of confusion and important for generating safe HTML in Node-RED.

## Risks / Trade-offs

- **Documentation staleness**: Mustache spec evolves slowly but updates do occur. → Mitigation: version-anchor the skill (v1.3.0) and note that newer extensions may not be available.
- **Skill size**: Mustache is a relatively compact language compared to JSONata. → Mitigation: keep sections concise with focused examples rather than exhaustive exploration.
- **No tool integration**: LLMs may try to use tools that don't exist. → Mitigation: clearly state this is a reference-only skill in the description.
- **Overlap with other templating skills**: Node-RED supports multiple template formats. → Mitigation: the skill focuses exclusively on Mustache syntax, not on how to use the template node (which is covered by nodered-node-reference).
