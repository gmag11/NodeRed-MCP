/**
 * MCP tool: get-staging-status
 *
 * Returns the current staging state: pending change count, dirty node IDs,
 * dirty flow IDs, and whether the staging is deployed (no pending changes).
 *
 * Use this to inspect what's pending before deciding to deploy or to
 * verify that a deploy was successful.
 */

/**
 * Handler for the get-staging-status MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {() => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleGetStagingStatus(staging) {
  return () => {
    const summary = staging.getStagingSummary();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  };
}
