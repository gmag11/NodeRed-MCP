## Why

Creating and updating nodes via MCP requires knowing the JSON property structure of each node type. Without this knowledge the LLM either guesses properties (producing broken nodes) or must call `get-node-type-detail` for every single node type it encounters. A skill that catalogs the most common node types and explains how to use `get-node-type-detail` for the rest makes the LLM far more productive.

## What Changes

- Add `nodered-core-nodes` skill: a SKILL.md covering the most common built-in Node-RED node types and their JSON properties
- Sub-files with JSON examples for each node category, readable on demand

## Capabilities

### New Capabilities
- `skill-nodered-core-nodes`: skill at `.github/skills/nodered-core-nodes/SKILL.md`
- `skill-nodered-core-nodes-examples`: JSON example sub-files at `.github/skills/nodered-core-nodes/examples/`

### Modified Capabilities

## Impact

- New directory: `.github/skills/nodered-core-nodes/`
- New file: `.github/skills/nodered-core-nodes/SKILL.md`
- New files: `.github/skills/nodered-core-nodes/examples/<category>.json`
