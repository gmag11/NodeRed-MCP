# MCP Skills Integration

## What
Add MCP Prompts capability (expose each skill as a user-selectable prompt template), MCP Resources capability (expose each skill as a readable resource), and a `get-skill` tool for maximum client compatibility. A skill loader module will read and cache skill content from `.github/skills/*/SKILL.md` files.

## Why
- Skills as standalone `.github/skills/` files only work for AI clients that support reading skill files
- Many MCP clients cannot read skill files directly
- The MCP protocol defines Prompts and Resources primitives specifically for exposing knowledge
- A hybrid approach exposes skills via 3 complementary channels, maximizing compatibility

## Scope
- In scope: Prompts registration, Resources registration, get-skill tool, skill loader module, loading skills from .github/skills/*/SKILL.md files
- Out of scope: Creating the skill content itself (→ separate skill changes)
