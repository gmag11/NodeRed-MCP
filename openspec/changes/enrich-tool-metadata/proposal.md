# Proposal: enrich-tool-metadata

## What

Add MCP protocol annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`), Zod output schemas (`outputSchema`), and structured content (`structuredContent`) to all ~38 tool registrations in `src/server.js`.

## Why

The MCP SDK supports annotations that help LLM clients decide whether a tool can be executed automatically, requires user confirmation, or is safe to retry. Currently, **zero** of the 38 tools have annotations — the LLM has no metadata to guide safe tool usage.

Similarly, `outputSchema` enables clients to understand the structure of tool responses without parsing JSON, and `structuredContent` provides typed, validated response data alongside the text representation. Without these, every response is a raw JSON string that the LLM must parse manually.

This change brings the MCP server in line with the [MCP Server Development Guide](https://modelcontextprotocol.io) best practices:

- **Annotations**: Required for safe agent operation (the guide lists them as a core requirement)
- **Output schemas**: Improves agent reasoning by providing typed response shapes
- **Structured content**: Enables SDK-level validation of responses

## Scope

- All 38+ tool registrations in `src/server.js`
- New shared Zod schemas for common response shapes
- Tool-side handler adjustments to return `structuredContent`
- No breaking changes — text responses remain, structured content is additive

## Non-goals

- Migrating to TypeScript (separate future change)
- Changing tool behavior or input schemas
- Adding resource templates or new tools
