## Why

The MCP server currently runs only as a local process. To enable deployment in containerized environments and simplify distribution, the server needs to be packaged as a Docker image and orchestrated via Docker Compose — limited to the streamable HTTP transport, which is the only transport that makes sense in a networked container context.

## What Changes

- Add a `Dockerfile` to build a production-ready container image for the MCP server
- Add a `docker-compose.yml` to run the server with all required environment configuration
- The container exposes only the streamable HTTP transport (`src/transport/http.js`); stdio transport is not applicable in this context
- Environment variables (Node-RED URL, credentials, port) are injected via `.env` / Compose env section

## Capabilities

### New Capabilities

- `docker-deployment`: Dockerfile and Docker Compose configuration to build and run the MCP server as a containerized streamable-HTTP service

### Modified Capabilities

*(none)*

## Impact

- New files: `Dockerfile`, `docker-compose.yml`
- Existing `src/transport/http.js` is the entry point used by the container
- `package.json` start script may need a dedicated `start:http` command
- No changes to existing transport or tool logic
- Consumers who run the server locally are unaffected
