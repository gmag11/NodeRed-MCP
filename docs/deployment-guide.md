# Deployment & Usage Guide

This document covers the three ways to deploy and use the Node-RED MCP server: **stdio**, **HTTP**, and **Docker**.

---

## Method 1: stdio (recommended for local editor use)

The stdio transport is the simplest: the server communicates with the MCP client over standard input/output. No network port is exposed — ideal for editors like VS Code, Cursor, or Claude Desktop.

### Configuration

Create a `.env` file (copy from `.env.example`):

```env
NODERED_URL=http://localhost:1880
NODERED_API_KEY=your-api-key-if-needed
```

- `NODERED_URL` — required, URL of your Node-RED instance.
- `NODERED_API_KEY` — Node-RED API key. Alternative: `NODERED_USERNAME` + `NODERED_PASSWORD`.
- `MCP_API_KEY` and `MCP_OAUTH_*` — **do not apply in stdio** (no HTTP layer).

### Run

The recommended way is via `npx` — no clone or install needed:

```bash
npx -y @gmag11/nodered-mcp-server --transport=stdio
```

Or from a local clone (for development):

```bash
npm install
node index.js --transport=stdio
# or:
npm run start:stdio
```

### VS Code configuration

`.vscode/mcp.json`:

```json
{
    "servers": {
        "nodered-mcp": {
            "type": "stdio",
            "command": "npx",
            "args": ["-y", "@gmag11/nodered-mcp-server", "--transport=stdio"],
            "env": {
                "HOME": "/home/your-user",
                "NODERED_URL": "http://localhost:1880",
                "NODERED_API_KEY": "your-api-key"
            }
        }
    }
}
```

> **Note:** `HOME` in `env` is required for `npx` to resolve its npm cache correctly when spawned by VS Code's MCP extension. Replace `/home/your-user` with your actual home directory (`echo $HOME`).

> **Understanding `type` in mcp.json:** When `type` is `"stdio"`, VS Code **spawns** the server process and **connects** to it — one step, no external process needed. When `type` is `"http"`, VS Code only **connects** to an already-running server — you must start the server separately. For local development, `stdio` is almost always the right choice.

### Claude Desktop configuration

`claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "nodered": {
            "command": "npx",
            "args": ["-y", "@gmag11/nodered-mcp-server", "--transport=stdio"],
            "env": {
                "HOME": "/home/your-user",
                "NODERED_URL": "http://localhost:1880",
                "NODERED_API_KEY": "your-api-key"
            }
        }
    }
}
```

---

## Method 2: HTTP (for remote access or multi-client setups)

The HTTP transport exposes an Express server with a `/mcp` endpoint (MCP Streamable HTTP). It supports concurrent client connections and optional authentication.

> **Important:** Unlike `stdio`, HTTP mode requires you to **first start the server** in a terminal, then configure `mcp.json` to connect to it. The server and the client connection are two separate steps.

### Configuration

Create a `.env` file (copy from `.env.example`):

```env
NODERED_URL=http://localhost:1880
NODERED_API_KEY=your-nodered-api-key

# HTTP server port (default: 3000)
MCP_HTTP_PORT=3000

# Optional: protect with an API key
MCP_API_KEY=your-mcp-api-key
```

### Start the server

```bash
npx -y @gmag11/nodered-mcp-server --transport=http
```

### Connect from VS Code

`.vscode/mcp.json`:

```json
{
    "servers": {
        "nodered-mcp": {
            "type": "http",
            "url": "http://localhost:3000/mcp",
            "headers": {
                "Authorization": "Bearer your-mcp-api-key"
            }
        }
    }
}
```

Note that the HTTP `mcp.json` config does **not** spawn the server — it only points to an already-running instance.

### MCP server authentication modes

The HTTP server supports three modes:

| Mode | Configuration |
|---|---|
| **No auth** | Leave `MCP_API_KEY` and `MCP_OAUTH_ENABLED` unset |
| **API Key** | `MCP_API_KEY=your-key` — clients pass `Authorization: Bearer your-key` |
| **OAuth 2.0** | `MCP_OAUTH_ENABLED=true` + `MCP_OAUTH_ISSUER_URL=https://your-server.com` |

#### API Key mode (recommended)

Generate a secure key and set it in the server's environment:

```bash
openssl rand -hex 32
```

```env
MCP_API_KEY=random-generated-key
```

#### OAuth 2.0 mode

```env
MCP_OAUTH_ENABLED=true
MCP_OAUTH_ISSUER_URL=https://your-server.com
```

MCP clients discover OAuth automatically via `/.well-known/oauth-authorization-server`. Exposed endpoints:

| Endpoint | Description |
|---|---|
| `POST /register` | Dynamic client registration |
| `GET /authorize` | Authorization code flow (PKCE) |
| `POST /token` | Token issuance and refresh |
| `POST /revoke` | Token revocation |
| `GET /.well-known/oauth-authorization-server` | RFC 8414 metadata |

### Staging Viewer

The HTTP server exposes a staging viewer at the root (`GET /`) that shows the current Node-RED workspace state with undeployed nodes highlighted.
You can open the staging viewer in a browser at `http://localhost:3000/staging` (or your configured port).

---

## Method 3: Docker Compose

The project includes a `docker-compose.yml` that starts both Node-RED and the MCP server.

### Configuration

```env
NODERED_URL=http://nodered:1880       # docker compose service name
MCP_HTTP_PORT=3000
NODERED_API_KEY=your-api-key
MCP_API_KEY=your-mcp-api-key          # optional
```

### Structure

```yaml
services:
  nodered-mcp:
    build: .
    env_file: .env
    ports:
      - "${MCP_HTTP_PORT:-3000}:${MCP_HTTP_PORT:-3000}"
```

### Run

```bash
docker compose up -d
```

This starts the MCP server on `:3000`.

---

## Quick reference

| Method | Best for | Port | MCP Auth |
|---|---|---|---|
| **stdio** | VS Code, Claude Desktop, single editor | None | N/A |
| **HTTP** | Multi-client, remote access, OAuth | `3000` (configurable) | API Key / OAuth 2.0 |
| **Docker** | Production, isolated environments | `3000` | API Key / OAuth 2.0 |

---

## Verify it works

Regardless of the method, once started you can verify the connection with any MCP client. Available tools include:

- `list-skills` — list available Node-RED skills.
- `get-skill` — retrieve the full content of a skill.
- `get-flows` — list flows from the connected instance.
- `deploy` — deploy changes to Node-RED.
- ...and ~40 more tools for creating, modifying, and managing flows, nodes, subflows, and groups.
