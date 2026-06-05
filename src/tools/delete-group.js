/**
 * MCP tool: delete-group
 *
 * Permanently removes a Node-RED group. By default, all member nodes are
 * also deleted. Set `deleteMembers: false` to strip group membership and
 * keep the nodes.
 */

import { withRetry } from './flow-utils.js';
/**
 * Apply the delete-group operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} groupId - ID of the group to delete
 * @param {object} [options]
 * @param {boolean} [options.deleteMembers=true] - Whether to also delete member nodes
 * @returns {{ updatedFlows: object[], previousState: { group: object, members: object[] } }}
 */
export function applyDeleteGroup(rawResponse, groupId, options = {}) {
  const { deleteMembers = true } = options;
  const flows = rawResponse.flows ?? rawResponse;

  // Find the group
  const groupIndex = flows.findIndex(
    (n) => n.type === 'group' && n.id === groupId,
  );
  if (groupIndex === -1) {
    throw new Error(`Group '${groupId}' not found`);
  }

  const group = flows[groupIndex];

  // Check parent flow lock
  if (group.z) {
    const parentFlow = flows.find(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === group.z,
    );
    if (parentFlow?.locked) {
      throw new Error(`Flow '${group.z}' is locked`);
    }
  }

  // Collect member nodes for previousState
  const memberIds = group.nodes || [];
  const members = flows.filter(
    (n) => memberIds.includes(n.id),
  );
  const previousState = {
    group: { ...group },
    members: members.map((m) => ({ ...m })),
  };

  let updatedFlows = [...flows];

  if (deleteMembers && memberIds.length > 0) {
    // Delete all member nodes
    updatedFlows = updatedFlows.filter(
      (n) => !memberIds.includes(n.id),
    );
  } else if (!deleteMembers && memberIds.length > 0) {
    // Strip g from all members, keep the nodes
    updatedFlows = updatedFlows.map((n) => {
      if (memberIds.includes(n.id)) {
        const { g: _g, ...rest } = n;
        return rest;
      }
      return n;
    });
  }

  // Delete the group node itself
  updatedFlows = updatedFlows.filter((n) => n.id !== groupId);

  return { updatedFlows, previousState };
}

/**
 * Handler for the delete-group MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.groupId
 * @param {boolean} [params.deleteMembers=true]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDeleteGroup(client, params) {
  const { groupId, deleteMembers } = params;

  const result = await withRetry(client, (rawResponse) => {
    return applyDeleteGroup(rawResponse, groupId, { deleteMembers });
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            groupId,
            previousState: result.previousState,
          },
          null,
          2,
        ),
      },
    ],
  };
}
