import { ANN_INJECT } from './constants.js';
import { InjectMessageResponseSchema } from '../schemas/responses.js';
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
    throw new Error('Provide either nodeId or name. Use nodeId to target a specific inject node by UUID, or name with optional flowId to search by label.');
  }

  // If nodeId is given, find directly
  if (nodeId) {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new Error(`Inject node not found: no node with id "${nodeId}". Use search-nodes with type: "inject" to find available inject nodes.`);
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
      `Inject node not found: no inject node named "${name}"${scope}. Use search-nodes with type: "inject" to find available inject nodes by name.`,
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
 * @param {import('../staging-store.js').StagingStore} staging
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @returns {(params: { nodeId?: string, name?: string, flowId?: string }) => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleInjectMessage(staging, client) {
  return async (params) => {
    const { nodeId, name, flowId } = params;

    // Pre-deploy guard: refuse to inject if there are undeployed changes
    if (staging.hasPendingChanges()) {
      const summary = staging.getStagingSummary();
      throw new Error(
        `Cannot inject: there are ${summary.pendingChanges} undeployed change(s). ` +
        `Call \`deploy\` first to push your pending changes to Node-RED. ` +
        `Dirty nodes: ${summary.dirtyNodeIds.join(', ') || 'none'}. ` +
        `Dirty flows: ${summary.dirtyFlowIds.join(', ') || 'none'}.`,
      );
    }

    // Fetch all flows from staging to resolve the inject node
    const allNodes = await staging.getFlows();

    // Resolve the target inject node
    const resolved = resolveInjectNode(allNodes, { nodeId, name, flowId });

    // Call POST /inject/:nodeId
    const result = await client.post(`/inject/${resolved.nodeId}`);

    const responseData = {
      success: true,
      nodeId: resolved.nodeId,
      name: resolved.name,
      message: typeof result === 'string' ? result : 'Injected',
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
  };
}

export const injectMessageDefinition = {
  name: 'inject-message',
  annotations: ANN_INJECT,
  outputSchema: InjectMessageResponseSchema,
  handler: handleInjectMessage,
};
