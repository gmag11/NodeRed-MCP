/**
 * MCP tool: add-nodes-to-group
 *
 * Assigns a list of nodes to a Node-RED group. If the group does not
 * exist, it is created with a computed bounding rectangle enclosing all
 * member nodes. Nodes already in another group are automatically
 * reassigned (their previous group membership is removed).
 */

import { randomUUID } from 'crypto';
import { computeBoundingBox } from './flow-utils.js';

/** Default group style, matching Node-RED's defaults. */
const DEFAULT_GROUP_STYLE = {
  label: true,
  fill: '#ffff7f',
  'fill-opacity': '0.5',
  stroke: '#000000',
  'label-position': 'nw',
  color: '#000000',
};

/**
 * Apply the add-nodes-to-group operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} flowId - ID of the flow tab where nodes reside
 * @param {string[]} nodeIds - IDs of nodes to add to the group
 * @param {object} [options]
 * @param {string} [options.groupId] - Existing group ID; if omitted, a new group is created
 * @param {string} [options.groupName] - Name for new groups (ignored if groupId is provided)
 * @param {object} [options.style] - Style overrides for new groups (merged onto defaults)
 * @returns {{ updatedFlows: object[], groupId: string, groupName: string, nodeIds: string[], boundingBox: { x: number, y: number, w: number, h: number }, created: boolean }}
 */
export function applyAddNodesToGroup(rawResponse, flowId, nodeIds, options = {}) {
  const { groupId, groupName, style } = options;
  const flows = rawResponse.flows ?? rawResponse;

  // Validate flow exists and is not locked
  const targetFlow = flows.find(
    (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === flowId,
  );
  if (!targetFlow) {
    throw new Error(`Flow '${flowId}' not found`);
  }
  if (targetFlow.locked) {
    throw new Error(`Flow '${flowId}' is locked`);
  }

  // Resolve all target nodes, validating existence and flow membership
  const nodes = [];
  for (const nid of nodeIds) {
    const node = flows.find((n) => n.id === nid);
    if (!node) {
      throw new Error(`Node '${nid}' not found`);
    }
    if (node.z !== flowId) {
      throw new Error(`All nodes must belong to flow '${flowId}'`);
    }
    nodes.push(node);
  }

  let targetGroupId;
  let created = false;
  let updatedFlows = [...flows];

  if (groupId) {
    // ── Existing group ──────────────────────────────────────
    const groupIndex = updatedFlows.findIndex(
      (n) => n.type === 'group' && n.id === groupId,
    );
    if (groupIndex === -1) {
      throw new Error(`Group '${groupId}' not found`);
    }
    targetGroupId = groupId;
  } else {
    // ── Create new group ─────────────────────────────────────
    targetGroupId = randomUUID();
    created = true;

    const box = computeBoundingBox(nodes, 20);
    const mergedStyle = { ...DEFAULT_GROUP_STYLE, ...style };

    // Default name: use provided name, or first node's name, or "Group"
    const defaultName = groupName || nodes[0]?.name || 'Group';

    const newGroup = {
      id: targetGroupId,
      type: 'group',
      z: flowId,
      name: defaultName,
      style: mergedStyle,
      nodes: [],
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    };

    updatedFlows = [...updatedFlows, newGroup];
  }

  // ── Assign nodes to the group ────────────────────────────
  const groupIndex = updatedFlows.findIndex(
    (n) => n.type === 'group' && n.id === targetGroupId,
  );
  const group = updatedFlows[groupIndex];
  const groupNodes = new Set(group.nodes || []);

  for (const node of nodes) {
    const nodeIndex = updatedFlows.findIndex((n) => n.id === node.id);

    // If node already belongs to a different group, remove it from that group
    if (node.g && node.g !== targetGroupId) {
      const prevGroupIndex = updatedFlows.findIndex(
        (n) => n.type === 'group' && n.id === node.g,
      );
      if (prevGroupIndex !== -1) {
        const prevGroup = updatedFlows[prevGroupIndex];
        updatedFlows[prevGroupIndex] = {
          ...prevGroup,
          nodes: (prevGroup.nodes || []).filter((nid) => nid !== node.id),
        };
      }
    }

    // Set g on the node (idempotent)
    updatedFlows[nodeIndex] = { ...node, g: targetGroupId };

    // Add to group's nodes list (idempotent)
    groupNodes.add(node.id);
  }

  // Update group's nodes array
  updatedFlows[groupIndex] = {
    ...updatedFlows[groupIndex],
    nodes: [...groupNodes],
  };

  // Re-compute bounding box for the final group
  const finalGroup = updatedFlows[groupIndex];
  const allMemberNodes = (finalGroup.nodes || [])
    .map((nid) => updatedFlows.find((n) => n.id === nid))
    .filter(Boolean);
  const boundingBox = computeBoundingBox(allMemberNodes, 20);

  // Update bounding box on the group
  updatedFlows[groupIndex] = {
    ...updatedFlows[groupIndex],
    x: boundingBox.x,
    y: boundingBox.y,
    w: boundingBox.w,
    h: boundingBox.h,
  };

  return {
    updatedFlows,
    groupId: targetGroupId,
    groupName: updatedFlows[groupIndex].name,
    nodeIds: [...groupNodes],
    boundingBox,
    created,
  };
}

/**
 * Handler for the add-nodes-to-group MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.flowId
 * @param {string[]} params.nodeIds
 * @param {string} [params.groupId]
 * @param {string} [params.groupName]
 * @param {object} [params.style]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleAddNodesToGroup(staging, client, params) {
  const { flowId, nodeIds, groupId, groupName, style } = params;

  const result = await staging.applyMutation((rawResponse) => {
    return applyAddNodesToGroup(rawResponse, flowId, nodeIds, {
      groupId,
      groupName,
      style,
    });
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            groupId: result.groupId,
            groupName: result.groupName,
            nodeIds: result.nodeIds,
            boundingBox: result.boundingBox,
            created: result.created,
            staging: staging.getStagingSummary(),
          },
          null,
          2,
        ),
      },
    ],
  };
}

export const addNodesToGroupDefinition = {
  name: 'add-nodes-to-group',
  handler: handleAddNodesToGroup,
};
