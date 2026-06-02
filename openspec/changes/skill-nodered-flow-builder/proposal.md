## Why

Building Node-RED flows through MCP requires a procedural guide: what tools to call, in what order, with what parameters, and how to verify the result. Without this, the LLM must infer the workflow from individual tool descriptions, leading to errors like creating nodes in non-existent flows or wiring nodes without knowing their output port counts.

## What Changes

- Add `nodered-flow-builder` skill: a step-by-step procedural guide for building and editing flows via MCP tools

## Capabilities

### New Capabilities
- `skill-nodered-flow-builder`: skill at `.github/skills/nodered-flow-builder/SKILL.md`

### Modified Capabilities

## Impact

- New file: `.github/skills/nodered-flow-builder/SKILL.md`
