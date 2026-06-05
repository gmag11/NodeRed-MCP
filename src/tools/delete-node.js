/**
 * MCP tool: delete-node
 *
 * Removes an existing node from a Node-RED flow by nodeId.
 * Node-RED automatically cleans up dangling wire references on deploy.
 * Refuses to delete nodes in locked flows.
 */

/**
 * Apply the delete-node operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} nodeId - ID of the node to remove
 * @returns {{ updatedFlows: object[], previousState: object }}
 */
export function applyDeleteNode(rawResponse, nodeId) {
  const flows = rawResponse.flows ?? rawResponse;

  // Find the node to delete
  const nodeIndex = flows.findIndex((n) => n.id === nodeId);
  if (nodeIndex === -1) {
    throw new Error(`Node '${nodeId}' not found`);
  }

  const node = flows[nodeIndex];

  // Check parent flow lock
  const parentFlowId = node.z;
  if (parentFlowId) {
    const parentFlow = flows.find(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === parentFlowId,
    );
    if (parentFlow?.locked) {
      throw new Error(`Flow '${parentFlowId}' is locked`);
    }
  }

  const previousState = { ...node };
  const updatedFlows = flows.filter((n) => n.id !== nodeId);

  return { updatedFlows, previousState };
}

/**
 * Handler for the delete-node MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.nodeId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
import { withRetry } from './flow-utils.js';

export async function handleDeleteNode(client, params) {
  const { nodeId } = params;

  const { previousState } = await withRetry(client, (rawResponse) => {
    return applyDeleteNode(rawResponse, nodeId);
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ nodeId, previousState }, null, 2),
      },
    ],
  };
}
