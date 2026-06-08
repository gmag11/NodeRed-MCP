/**
 * MCP tool: update-group
 *
 * Modifies a Node-RED group node's metadata (name, style, position, size).
 * Delegates to update-node's applyNodeUpdate after validating the target
 * is a `type: "group"` node.
 */

import { applyNodeUpdate } from './update-node.js';

import { ANN_MUTATION } from './constants.js';
import { UpdateNodeResponseSchema } from '../schemas/responses.js';
/**
 * Apply a property update to a group node in the flows array.
 * Validates that the target node is `type: "group"` before delegating.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} groupId - ID of the group node to update
 * @param {object} properties - Properties to shallow-merge onto the group node
 * @returns {{ updatedFlows: object[], previousState: object, currentState: object }}
 */
export function applyUpdateGroup(rawResponse, groupId, properties) {
  const flows = rawResponse.flows ?? rawResponse;

  // Validate the target is a group node
  const groupNode = flows.find((n) => n.id === groupId);
  if (!groupNode) {
    throw new Error(`Group '${groupId}' not found`);
  }
  if (groupNode.type !== 'group') {
    throw new Error(`Node '${groupId}' is not a group`);
  }

  // Delegate to update-node's logic
  return applyNodeUpdate(rawResponse, groupId, properties);
}

/**
 * Handler for the update-group MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.groupId
 * @param {object} params.properties
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateGroup(staging, client, params) {
  const { groupId, properties } = params;

  const result = await staging.applyMutation((rawResponse) => {
    return applyUpdateGroup(rawResponse, groupId, properties);
  });

  const responseData = {
    groupId,
    previousState: result.previousState,
    currentState: result.currentState,
    staging: staging.getStagingSummary(),
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(responseData, null, 2),
      },
    ],
    structuredContent: responseData,
  };
}

export const updateGroupDefinition = {
  name: 'update-group',
  annotations: ANN_MUTATION,
  outputSchema: UpdateNodeResponseSchema,
  handler: handleUpdateGroup,
};
