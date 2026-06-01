## Context

The Node-RED MCP server exposes tools for reading flows and nodes, but has no visibility into the Node-RED palette — the registry of installed node types. AI agents composing or auditing flows need to know what node types are available, what each type does, and what properties each type accepts. The Node-RED Admin API provides a `/nodes` endpoint that returns installed module metadata, including type names, categories, and per-type configuration schemas.

## Goals / Non-Goals

**Goals:**
- Add a `get-palette-nodes` tool that lists all node types available in the palette, paginated to avoid overwhelming LLM context windows
- Add a `get-node-type-detail` tool that returns documentation and parameter information for a specific node type name
- Reuse the existing Node-RED HTTP client and auth infrastructure

**Non-Goals:**
- Installing, enabling, or disabling node modules via MCP
- Returning the raw Node-RED node HTML/JS source
- Caching palette data between calls

## Decisions

### Decision: Use `GET /nodes` with `Accept: application/json`

The Node-RED Admin API `/nodes` endpoint returns the full list of installed node modules and their node sets. When called with `Accept: application/json`, it returns structured JSON instead of HTML. Each module entry contains an array of node sets; each set contains an array of node `types` (type name strings) plus metadata (`name`, `version`, `module`, `enabled`, `local`).

**Alternative considered**: Scraping the Node-RED UI or using `GET /nodes/:module`. Rejected — `GET /nodes` in one call is simpler and returns everything needed.

### Decision: Flatten module/set structure into a per-type list for `get-palette-nodes`

The raw API response is module-centric (module → sets → types). LLMs work better with a flat list where each entry represents one node type. The tool will flatten this and return `{ type, module, version, category, description, enabled }` per entry.

**Alternative considered**: Returning the nested module structure. Rejected — it requires more LLM navigation and is redundant for palette exploration.

### Decision: Pagination by default on `get-palette-nodes`

A Node-RED instance with many modules can have hundreds of node types. Returning all at once would consume excessive context. Pagination with `page` (1-based, default 1) and `pageSize` (default 50, max 200) keeps responses manageable while allowing full enumeration.

### Decision: `get-node-type-detail` queries by type name, not module

LLMs discovering nodes from `get-palette-nodes` know the type name (e.g. `"inject"`). Looking up by type name is more natural than requiring the module name. The implementation will fetch `GET /nodes`, find the matching type across all sets, and return the full set metadata for that type.

**Alternative considered**: Require `module` + `type`. Rejected — adds friction; type names are unique enough in practice.

### Decision: Parameter/property schema from node set metadata

The `/nodes` JSON response includes a `config` field per node set containing the node's editable properties and their types (from the Node-RED node configuration schema). This is surfaced in `get-node-type-detail` as a `parameters` array.

## Risks / Trade-offs

- **Risk**: Some Node-RED versions may not include `config` schema in the `/nodes` JSON response → Mitigation: return an empty `parameters: []` gracefully rather than failing.
- **Risk**: Type names may not be globally unique if user has unusual modules → Mitigation: `get-node-type-detail` returns the first match and includes `module` in the response so the caller can verify.
- **Trade-off**: Pagination adds tool call overhead for full enumeration. The `totalTypes` and `totalPages` fields in the response allow callers to iterate programmatically.
