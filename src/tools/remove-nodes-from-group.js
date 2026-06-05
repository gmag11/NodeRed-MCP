/**
 * MCP tool: remove-nodes-from-group
 *
 * Detaches nodes from a Node-RED group. Optionally repositions detached
 * nodes outside the group's bounding rectangle. If no specific node IDs
 * are provided, all members are removed.
 */

/**
 * Apply the remove-nodes-from-group operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} groupId - ID of the group to remove nodes from
 * @param {object} [options]
 * @param {string[]} [options.nodeIds] - Specific node IDs to remove; if omitted, all members are removed
 * @param {boolean} [options.reposition=false] - Whether to reposition removed nodes outside group bounds
 * @returns {{ updatedFlows: object[], groupId: string, removedNodeIds: string[], remainingNodeIds: string[], repositionedNodes: Array<{ nodeId: string, x: number, y: number }> }}
 */
export function applyRemoveNodesFromGroup(rawResponse, groupId, options = {}) {
  const { nodeIds, reposition = false } = options;
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

  // Determine which nodes to remove
  const currentMembers = new Set(group.nodes || []);
  const toRemove = nodeIds
    ? nodeIds.filter((nid) => currentMembers.has(nid))
    : [...currentMembers];

  // Track warnings for nodes not in group
  const warnings = [];
  if (nodeIds) {
    const notMembers = nodeIds.filter((nid) => !currentMembers.has(nid));
    for (const nid of notMembers) {
      warnings.push(`Node '${nid}' is not a member of group '${groupId}' — skipped`);
    }
  }

  // Compute reposition target for removed nodes
  const repositionTarget = reposition
    ? { x: (group.x ?? 0) + (group.w ?? 100) + 40, startY: (group.y ?? 0) }
    : null;

  let updatedFlows = [...flows];
  const removedList = [];
  const repositionedList = [];

  for (let i = 0; i < toRemove.length; i++) {
    const nid = toRemove[i];
    const nodeIndex = updatedFlows.findIndex((n) => n.id === nid);
    if (nodeIndex === -1) continue;

    const node = updatedFlows[nodeIndex];

    // Remove g property
    const { g: _g, ...rest } = node;
    const updatedNode = { ...rest };
    if (_g !== undefined) {
      // Only delete if it matched this group
    }

    // Reposition if requested
    if (repositionTarget) {
      updatedNode.x = repositionTarget.x;
      updatedNode.y = repositionTarget.startY + i * 40;
      repositionedList.push({
        nodeId: nid,
        x: updatedNode.x,
        y: updatedNode.y,
      });
    }

    updatedFlows[nodeIndex] = updatedNode;
    removedList.push(nid);
  }

  // Update group's nodes array
  const remainingMembers = (group.nodes || []).filter(
    (nid) => !toRemove.includes(nid),
  );
  updatedFlows[groupIndex] = {
    ...group,
    nodes: remainingMembers,
  };

  return {
    updatedFlows,
    groupId,
    removedNodeIds: removedList,
    remainingNodeIds: remainingMembers,
    repositionedNodes: repositionedList,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Handler for the remove-nodes-from-group MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.groupId
 * @param {string[]} [params.nodeIds]
 * @param {boolean} [params.reposition=false]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleRemoveNodesFromGroup(client, params) {
  const { groupId, nodeIds, reposition } = params;

  const rawResponse = await client.request('GET', '/flows');
  const { rev } = rawResponse;

  const result = applyRemoveNodesFromGroup(rawResponse, groupId, {
    nodeIds,
    reposition,
  });

  await client.putFlows({ rev, flows: result.updatedFlows }, 'flows');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            groupId: result.groupId,
            removedNodeIds: result.removedNodeIds,
            remainingNodeIds: result.remainingNodeIds,
            repositionedNodes: result.repositionedNodes,
            warnings: result.warnings,
          },
          null,
          2,
        ),
      },
    ],
  };
}
