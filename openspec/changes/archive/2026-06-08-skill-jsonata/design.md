## Context

The MCP (Model Context Protocol) server for Node-RED includes a skill system that loads `.github/skills/*/SKILL.md` files as LLM guidance documents. Each skill has YAML frontmatter with `name`, `description`, and `tools` fields. The existing skills cover Node-RED fundamentals, flow building, subflows, patterns, and node references. There is currently no skill covering JSONata, which is Node-RED's native expression language used extensively in nodes like "change", "switch", and "inject".

The skill content is sourced from the official JSONata documentation at https://docs.jsonata.org/, covering version 2.2.0 of the language specification and the JavaScript reference implementation.

## Goals / Non-Goals

**Goals:**
- Provide a comprehensive, self-contained JSONata reference for LLMs building Node-RED flows
- Cover all JSONata syntax: path navigation, predicates, operators, function library
- Cover programming constructs: variables, functions, recursion, closures, partial application
- Document the processing model: sequences, flattening, singleton equivalence
- Include Node-RED-specific usage notes and common patterns
- Follow the existing skill format conventions (YAML frontmatter, markdown body, clear section headings)

**Non-Goals:**
- Creating new MCP tools for JSONata evaluation or validation
- Modifying existing MCP tool implementations
- Creating a JSONata parser or runtime
- Covering third-party JSONata extensions or non-standard implementations
- Replicating every single detail from the official docs verbatim (focus on practical reference)

## Decisions

1. **Skill name: `jsonata`** — kept simple as "jsonata" rather than prefixed with "nodered-" since JSONata is a standalone language with its own identity, even though it's used within Node-RED contexts.

2. **No associated MCP tools** — unlike most other skills, the JSONata skill has no `tools` list because there are no JSONata-specific MCP operations. The skill is purely a reference/guidance document. The YAML frontmatter `tools` field will be omitted or empty.

3. **Organization by topic** — following the official documentation structure: simple queries, predicates, operators (by category), functions (by category), programming constructs, processing model, and embedding API.

4. **Include Node-RED context** — a dedicated section maps JSONata concepts to Node-RED node configurations (change node expression type, switch node conditions, etc.).

5. **Use version anchoring** — explicitly reference JSONata 2.2.0 to help the LLM understand the feature set available in current Node-RED installations.

6. **Examples use the standard "Fred Smith" dataset** — consistent with the official documentation to ensure familiarity.

## Risks / Trade-offs

- **Documentation staleness**: JSONata evolves independently. → Mitigation: version-anchor the skill and note that newer features may not be available.
- **Skill size**: JSONata is a large language with many functions. → Mitigation: use compact reference tables for function signatures rather than verbose descriptions.
- **No tool integration**: LLMs may try to use tools that don't exist. → Mitigation: clearly state this is a reference-only skill in the description.
