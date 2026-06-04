/**
 * MCP tool: inject-message
 *
 * Fires an inject node by node ID or by name (optionally scoped to a flow).
 * Uses the Node-RED Admin API POST /inject/:nodeId endpoint.
 */

/**
 * Resolve an inject node from all flows by nodeId or by name (+ optional flowId).
 *
 * @param {object[]} allNodes - All nodes from the GET /flows response
 * @param {object} options
 * @param {string} [options.nodeId] - The node UUID to inject
 * @param {string} [options.name] - The node name to search for
 * @param {string} [options.flowId] - Flow ID to scope the name search
 * @returns {{ nodeId: string, name?: string }} The resolved node
 * @throws {Error} If not found, ambiguous, or no identifier provided
 */
export function resolveInjectNode(allNodes, { nodeId, name, flowId } = {}) {
  // Must have at least one identifier
  if (!nodeId && !name) {
    throw new Error('Provide either nodeId or name');
  }

  // If nodeId is given, find directly
  if (nodeId) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Inject node not found: no node with id "${nodeId}"`);
    }
    return { nodeId: node.id, name: node.name };
  }

  // Resolve by name (+ optional flowId)
  let candidates = allNodes.filter(
    (n) => n.name === name && n.type === 'inject',
  );

  if (flowId) {
    candidates = candidates.filter((n) => n.z === flowId);
  }

  if (candidates.length === 0) {
    const scope = flowId ? ` in flow "${flowId}"` : '';
    throw new Error(
      `Inject node not found: no inject node named "${name}"${scope}`,
    );
  }

  if (candidates.length > 1) {
    const ids = candidates.map((n) => `"${n.id}"`).join(', ');
    throw new Error(
      `Multiple inject nodes named "${name}" found (${ids}). Use nodeId to disambiguate.`,
    );
  }

  return { nodeId: candidates[0].id, name: candidates[0].name };
}

/**
 * Handler for the inject-message MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @returns {(params: { nodeId?: string, name?: string, flowId?: string }) => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleInjectMessage(client) {
  return async (params) => {
    const { nodeId, name, flowId } = params;

    // Fetch all flows to resolve the inject node
    const rawResponse = await client.request('GET', '/flows');
    const allNodes = rawResponse.flows || [];

    // Resolve the target inject node
    const resolved = resolveInjectNode(allNodes, { nodeId, name, flowId });

    // Call POST /inject/:nodeId
    const result = await client.post(`/inject/${resolved.nodeId}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              nodeId: resolved.nodeId,
              name: resolved.name,
              message: typeof result === 'string' ? result : 'Injected',
            },
            null,
            2,
          ),
        },
      ],
    };
  };
}
