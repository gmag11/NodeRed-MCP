## Context

No standard MCP server exists for Node-RED. LLMs need a standardized programmatic interface to interact with Node-RED instances. This project starts from scratch as a standalone Node.js package. The Node-RED Admin API is REST/HTTP and supports three distinct authentication modes. The MCP server must be usable both embedded (stdio) and deployed remotely (HTTP).

## Goals / Non-Goals

**Goals:**
- Implement a functional MCP server in Node.js ESM with support for `stdio` and `Streamable HTTP`.
- Fully abstract Node-RED authentication (no auth, credentials, OIDC/API key) into a reusable client.
- Expose the `get-flows` tool with a response optimized for LLMs.
- Full configuration via environment variables.

**Non-Goals:**
- No support for multiple Node-RED instances per session (one instance per process/startup).
- No OAuth token refresh implementation (simple re-authentication on 401).
- No custom UI or dashboard.
- No WebSocket or SSE as MCP transport (stdio and Streamable HTTP only).

## Decisions

### D1: ESM over CommonJS
**Decision**: Use `"type": "module"` in `package.json` and `import/export` syntax.
**Rationale**: The official MCP SDK (`@modelcontextprotocol/sdk`) is optimized for ESM. Node.js 18+ has native fetch, eliminating extra dependencies. ESM is the modern standard.
**Rejected alternative**: CommonJS — would require workarounds with the SDK and goes against the direction of Node.js.

### D2: Transport selection via CLI flag
**Decision**: The `index.js` entry point reads `--transport=stdio` or `--transport=http` (with optional `--port=3000`).
**Rationale**: A single binary that works in both contexts without changes to business logic. Transport selection does not affect registered MCP tools.
**Rejected alternative**: Two separate binaries — would duplicate tool registration code.

### D3: Three authentication modes with automatic detection
**Decision**: On startup, the Node-RED client calls `GET /auth/login` to detect the auth type. If `NODERED_API_KEY` is defined, it is used directly as a Bearer token without detection.
**Rationale**: Covers 100% of real-world use cases (no auth for dev, credentials for standard installs, API key for OIDC) with zero extra config for the simplest mode.
**Rejected alternative**: Always require API key — would break installations without auth or with standard credentials.

### D4: Summarized `get-flows` response (not flat)
**Decision**: The `get-flows` tool transforms Node-RED's flat response into `[{ id, label, disabled, nodeCount, nodeTypes[] }]`, filtering only `type: "tab"` and `type: "subflow"`.
**Rationale**: Node-RED's flat response can contain hundreds of objects. An LLM only needs the high-level structure to reason about which flows exist and what they do. `nodeTypes[]` allows inferring the flow's purpose without additional tool calls.
**Rejected alternative**: Return the raw response — unworkable for LLMs on large instances.

### D5: Simple retry on 401 (no token refresh)
**Decision**: If an Admin API call returns 401, the client invalidates the in-memory token, automatically re-authenticates with the original credentials, and retries once.
**Rationale**: Node-RED tokens expire. Re-auth with user/pass is immediate. The OIDC flow has no accessible refresh token.
**Rejected alternative**: Implement refresh tokens — Node-RED credentials don't expose them; OIDC would require a browser flow.

### D6: Vitest for unit testing
**Decision**: Use `vitest` as the test runner with unit tests covering pure logic (response transformation, auth header generation, CLI arg parsing). Integration tests against a live Node-RED instance are optional and gated behind `NODERED_TEST_URL`.
**Rationale**: Vitest has native ESM support, zero config, fast execution, and built-in mocking. Unit tests on pure functions provide high value at low cost. Integration tests require infrastructure (Docker/live instance) and are better suited for CI pipelines.
**Rejected alternative**: Jest — requires extra configuration for ESM modules and is slower for this use case.

## Risks / Trade-offs

- **API key security in `.env`** → Mitigation: document that `.env` must not be committed; add `.env` to `.gitignore` by default.
- **Schema change in `GET /flows`** → Mitigation: always use `Node-RED-API-Version: v2`; validate response before transforming.
- **Node-RED instances with custom authentication** → Mitigation: if `GET /auth/login` returns an unknown `type`, the client throws a descriptive error suggesting the use of `NODERED_API_KEY`.
- **HTTP mode without MCP authentication** → The HTTP server does not implement MCP auth in v1. Accepted trade-off: assumes deployment on a trusted network or behind a reverse proxy.
- **Integration tests require live Node-RED** → Mitigation: gate integration tests behind `NODERED_TEST_URL`; CI can use a Docker container. Unit tests run without any external dependency.
