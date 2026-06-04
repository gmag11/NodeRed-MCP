## Context

The Node-RED Admin API exposes a `POST /nodes` endpoint that installs a new node module from the npm registry into the running Node-RED instance. The request body is `{ "module": "<npm-package-name>" }` with `Content-Type: application/json`. Per the official docs, the API does **not** support npm version qualifiers like `@1.2.3` or `.tgz` files via the JSON body — only plain package names. Installing `.tgz` files uses `multipart/form-data` and is out of scope. The response on success (200) is always a JSON Node Module object: `{ name, version, nodes: [{ id, name, types, enabled, loaded, module }] }`. Errors return 400 (bad request) or 404 (not found).

Node packages are discoverable via the official Node-RED library at https://flows.nodered.org/search?type=node. The intended end-to-end workflow is:
1. User makes a generic request (e.g., "Instala un nodo para hacer un bot de Telegram")
2. LLM searches the library catalog to find relevant npm packages
3. LLM presents options to the user
4. User chooses a package
5. LLM calls `install-node` with the chosen npm package name

The MCP server already has tools for listing palette nodes (`get-palette-nodes`) and inspecting node types (`get-node-type-detail`). Adding `install-node` completes the palette management lifecycle: discover (library) → choose → install (this tool).

The existing `createNodeRedClient` already provides `request()` and `post()` methods with automatic auth, 401 retry, and error handling. No new client infrastructure is needed.

## Goals / Non-Goals

**Goals:**
- Expose an MCP tool `install-node` that accepts an npm package name and calls `POST /nodes` on the Node-RED Admin API
- Return the installation result (node set info or status message) to the MCP client
- Handle common error cases: package not found on npm, network failure, Node-RED API errors
- Follow existing patterns for Zod schema validation, tool handler structure, and error reporting

**Non-Goals:**
- Searching the Node-RED library catalog (the LLM browses https://flows.nodered.org directly)
- Installing from local `.tgz` files or URLs — only npm registry packages
- Progress reporting during installation (the POST /nodes endpoint is synchronous but may take time; we rely on the client's default timeout)
- Uninstalling nodes (separate `DELETE /nodes/:module` endpoint — future concern)
- Bulk installation of multiple modules in a single call

## Decisions

### Decision 1: Use existing `client.request('POST', '/nodes', body)` pattern
**Rationale:** The existing client already handles auth headers, 401 retry, JSON serialization, and error formatting. Using `client.post('/nodes', { module })` (which delegates to `request`) ensures consistent behavior with all other tools.
**Alternatives considered:** A dedicated `installNode()` method on the client — rejected as unnecessary abstraction for a single endpoint call.

### Decision 2: Accept a single `module` string parameter (plain npm package name)
**Rationale:** The Node-RED Admin API accepts exactly one field: `module` (the npm package name, without version qualifiers). Per the official docs, the API does **not** support `@version` syntax or `.tgz` files via the JSON body — only a plain package name or a full directory path. The MCP tool mirrors this with a required `module` string parameter accepting just the plain package name. The package name comes from the Node-RED library catalog (flows.nodered.org), where each entry lists its npm package name.
**Alternatives considered:** Adding a `version` parameter — rejected because the API itself does not support version specifiers via JSON.

### Decision 3: Return the Node Module object from the API response
**Rationale:** Per the official docs, `POST /nodes` on success (200) always returns a JSON Node Module object with `name`, `version`, and a `nodes` array of installed node types. The tool returns this object directly — no format detection needed.
**Alternatives considered:** Wrapping in a `format` field — rejected because the API response is always JSON, making format detection unnecessary.

### Decision 4: Single-phase synchronous call
**Rationale:** The MCP tool pattern is request-response. The `POST /nodes` endpoint in Node-RED blocks until installation completes (or fails). No polling or status check is needed.
**Alternatives considered:** Async pattern with status polling — rejected as over-engineering for this endpoint's behavior.

## Risks / Trade-offs

- **[Risk] Installation can take 30+ seconds for large packages** → Mitigation: Document expected latency in the tool description; the user's MCP client controls timeout
- **[Risk] Module name typos result in npm "not found" errors** → Mitigation: Error message from Node-RED API is passed through to the MCP client, which includes the npm error detail
- **[Risk] Installing a module may require a restart for full activation** → Mitigation: Document in the tool description that some nodes may need a Node-RED restart; the tool only handles the installation step
- **[Trade-off] No rollback on failure** → If installation fails mid-way, the partially-installed state is left to Node-RED/npm to handle (same as manual installation via the Node-RED editor)
