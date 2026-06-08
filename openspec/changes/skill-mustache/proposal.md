## Why

Node-RED's "template" node supports Mustache as one of its templating engines, and Mustache is widely used across many programming languages and frameworks for logic-less templating. However, the MCP skill system currently lacks a dedicated Mustache reference skill. LLMs building Node-RED flows need authoritative guidance on Mustache syntax, tag types, and usage patterns to correctly configure template nodes that use Mustache format. Adding this skill will enable the AI to write correct Mustache templates without hallucinating syntax.

## What Changes

- Create a new skill file at `.github/skills/mustache/SKILL.md` with comprehensive Mustache templating reference documentation
- Document all Mustache tag types: variables (escaped `{{}}` and unescaped `{{{}}}`), sections (`{{#}}/{{/}}`), inverted sections (`{{^}}/{{/}}`), comments (`{{!}}`), partials (`{{>}}`), blocks (`{{$}}/{{/}}`), parents (`{{<}}/{{/}}`), and set delimiters (`{{= =}}`)
- Document dotted-name resolution, implicit iterator (`.`), and context traversal
- Document lambda/callable support for both variables and sections
- Document the inheritance extension: blocks, parents, and dynamic names
- Include practical examples mapped to common Node-RED template node use cases
- Document the Mustache specification version (1.3.0) and its relationship to the formal spec

## Capabilities

### New Capabilities

- `skill-mustache`: Comprehensive Mustache templating language reference skill covering all tag types (variables, sections, inverted sections, comments, partials, blocks, parents, set delimiters), dotted-name resolution, lambdas, inheritance, dynamic names, and practical Node-RED template node usage patterns

### Modified Capabilities

None. This is a new standalone skill that does not modify existing spec requirements.

## Impact

- New file: `.github/skills/mustache/SKILL.md`
- New spec: `openspec/specs/skill-mustache/spec.md`
- Affected system: `src/skills/loader.js` (skill auto-discovery, no code changes needed)
- Dependencies: None (Mustache documentation sourced from official docs at https://mustache.github.io/)
