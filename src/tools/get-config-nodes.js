/**
 * MCP tool: get-config-nodes
 *
 * Returns a paginated list of global configuration nodes (nodes without a `z`
 * property) from the connected Node-RED instance.
 */

import {
  sanitizeNodeConfig,
  paginate,
} from './flow-utils.js';

/**
 * Transform a raw /flows response into a paginated list of global config nodes.
 *
 * Config nodes are those that:
 * - Have no `z` property (not bound to a tab or subflow)
 * - Are not of type `tab` or `subflow`
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @param {object} [options]
 * @param {string} [options.nodeType] - Return only config nodes of this type
 * @param {number} [options.offset=0] - Pagination offset
 * @param {number} [options.limit=50] - Pagination limit
 * @returns {{ nodes: object[], totalCount: number, offset: number, limit: number, hasMore: boolean }}
 */
export function transformConfigNodes(rawResponse, options = {}) {
  const { nodeType, offset = 0, limit = 50 } = options;
  const allNodes = rawResponse.flows || [];

  // Config nodes: no z property, and not tab or subflow
  let configNodes = allNodes.filter(
    (n) => !n.z && n.type !== 'tab' && n.type !== 'subflow'
  );

  // Optional type filter
  if (nodeType) {
    configNodes = configNodes.filter((n) => n.type === nodeType);
  }

  // Paginate
  const page = paginate(configNodes, offset, limit);

  // Shape each node
  const nodes = page.items.map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name || '',
    config: sanitizeNodeConfig(node),
  }));

  return {
    nodes,
    totalCount: page.totalCount,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

/**
 * Handler for the get-config-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetConfigNodes(client, params) {
  const rawResponse = await client.request('GET', '/flows');
  const result = transformConfigNodes(rawResponse, params);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
