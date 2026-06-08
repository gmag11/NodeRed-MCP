## Why

Node-RED natively supports JSONata as its preferred expression language for data transformation within flows (e.g., in the "change" node). However, the MCP skill system currently lacks a dedicated JSONata reference skill. LLMs building Node-RED flows need authoritative guidance on JSONata syntax, operators, functions, and patterns to correctly configure nodes that use JSONata expressions. Adding this skill will enable the AI to write correct JSONata expressions for flow nodes without hallucinating syntax.

## What Changes

- Create a new skill file at `.github/skills/jsonata/SKILL.md` with comprehensive JSONata reference documentation
- Document the full JSONata expression language: path navigation, predicates, operators, functions, and programming constructs
- Cover all built-in function categories: string, numeric, aggregation, boolean, array, object, date/time, and higher-order functions
- Include practical examples mapped to common Node-RED use cases (change node, switch node, template node)
- Document JSONata's processing model: sequences, singleton equivalence, flattening rules
- Cover the JavaScript embedding API for custom function registration and guardrails configuration

## Capabilities

### New Capabilities

- `skill-jsonata`: Comprehensive JSONata expression language reference skill covering syntax, operators, built-in functions, processing model, programming constructs, and Node.js embedding API

### Modified Capabilities

None. This is a new standalone skill that does not modify existing spec requirements.

## Impact

- New file: `.github/skills/jsonata/SKILL.md`
- New spec: `openspec/specs/skill-jsonata/spec.md`
- Affected system: `src/skills/loader.js` (skill auto-discovery, no code changes needed)
- Dependencies: None (JSONata documentation sourced from official docs at https://docs.jsonata.org/)
