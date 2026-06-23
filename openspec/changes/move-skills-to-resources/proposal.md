## Why

Node-RED skill documentation currently lives under `.github/skills/`, a GitHub-specific directory that is not included in npm publications. This means skills are unavailable when the package is consumed via npm, causing `list-skills` and `get-skill` tools to return empty results despite the code that loads them being present in the published package. Moving them to a publishable location (`resources/skills/`) fixes this gap and eliminates the need for a filtering hack that excludes non-Node-RED skills at runtime.

## What Changes

- Move all `nodered-*` skill directories from `.github/skills/` to `resources/skills/`.
- Update `src/skills/loader.js` to read from `resources/skills/` instead of `.github/skills/`.
- Update `src/server.js` to remove the `name.startsWith('nodered-')` filter, since the new directory contains only Node-RED skills.
- Add `resources/skills/` to the `"files"` array in `package.json` so skills ship with the npm package.
- Update documentation and references to point to the new location.

## Capabilities

### New Capabilities

- `resources-skills`: Skills are bundled with the npm package via the `resources/skills/` directory, making `list-skills` and `get-skill` functional when installed from npm.

### Modified Capabilities

- `skill-resources`: The skill loader changes its source directory from `.github/skills/` to `resources/skills/`. The skill resource URI scheme (`nodered://skills/{name}`) and all tool contracts remain unchanged.

## Impact

- `src/skills/loader.js` — change `skillsDir` path.
- `src/server.js` — remove filter, adjust `projectRoot` resolution if needed.
- `package.json` — add `resources/skills/` to `"files"`.
- `resources/skills/` — new directory, populated with `nodered-*` skill directories.
- `.github/skills/` — retains non-Node-RED skills (`openspec-*`, `mcp-builder`); Node-RED skills are removed (moved).
- No breaking changes to MCP tools or resource URIs.
