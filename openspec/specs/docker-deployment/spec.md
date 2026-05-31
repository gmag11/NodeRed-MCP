# docker-deployment Specification

## Purpose
TBD - created by archiving change docker-streamable-http. Update Purpose after archive.
## Requirements
### Requirement: Dockerfile builds a runnable image
The project SHALL include a `Dockerfile` that produces a self-contained Node.js image capable of running the MCP server with the streamable HTTP transport.

#### Scenario: Image builds successfully
- **WHEN** `docker build -t nodered-mcp .` is executed from the project root
- **THEN** the build completes without error and produces a tagged image

#### Scenario: Image runs as non-root user
- **WHEN** `docker run --rm nodered-mcp whoami` is executed
- **THEN** the output is `node` (not `root`)

#### Scenario: Devdependencies are excluded
- **WHEN** the image is inspected or a container is started
- **THEN** `node_modules` does NOT contain Vitest or other devDependencies

### Requirement: Container starts the HTTP transport on the configured port
The container SHALL start the MCP server using `npm run start:http` and listen on the port specified by the `PORT` environment variable (default 3000).

#### Scenario: Server starts on default port
- **WHEN** a container is run without a `PORT` variable
- **THEN** the HTTP transport listens on port 3000 inside the container

#### Scenario: Server starts on custom port
- **WHEN** a container is run with `PORT=8080`
- **THEN** the HTTP transport listens on port 8080 inside the container

### Requirement: Docker Compose file orchestrates the service
The project SHALL include a `docker-compose.yml` that builds the image, injects environment variables from a `.env` file, and maps the container port to the host.

#### Scenario: Service starts with Compose
- **WHEN** `docker compose up -d` is executed with a valid `.env` file present
- **THEN** the `nodered-mcp` service starts and the `/mcp` endpoint is reachable on the mapped host port

#### Scenario: Environment variables are passed to the container
- **WHEN** `NODERED_URL`, `NODERED_USER`, and `NODERED_PASSWORD` are set in `.env`
- **THEN** the running container has those variables available and uses them to authenticate against Node-RED

### Requirement: Example environment file documents all required variables
The project SHALL provide or update `.env.example` with all environment variables required by the Docker deployment.

#### Scenario: New operator can configure the deployment from the example file
- **WHEN** an operator copies `.env.example` to `.env` and fills in the values
- **THEN** running `docker compose up -d` produces a working service with no missing configuration errors

