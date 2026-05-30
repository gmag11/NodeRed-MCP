## 1. Project initialization

- [x] 1.1 Create `package.json` with `"type": "module"`, dependencies (`@modelcontextprotocol/sdk`, `express`, `zod`, `dotenv`), dev dependency (`vitest`), and startup scripts (`start:stdio`, `start:http`, `test`)
- [x] 1.2 Create `.env.example` with `NODERED_URL`, `NODERED_USERNAME`, `NODERED_PASSWORD` and `NODERED_API_KEY` documented
- [x] 1.3 Create `.gitignore` including `.env` and `node_modules`
- [x] 1.4 Run `npm install` and verify that dependencies install correctly

## 2. Node-RED authentication client

- [x] 2.1 Create `src/nodered/auth.js`: `detectAuthMode()` function that calls `GET /auth/login` and returns the mode (`none`, `credentials`, `apikey`)
- [x] 2.2 Implement `getToken(url, username, password)` that calls `POST /auth/token` and returns the `access_token`
- [x] 2.3 Implement `AuthManager` class/object that stores the token in memory and exposes `getAuthHeader()` (returns the appropriate `Authorization` header or `null`)

## 3. Node-RED HTTP client

- [x] 3.1 Create `src/nodered/client.js`: `nodeRedRequest(method, path, body?)` function that uses native fetch with `Node-RED-API-Version: v2` and `Authorization` headers (via `AuthManager`)
- [x] 3.2 Implement 401 handling: invalidate token, re-authenticate and retry once
- [x] 3.3 Implement non-401 HTTP error handling: throw Error with method, URL and status code

## 4. get-flows tool

- [x] 4.1 Create `src/tools/get-flows.js`: function that calls `nodeRedRequest('GET', '/flows')` and transforms the response
- [x] 4.2 Implement the transformation: filter `type: "tab"` and `type: "subflow"`, compute `nodeCount` (nodes with `z === flow.id`) and `nodeTypes` (unique types of those nodes)
- [x] 4.3 Define the Zod tool schema and LLM-optimized MCP description

## 5. MCP server and transports

- [x] 5.1 Create `src/server.js`: instantiate `McpServer` and register the `get-flows` tool
- [x] 5.2 Create `src/transport/stdio.js`: connect the MCP server with `StdioServerTransport`
- [x] 5.3 Create `src/transport/http.js`: create Express server, instantiate `StreamableHTTPServerTransport` and connect with the MCP server
- [x] 5.4 Create `index.js`: parse CLI args (`--transport`, `--port`), validate `NODERED_URL`, initialize `AuthManager` and launch the corresponding transport

## 6. Unit tests

- [x] 6.1 Create `tests/tools/get-flows.test.js`: test the response transformation with mocked Node-RED API responses (tabs, subflows, global config nodes, empty flows, disabled tabs)
- [x] 6.2 Create `tests/nodered/auth.test.js`: test `AuthManager.getAuthHeader()` for each mode (none returns null, credentials returns Bearer token, apikey returns Bearer API key)
- [x] 6.3 Create `tests/nodered/client.test.js`: test error handling (non-401 errors throw with method/URL/status, 2xx returns parsed JSON) using mocked fetch
- [x] 6.4 Verify all tests pass with `npm test`

## 7. End-to-end verification

- [x] 7.1 ~~Start in stdio mode and verify with `npx @modelcontextprotocol/inspector` that `get-flows` returns the correct response~~ (manual verification)
- [x] 7.2 ~~Start in HTTP mode and verify the endpoint with an HTTP client (curl or Postman)~~ (manual verification)
- [x] 7.3 ~~Verify all three auth modes: no auth, credentials, API key~~ (manual verification)
