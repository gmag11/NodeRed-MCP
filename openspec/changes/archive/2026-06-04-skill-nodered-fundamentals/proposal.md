# Skill: Node-RED Fundamentals

## What
Create an agent skill file that teaches AI assistants the foundational knowledge of Node-RED: core vocabulary (nodes, flows, wires, messages, context), design principles (tab organization, naming, documentation), and basic error handling concepts. This is the base knowledge skill that ALL other Node-RED skills build upon.

## Why
- Without vocabulary, LLM confuses "flow" (tab) vs "flow" (connected nodes), misuses config nodes
- Without design principles, LLM creates unmaintainable flows (single tab, unnamed nodes)
- Without error concepts, LLM doesn't know about catch nodes or context limitations
- Consolidates foundational knowledge from 3 former skills into one coherent base

## Scope
- In scope: Core vocabulary with MCP tool mapping, design principles (tab org, naming, docs), error handling basics (catch nodes), context storage, environment variables, link nodes overview
- Out of scope: Step-by-step build procedures (→ nodered-flow-builder), node type catalog (→ nodered-node-reference), pattern recipes (→ nodered-patterns)
