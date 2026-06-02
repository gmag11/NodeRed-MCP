## Why

The LLM using this MCP server must understand Node-RED's core vocabulary before it can use any tool effectively. Without a shared conceptual model, it will confuse "flow" (tab) with "flow" (connected nodes), misuse config nodes, or not understand the relationship between wires and messages.

## What Changes

- Add `nodered-concepts` skill: a SKILL.md file providing the LLM with Node-RED's fundamental concepts, vocabulary, and mental model
- The skill is invoked by the LLM when it needs to orient itself before working with Node-RED

## Capabilities

### New Capabilities
- `skill-nodered-concepts`: skill file at `.github/skills/nodered-concepts/SKILL.md`

### Modified Capabilities

## Impact

- New file: `.github/skills/nodered-concepts/SKILL.md`
