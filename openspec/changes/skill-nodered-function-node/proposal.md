## Why

The function node is Node-RED's most powerful node — it executes arbitrary JavaScript with access to messages, context, environment variables, and the Node-RED runtime APIs. The LLM needs deep knowledge of the function node's execution environment to write correct code, because mistakes (wrong API calls, context misuse) produce silent failures or runtime errors that are hard to debug.

## What Changes

- Add `nodered-function-node` skill: a comprehensive guide to writing function node code via MCP

## Capabilities

### New Capabilities
- `skill-nodered-function-node`: skill at `.github/skills/nodered-function-node/SKILL.md`

### Modified Capabilities

## Impact

- New file: `.github/skills/nodered-function-node/SKILL.md`
