## Context

The MCP server supports two transports: stdio (for local process-to-process use) and streamable HTTP (for networked clients). Only the HTTP transport is meaningful in a container environment. The server already has a `start:http` npm script (`node index.js --transport=http`) and reads configuration from environment variables (`NODERED_URL`, `NODERED_USER`, `NODERED_PASSWORD`, `PORT`).

The goal is to package the server as a minimal Docker image and provide a `docker-compose.yml` for easy local or server deployment.

## Goals / Non-Goals

**Goals:**
- `Dockerfile` that builds a production-ready image using the HTTP transport
- `docker-compose.yml` that wires up environment variables and exposes the HTTP port
- `.env.example` entries for any new variables needed (e.g. `PORT`)
- The container starts with `npm run start:http`

**Non-Goals:**
- stdio transport inside Docker (not applicable)
- Multi-stage builds beyond what is needed for a clean Node.js image
- Kubernetes / Helm manifests
- TLS termination inside the container (that is a reverse-proxy concern)
- Changes to transport logic or tool implementations

## Decisions

### Base image: `node:20-alpine`
Alpine keeps the image small (<100 MB). Node 20 is LTS and satisfies the `engines.node >= 18` constraint in `package.json`. The alternative (`node:20-slim` / Debian) is larger with no benefit here.

### Run as non-root user
The Dockerfile creates a dedicated `node` user (already present on official Node images) and drops privileges before `CMD`. This follows the principle of least privilege and avoids writing as root inside the container.

### Copy only production files; no devDependencies
`npm ci --omit=dev` is run inside the image to exclude Vitest and other dev deps, reducing image size and attack surface.

### Port configuration via `PORT` env var
`index.js` already reads `PORT` from the environment (falls back to 3000). The Dockerfile exposes 3000; the Compose file maps it and allows override via `.env`.

### `docker-compose.yml` references a `.env` file
All secrets and Node-RED coordinates stay outside version control. The Compose file uses `env_file: .env` so operators only need to create a `.env` from `.env.example`.

## Risks / Trade-offs

- [Session state is in-memory] → If the container restarts, active MCP sessions are lost. Mitigation: clients must re-establish sessions; this is acceptable for the current use case.
- [No health check by default] → A basic `HEALTHCHECK` HTTP call to `/mcp` (GET without session header) returns 400 but confirms the server is up. Adding a dedicated `/health` endpoint is a follow-up concern.

## Migration Plan

1. Build the image: `docker compose build`
2. Create `.env` from `.env.example` and fill in Node-RED credentials
3. Start: `docker compose up -d`
4. Verify: `curl -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -d '{}'`
5. Rollback: `docker compose down` — no persistent state to clean up
