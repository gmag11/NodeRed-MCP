# Skill: Node-RED Flow Builder

## What
This is the OPERATIONAL guide - how to actually build, edit, test, and debug flows using MCP tools step by step.

## Why
- Individual tool descriptions explain *what* each tool does but not *how* to orchestrate them
- Without a builder guide the LLM creates nodes but forgets to wire them, places all nodes at (0,0), doesn't verify results
- Debugging via MCP requires knowing the inject → debug → read sequence
- Consolidates operational knowledge from flow-builder + debug + flow-architecture into one guide

## Scope
- In scope: Build workflow (create → wire → verify), edit workflow, delete workflow, import workflow, port numbering, coordinate grid, debug workflow (inject → read-debug-messages → analyze → fix), common mistakes
- Out of scope: Node property details (→ nodered-node-reference), pattern recipes (→ nodered-patterns), core concepts (→ nodered-fundamentals)
