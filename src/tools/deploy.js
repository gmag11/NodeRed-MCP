/**
 * MCP tool: deploy
 *
 * Sends all staged (undeployed) flow changes to the Node-RED runtime.
 * Supports three deploy types: full, flows, and nodes.
 *
 * By default, deploys only modified nodes (`nodes` deploy) which is the
 * least disruptive — only changed nodes are restarted.
 *
 * After a successful deploy, the staging store syncs with the Node-RED
 * backend to obtain the latest rev and state.
 */

/**
 * Handler for the deploy MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {(params: { deployType?: string }) => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleDeploy(staging) {
  return async (params) => {
    const { deployType = 'nodes' } = params || {};

    // Validate deploy type
    const validTypes = ['full', 'flows', 'nodes'];
    if (!validTypes.includes(deployType)) {
      throw new Error(
        `Invalid deploy type "${deployType}". Use one of: ${validTypes.join(', ')}`,
      );
    }

    const summaryBefore = staging.getStagingSummary();

    if (!staging.hasPendingChanges()) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: 'No pending changes to deploy.',
                staging: summaryBefore,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    try {
      await staging.deploy(deployType);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('version_mismatch') || msg.includes('409')) {
        throw new Error(
          'Deploy failed: version mismatch. The flows have been modified externally ' +
          '(e.g., via the Node-RED editor). Your staged changes have been discarded. ' +
          'Re-run your reads to get the latest state, then re-apply your changes.',
        );
      }
      throw err;
    }

    const summaryAfter = staging.getStagingSummary();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              deployType,
              previousPendingChanges: summaryBefore.pendingChanges,
              staging: summaryAfter,
            },
            null,
            2,
          ),
        },
      ],
    };
  };
}

export const deployDefinition = {
  name: 'deploy',
  handler: handleDeploy,
};
