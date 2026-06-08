/**
 * Shared description fragments used across multiple tool definitions.
 *
 * Centralizing these avoids copy-paste drift when the staging model,
 * deploy workflow, or common warnings need updating.
 */

/** Appended to tool descriptions for tools that stage changes locally. */
export const STAGING_WARNING =
  '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.';

/** Used by tools that require an explicit deploy call. */
export const DEPLOY_REQUIRED =
  'Changes are NOT deployed to Node-RED until you call the `deploy` tool.';

// ── MCP Annotation constants ──────────────────────────────────────
// Tool modules import these to include in their definition exports.

export const ANN_READONLY = {
  readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true,
};
export const ANN_MUTATION = {
  readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false,
};
export const ANN_DESTRUCTIVE = {
  readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false,
};
export const ANN_DEPLOY = {
  readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false,
};
export const ANN_INJECT = {
  readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true,
};
export const ANN_READ_DEBUG = {
  readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true,
};
export const ANN_INSTALL = {
  readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true,
};
export const ANN_UNINSTALL = {
  readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true,
};
export const ANN_REFRESH = {
  readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false,
};
