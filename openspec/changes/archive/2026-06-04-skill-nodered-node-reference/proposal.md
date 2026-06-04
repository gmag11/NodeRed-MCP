# Skill: Node-RED Node Reference

## What
This is the REFERENCE skill — a catalog of all built-in node types plus a deep-dive on the function node.

## Why
- Creating nodes via create-node requires knowing the correct type string and properties
- Without a reference, LLM guesses properties (broken nodes) or calls get-node-type-detail for every type (slow)
- The function node is the most powerful and error-prone node, deserving deep coverage
- Consolidates node catalog + function node deep-dive into one comprehensive reference

## Scope
- In scope: All built-in core node types by category (common, logic/transform, flow control, network, data parsing, storage), function node deep-dive (func property, globals, return semantics, context API, async patterns, logging)
- Out of scope: Third-party nodes (use get-node-type-detail), flow building procedures (→ nodered-flow-builder)
