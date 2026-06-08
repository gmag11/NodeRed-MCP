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
