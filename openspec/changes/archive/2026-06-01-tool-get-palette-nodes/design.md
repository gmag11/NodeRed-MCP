## Context

The Node-RED MCP server exposes tools for reading flows and nodes, but has no visibility into the Node-RED palette — the registry of installed node types. AI agents composing or auditing flows need to know what node types are available, what each type does, and what properties each type accepts. The Node-RED Admin API provides a `/nodes` endpoint that returns installed module metadata, including type names, categories, and per-type configuration schemas.

## Goals / Non-Goals

**Goals:**
- Add a `get-palette-nodes` tool that lists all node types available in the palette, paginated to avoid overwhelming LLM context windows
- Add a `get-node-type-detail` tool that returns documentation and parameter information for a specific node type name
- Reuse the existing Node-RED HTTP client and auth infrastructure

**Non-Goals:**
- Installing, enabling, or disabling node modules via MCP
- Caching palette data between calls

## Decisions

### Decision: Use `GET /nodes` with `Accept: application/json`

The Node-RED Admin API `/nodes` endpoint returns the full list of installed node modules and their node sets. When called with `Accept: application/json`, it returns structured JSON instead of HTML. Each module entry contains an array of node sets; each set contains an array of node `types` (type name strings) plus metadata (`name`, `version`, `module`, `enabled`, `local`).

**Alternative considered**: Scraping the Node-RED UI or using `GET /nodes/:module`. Rejected — `GET /nodes` in one call is simpler and returns everything needed.

### Decision: Return raw node set objects without transformation

The Node-RED `GET /nodes` API (with `Accept: application/json`) returns a flat array of node set objects, each with `id`, `name`, `module`, `version`, `types`, and `enabled` as defined in the Node-RED Admin API spec. These fields are already clean and LLM-friendly — no transformation is needed.

**Alternative considered**: Flattening the `types` array into one entry per type name. Rejected — it loses node set grouping and adds no value; the raw shape is already well-structured.

### Decision: Pagination over node sets, not individual types

Since the API returns one node set per file entry (not one per type), pagination is applied at the node set level. The response envelope uses `total` (total node sets) and `totalPages`.

**Alternative considered**: Paginating over individual type names. Rejected — breaks the natural grouping and would split a node set's `types` array across pages.

### Decision: Extend the HTTP client with a `requestText` method for non-JSON responses

The existing `client.request()` always parses the response as JSON. Fetching node documentation requires `Accept: text/html`, which returns raw HTML. Rather than adding an `Accept` override parameter to `request()`, a separate `client.requestText(method, path)` method is added that returns the raw response body as a string. This keeps the JSON path simple and avoids ambiguity at call sites.

**Alternative considered**: Adding an optional `accept` parameter to `client.request()`. Rejected — it would require callers to handle two different return types (parsed object vs. raw string) from the same method, making the interface harder to reason about.

### Decision: Extract per-type documentation from the `GET /nodes` HTML response

The same `GET /nodes` endpoint with `Accept: text/html` returns the concatenated HTML source for all installed nodes. Each node type's help text is wrapped in a `<script type="text/html" data-help-name="<type>">...</script>` block. `get-node-type-detail` will make a second call with `Accept: text/html`, extract the matching block via regex, and include its content as a `help` field alongside the JSON node set fields.

**Alternative considered**: `GET /nodes/<module>/<set>` — only returns JSON metadata, no help text. Rejected.

**Alternative considered**: Parsing all help blocks upfront. Rejected — we only need one type per call, so a single targeted regex extraction is sufficient.

### Decision: Return node type detail as merged object: node set fields + `help`

`get-node-type-detail` will spread all fields from the JSON node set and add a `help` string field containing the documentation converted to Markdown via `turndown` (or `null` if no documentation block is found for that type). This preserves the full raw API shape while enriching it with LLM-friendly documentation.

### Decision: Convert help HTML to Markdown using `turndown`

Node-RED help blocks contain structured HTML (`<p>`, `<dl>`, `<ul>`, `<code>`, `<h3>`, etc.). Delivering raw HTML to an MCP client forces the LLM to parse tags rather than reading content. The `turndown` library converts the extracted HTML to Markdown before returning it, producing clean, readable documentation (ATX headings, fenced code blocks).

**Alternative considered**: Returning raw HTML. Rejected — tags add noise for LLM consumers and provide no benefit over Markdown.

**Alternative considered**: Stripping tags to plain text. Rejected — loses structure (headings, lists, code) that is useful for understanding node parameters.

## Risks / Trade-offs

- **Risk**: Type names may not be globally unique if user has unusual modules → Mitigation: `get-node-type-detail` returns the first matching node set and includes the `module` field so the caller can verify.
- **Trade-off**: Pagination adds tool call overhead for full enumeration. The `total` and `totalPages` fields in the response allow callers to iterate programmatically.
