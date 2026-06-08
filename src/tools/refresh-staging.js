import { ANN_REFRESH } from './constants.js';
import { RefreshStagingResponseSchema } from '../schemas/responses.js';
/**
 * MCP tool: refresh-staging
 *
 * Discards ALL un-deployed staged changes and re-fetches the latest flow
 * state from the Node-RED Admin API (GET /flows).
 *
 * Use this when flows have been modified externally (e.g., via the
 * Node-RED editor UI) and the MCP staging state is out of sync.
 *
 * ⚠️ WARNING: All un-deployed staged edits will be lost. Use
 * get-staging-status first to review what would be discarded.
 */

/**
 * Handler for the refresh-staging MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {() => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleRefreshStaging(staging) {
  return async () => {
    // Capture state before invalidation so we can report what was discarded
    const previousSummary = staging.getStagingSummary();

    // Discard all staged changes and re-fetch from Node-RED
    staging.invalidate();
    await staging.ensureLoaded();

    // Capture state after re-fetch
    const newSummary = staging.getStagingSummary();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              warning:
                'All un-deployed staged changes have been discarded. ' +
                'The staging state now reflects the current Node-RED backend.',
              previousPendingChanges: previousSummary.pendingChanges,
              previousDirtyNodeIds: previousSummary.dirtyNodeIds,
              previousDirtyFlowIds: previousSummary.dirtyFlowIds,
              staging: newSummary,
            },
            null,
            2,
          ),
        },
      ],
    };
  };
}

export const refreshStagingDefinition = {
  name: 'refresh-staging',
  annotations: ANN_REFRESH,
  outputSchema: RefreshStagingResponseSchema,
  handler: handleRefreshStaging,
};
