## Context

The Node-RED MCP server loads skill documentation from the filesystem to expose as MCP resources and tools (`list-skills`, `get-skill`). Currently the loader (`src/skills/loader.js`) reads from `.github/skills/`, a GitHub-specific directory that is excluded from npm publications (not in `"files"`). The server also applies a runtime filter (`name.startsWith('nodered-')`) because `.github/skills/` contains non-Node-RED skills (`openspec-*`, `mcp-builder`) that should not be exposed.

This change moves Node-RED skills to `resources/skills/`, a location that ships with the npm package, and removes the now-unnecessary filter.

## Goals / Non-Goals

**Goals:**
- Node-RED skills ship with the npm package so `list-skills` and `get-skill` work for npm installs.
- Remove the `nodered-` prefix filter since `resources/skills/` will contain only Node-RED skills.
- Keep the loader API unchanged — callers don't need to know where skills live.

**Non-Goals:**
- Changing the skill loading mechanism (still filesystem-based).
- Changing MCP resource URIs or tool contracts.
- Moving non-Node-RED skills (`openspec-*`, `mcp-builder`) — they stay in `.github/skills/`.
- Supporting multiple skill directories — one directory, one loader.

## Decisions

### Decision 1: Path resolution — `resources/skills/` relative to project root

**Choice**: `path.join(basePath, 'resources', 'skills')` where `basePath` is the project root (resolved as `path.resolve(__dirname, '..')` from `src/server.js`).

**Rationale**: Consistent with the existing pattern. The `resources/` name follows common conventions for bundled static assets. It avoids coupling to a version-control-specific path (`.github/`).

**Alternatives considered**:
- `package.json` `directories.skills` field — over-engineering for a single consumer.
- Absolute path via env var — adds configuration complexity for no benefit.

### Decision 2: Remove the `nodered-` filter from `src/server.js`

**Choice**: Remove the `.filter(([name]) => name.startsWith('nodered-'))` line. The new directory contains only Node-RED skills by construction.

**Rationale**: When the source directory is dedicated to Node-RED skills, the prefix filter becomes dead code. Removing it simplifies the server and eliminates the risk of silently excluding valid skills added later.

**Alternatives considered**:
- Keep the filter as a safety net — adds code that can never fire if the directory is correctly maintained, which is worse than removing it (dead code misleads future maintainers).

### Decision 3: Non-Node-RED skills stay in `.github/skills/`

**Choice**: Move only `nodered-*` directories. Leave `openspec-*` and `mcp-builder` in `.github/skills/`.

**Rationale**: These skills are development-time tooling for the project itself, not runtime MCP capabilities. They don't need to ship with the npm package.

### Decision 4: Add `resources/skills/` to `package.json` `"files"` field

**Choice**: Append `"resources/skills/"` to the existing `"files"` array.

**Rationale**: Without this, npm won't include the new directory in the published tarball, defeating the purpose of the move.

## Risks / Trade-offs

- **[Risk] Forgotten references to old path** → **Mitigation**: grep the entire codebase for `.github/skills` and `nodered-` in the filter context after changes.
- **[Risk] Existing open changes reference old paths** → **Mitigation**: check `openspec/changes/` and `openspec/specs/` for references; update prose but not archived specs.
- **[Trade-off] Single skills directory** → If future non-Node-RED skills need MCP exposure, they'd go in `resources/skills/` too. Acceptable — the filter removal means all skills in the directory are exposed by default, which is the correct behavior.
