## Why

Every write operation (create-node, connect-nodes, update-node, etc.) currently performs a full GET/POST cycle to the Node-RED Admin API, deploying the entire flows configuration on each call. This causes three problems: (1) excessive HTTP traffic — building a 10-node flow triggers ~30 HTTP calls and 10 deploys, (2) 409 version_mismatch errors when operations overlap, making concurrency impossible, and (3) unnecessary runtime restarts that disrupt running flows (timers, MQTT connections, etc.) between edits. The Node-RED editor solves this exact problem with a staging workspace + explicit deploy — we should do the same.

## What Changes

- **New in-memory staging layer (StagingStore)**: All write tools mutate a local copy of the flows instead of deploying to Node-RED on each call. All read tools return data from the staging copy (instantaneous, no HTTP).
- **New `deploy` tool**: Sends the staged flows to Node-RED in a single POST /flows call. Supports three deploy types: `full`, `flows` (modified flows), and `nodes` (modified nodes only — least disruptive).
- **New `get-staging-status` tool**: Returns the current staging state — pending change count, dirty node IDs, dirty flow IDs, and deployed/undeployed status. Allows the LLM to inspect what's pending before deploying.
- **Staging summary in write responses**: Every write tool response includes a `staging` object with pending change count and dirty state, giving the LLM immediate context.
- **Dirty tracking**: The staging layer tracks which flows and nodes have been modified, enabling granular `nodes`-type deploy by default.
- **Unification of flow-level operations**: `create-flow`, `update-flow`, and `delete-flow` currently use the individual flow API (`POST /flow`, `PUT /flow/:id`, `DELETE /flow/:id`). These will be refactored to pure `apply*` functions operating on the staging flows array, like all other write tools.
- **Removal of `withRetry`**: The retry-on-409 mechanism is no longer needed during editing since no HTTP calls are made. Conflict detection moves to deploy time.
- **`inject-message` pre-deploy guard**: `inject-message` will check for pending changes and return a clear error if the staging has undeployed changes, guiding the LLM to deploy first.
- **Updated tool descriptions**: All write tool descriptions remove "deploy immediately" language and explain the staging model.
- **Updated MCP skills**: All 5 MCP skills updated to teach the staging → deploy workflow.

## Capabilities

### New Capabilities
- `staging-store`: In-memory staging layer that holds a mutable copy of the flows, tracks dirty state (per-node and per-flow), and provides lazy-load, mutation, deploy, and invalidation APIs
- `tool-deploy`: MCP tool to deploy staged changes to the Node-RED runtime with configurable deploy type (full/flows/nodes)
- `tool-get-staging-status`: MCP tool to query the current staging state — pending changes, dirty nodes, dirty flows

### Modified Capabilities
- `tool-create-node`: Stages locally instead of deploying; response includes staging summary
- `tool-update-node`: Stages locally instead of deploying; response includes staging summary
- `tool-delete-node`: Stages locally instead of deploying; response includes staging summary
- `tool-wire-nodes`: connect-nodes and disconnect-nodes stage locally; response includes staging summary
- `tool-create-flow`: Refactored from individual API to staging mutation; response includes staging summary
- `tool-update-flow`: Refactored from individual API to staging mutation; response includes staging summary
- `tool-delete-flow`: Refactored from individual API to staging mutation; response includes staging summary
- `tool-create-subflow`: Stages locally instead of deploying; response includes staging summary
- `tool-update-subflow`: Stages locally instead of deploying; response includes staging summary
- `tool-delete-subflow`: Stages locally instead of deploying; response includes staging summary
- `tool-create-subflow-instance`: Stages locally instead of deploying; response includes staging summary
- `tool-import-flow`: Stages locally instead of deploying; response includes staging summary
- `tool-add-nodes-to-group`: Stages locally instead of deploying; response includes staging summary
- `tool-remove-nodes-from-group`: Stages locally instead of deploying; response includes staging summary
- `tool-update-group`: Stages locally instead of deploying; response includes staging summary
- `tool-delete-group`: Stages locally instead of deploying; response includes staging summary
- `tool-get-flows`: Reads from staging instead of HTTP
- `tool-get-flow-nodes`: Reads from staging instead of HTTP
- `tool-get-flow-diagram`: Reads from staging instead of HTTP
- `tool-get-config-nodes`: Reads from staging instead of HTTP
- `tool-get-node-detail`: Reads from staging instead of HTTP (credentials still fetched from API)
- `tool-get-subflows`: Reads from staging instead of HTTP
- `tool-get-subflow-detail`: Reads from staging instead of HTTP
- `tool-search-nodes`: Reads from staging instead of HTTP
- `tool-export-flow`: Reads from staging instead of HTTP
- `tool-export-subflow`: Reads from staging instead of HTTP
- `tool-inject-message`: Adds pre-deploy guard — errors if staging has undeployed changes
- `skill-nodered-flow-builder`: Updated workflows to include explicit deploy step and explain staging model
- `skill-nodered-fundamentals`: Updated to introduce staging/deploy concepts
- `skill-nodered-patterns`: Updated patterns to include deploy step after build
- `skill-nodered-subflows`: Updated subflow workflows to include deploy step

## Impact

- **All write tool handlers** (`handle*` functions): Replace `withRetry(client, applyFn)` with `staging.applyMutation(applyFn)`. No HTTP calls during edits.
- **All read tool handlers**: Replace `client.request('GET', '/flows')` with `staging.getFlows()`. Reads are instantaneous from memory.
- **`create-flow.js`, `update-flow.js`, `delete-flow.js`**: Refactored to use pure `apply*` functions on the flows array instead of individual REST endpoints.
- **`flow-utils.js`**: `withRetry` function becomes unused and is removed.
- **`server.js`**: New `deploy` and `get-staging-status` tools registered. Existing tool descriptions updated. StagingStore instance created and passed to handlers.
- **`src/staging-store.js`**: New module.
- **5 MCP skill files** (`.github/skills/nodered-*/SKILL.md`): Updated to reflect staging workflow.
- **No breaking changes to external API**: The MCP tool names and parameter schemas remain the same. Only the deployment semantics change (deferred instead of immediate).
- **No new dependencies**: StagingStore is pure JavaScript, no external libraries needed.
