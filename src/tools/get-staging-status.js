/**
 * MCP tool: get-staging-status
 *
 * Returns the current staging state: pending change count, dirty node IDs,
 * dirty flow IDs, and whether the staging is deployed (no pending changes).
 *
 * Use this to inspect what's pending before deciding to deploy or to
 * verify that a deploy was successful.
 */
import { formatSuccess } from './response-utils.js';


/**
 * Handler for the get-staging-status MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {() => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleGetStagingStatus(staging) {
  return () => {
    const summary = staging.getStagingSummary();

    return formatSuccess(summary);
  };
}

export const getStagingStatusDefinition = {
  name: 'get-staging-status',
  handler: handleGetStagingStatus,
};
