/**
 * MCP tool: delete-flow
 *
 * Deletes an existing Node-RED flow tab by ID along with all its child nodes.
 * Stages the change locally — call `deploy` to push to Node-RED.
 * Returns the full previous state (including nodes) before deletion.
 * Refuses to delete a locked flow.
 */

import { formatSuccess } from './response-utils.js';

/**
 * Apply a delete-flow mutation to the flows array.
 *
 * Removes the flow tab and all nodes with `z === flowId`.
 * No HTTP — pure data transformation.
 *
 * @param {object} rawResponse - Wrapper with `flows` array
 * @param {string} flowId - ID of the flow tab to delete
 * @returns {{ updatedFlows: object[], previousState: object|null }}
 * @throws {Error} If flow not found, is the last remaining flow, or is locked
 */
export function applyDeleteFlow(rawResponse, flowId) {
  const flows = rawResponse.flows ?? rawResponse;

  const tabIndex = flows.findIndex((n) => n.type === 'tab' && n.id === flowId);
  if (tabIndex === -1) {
    throw new Error(`Flow '${flowId}' not found`);
  }

  const tab = flows[tabIndex];

  if (tab.locked) {
    throw new Error(`Flow '${flowId}' is locked`);
  }

  // Guard: Node-RED requires at least one flow tab to exist
  const tabCount = flows.filter((n) => n.type === 'tab').length;
  if (tabCount <= 1) {
    throw new Error(
      'Cannot delete the last flow — at least one flow tab must exist'
    );
  }

  // Collect all child nodes
  const children = flows.filter((n) => n.z === flowId);
  const removedIds = new Set([flowId, ...children.map((n) => n.id)]);

  const previousState = { tab, nodes: children };
  const updatedFlows = flows.filter((n) => !removedIds.has(n.id));

  return { updatedFlows, previousState };
}

/**
 * Handler for the delete-flow MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @param {object} params
 * @param {string} params.flowId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDeleteFlow(staging, params) {
  const { flowId } = params;

  const { previousState } = await staging.applyMutation((rawResponse) => {
    return applyDeleteFlow(rawResponse, flowId);
  });

      const data = { flowId, previousState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const deleteFlowDefinition = {
  name: 'delete-flow',
  handler: handleDeleteFlow,
};
