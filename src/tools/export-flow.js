/**
 * MCP tool: export-flow
 *
 * Returns a Node-RED-compatible JSON export for a single flow (by flowId),
 * all flows, or a selected set of nodes (by nodeIds). The returned JSON
 * string can be passed directly to `import-flow` to duplicate or migrate flows.
 */

/**
 * Collect the tab node and all child nodes belonging to a given flow.
 *
 * @param {object[]} allNodes - All nodes from GET /flows
 * @param {string} flowId - ID of the tab node to collect
 * @returns {object[]} Array containing the tab node and all nodes with z === flowId
 */
export function collectFlowNodes(allNodes, flowId) {
  const tab = allNodes.find((n) => n.id === flowId);
  const children = allNodes.filter((n) => n.z === flowId);
  return tab ? [tab, ...children] : children;
}

/**
 * Collect config nodes (nodes with no `z` property) that are referenced by
 * any string property of the provided flow nodes.
 *
 * @param {object[]} allNodes - All nodes from GET /flows
 * @param {object[]} flowNodes - The already-collected flow nodes to scan
 * @returns {object[]} Array of config nodes referenced by the flow nodes
 */
export function collectReferencedConfigNodes(allNodes, flowNodes) {
  // Build a map of config node IDs (nodes with no `z` and not a tab/subflow)
  const configNodeMap = new Map();
  for (const node of allNodes) {
    if (node.z === undefined && node.type !== 'tab' && node.type !== 'subflow') {
      configNodeMap.set(node.id, node);
    }
  }

  if (configNodeMap.size === 0) return [];

  // Collect all string property values from flow nodes (excluding top-level metadata)
  const metadataKeys = new Set(['id', 'type', 'z', 'x', 'y', 'wires', 'd', 'g', 'l', 'info', 'disabled', 'locked', 'name', 'label']);
  const referenced = new Set();

  for (const node of flowNodes) {
    for (const [key, value] of Object.entries(node)) {
      if (metadataKeys.has(key)) continue;
      if (typeof value === 'string' && configNodeMap.has(value)) {
        referenced.add(value);
      }
    }
  }

  return Array.from(referenced).map((id) => configNodeMap.get(id));
}

/**
 * Collect nodes from allNodes whose IDs are in the given nodeIds array.
 *
 * @param {object[]} allNodes - All nodes from GET /flows
 * @param {string[]} nodeIds - IDs of nodes to select
 * @returns {object[]} Array of matching nodes (order follows nodeIds)
 */
export function collectSelectedNodes(allNodes, nodeIds) {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  return nodeIds.flatMap((id) => (nodeMap.has(id) ? [nodeMap.get(id)] : []));
}

/**
 * Trim wires in a node array so that only targets within allowedIds are kept.
 * Ports with no remaining targets become `[]`.
 *
 * @param {object[]} nodes - Nodes to process (NOT mutated; returns new array)
 * @param {Set<string>} allowedIds - Set of node IDs that are in the selection
 * @returns {object[]} New array of nodes with trimmed wires
 */
export function trimWires(nodes, allowedIds) {
  return nodes.map((node) => {
    if (!Array.isArray(node.wires)) return node;
    const trimmedWires = node.wires.map((port) =>
      Array.isArray(port) ? port.filter((targetId) => allowedIds.has(targetId)) : []
    );
    return { ...node, wires: trimmedWires };
  });
}

/**
 * Handler for the export-flow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @param {'flow'|'nodes'} [params.exportMode='flow'] - Export mode
 * @param {string} [params.flowId] - Tab ID for flow mode
 * @param {string[]} [params.nodeIds] - Node IDs for nodes mode
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleExportFlowJson(client, params) {
  const { exportMode = 'flow', flowId, nodeIds } = params;

  const rawResponse = await client.request('GET', '/flows');
  const allNodes = rawResponse.flows || [];

  let result;

  if (exportMode === 'nodes') {
    // nodes mode: requires a non-empty nodeIds array
    if (!nodeIds || nodeIds.length === 0) {
      throw new Error('exportMode "nodes" requires a non-empty nodeIds array');
    }

    const selectedNodes = collectSelectedNodes(allNodes, nodeIds);
    const allowedIds = new Set(nodeIds);
    const trimmedNodes = trimWires(selectedNodes, allowedIds);

    result = {
      exportMode: 'nodes',
      nodeCount: trimmedNodes.length,
      json: JSON.stringify(trimmedNodes),
    };
  } else {
    // flow mode
    if (flowId) {
      // Single flow export
      const tabNode = allNodes.find((n) => n.id === flowId && n.type === 'tab');
      if (!tabNode) {
        throw new Error(`Flow '${flowId}' not found`);
      }

      const flowNodes = collectFlowNodes(allNodes, flowId);
      const configNodes = collectReferencedConfigNodes(allNodes, flowNodes);
      const exportNodes = [...flowNodes, ...configNodes];

      result = {
        exportMode: 'flow',
        flowId,
        label: tabNode.label || '',
        nodeCount: exportNodes.length,
        json: JSON.stringify(exportNodes),
      };
    } else {
      // All flows export
      result = {
        exportMode: 'flow',
        nodeCount: allNodes.length,
        json: JSON.stringify(allNodes),
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
