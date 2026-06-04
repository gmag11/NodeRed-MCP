## Context

The Node-RED Admin API exposes a `DELETE /nodes/:module` endpoint that uninstalls a previously installed node module from the running Node-RED instance. The `:module` path parameter is the module identifier (as returned in palette listings by `get-palette-nodes`). On success, the endpoint returns 204 No Content. Errors return 404 (module not found) or 401 (not authorized).

The MCP server already has `install-node` (POST /nodes) for adding nodes. This tool is its natural counterpart, completing the install/uninstall lifecycle. Both tools follow identical patterns: a single string parameter, a single API call via `client.request()`, and JSON-formatted output.

The existing `createNodeRedClient` already provides a `request()` method supporting all HTTP methods (GET, POST, PUT, DELETE) with automatic auth, 401 retry, and error handling. No new client infrastructure is needed.

## Goals / Non-Goals

**Goals:**
- Expose an MCP tool `uninstall-node` that accepts a module identifier and calls `DELETE /nodes/:module` on the Node-RED Admin API
- Return confirmation of successful uninstallation (204 → `{ uninstalled: true, module: "..." }`)
- Handle error cases: module not found (404), Node-RED API errors
- Follow existing patterns for Zod schema validation, tool handler structure, and error reporting

**Non-Goals:**
- Bulk uninstallation of multiple modules in a single call
- Automatic cleanup of flows that reference the uninstalled node types (Node-RED handles this internally)
- Version-specific uninstallation (the API removes the entire module)

## Decisions

### Decision 1: Use existing `client.request('DELETE', '/nodes/' + module, null)` pattern
**Rationale:** `client.request()` already supports DELETE and handles auth, 401 retry, and error formatting. The DELETE endpoint has no request body, so `null` is passed for body.
**Alternatives considered:** A dedicated `client.delete()` method — rejected as unnecessary for a single endpoint call; `request('DELETE', ...)` is sufficient.

### Decision 2: Accept a single `module` string parameter
**Rationale:** The Node-RED Admin API uses `:module` as a path parameter. The MCP tool mirrors this with a required `module` string parameter. Users can discover module identifiers via `get-palette-nodes`.
**Alternatives considered:** Accepting a node type name and resolving it to a module — rejected as over-engineering; module identifiers are readily available from the palette listing.

### Decision 3: Return `{ uninstalled: true, module: "..." }` on success
**Rationale:** The API returns 204 No Content with an empty body. To give the MCP client meaningful feedback, the tool returns a confirmation object with the module name. This is consistent with how `delete-node` returns `{ nodeId, deleted: true }`.
**Alternatives considered:** Returning null or an empty object — rejected because it leaves the LLM with no confirmation of what was uninstalled.

### Decision 4: Single-phase synchronous call
**Rationale:** The DELETE endpoint responds immediately (no async installation process). The tool is a straightforward request-response.

## Risks / Trade-offs

- **[Risk] Uninstalling a module removes its node types from all flows** → Mitigation: The tool description warns that flows using the uninstalled types will lose those nodes; suggest exporting flows before uninstalling if unsure
- **[Risk] Module identifier vs npm package name confusion** → Mitigation: The parameter is named `module` (matching the API) and the description clarifies it's the module identifier as shown in `get-palette-nodes`
