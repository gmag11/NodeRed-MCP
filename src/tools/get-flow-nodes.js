/**
 * MCP tool: get-flow-nodes
 *
 * Returns a paginated, filterable list of nodes within a specific Node-RED flow,
 * with metadata and sanitized configuration (large text fields excluded).
 */

import {
  getFlowNodes,
  sanitizeNodeConfig,
  applyFilters,
  paginate,
} from './flow-utils.js';

/**
 * Transform a raw /flows response into a paginated list of nodes for a given flow.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @param {string} flowId - ID of the tab or subflow to inspect
 * @param {object} [options]
 * @param {boolean} [options.disabledOnly] - Return only disabled nodes
 * @param {string} [options.nodeType] - Return only nodes of this type
 * @param {string} [options.fromNodeId] - Filter to connected subgraph from this node ID
 * @param {'downstream'|'upstream'|'both'} [options.direction='both'] - Traversal direction
 * @param {number} [options.offset=0] - Pagination offset
 * @param {number} [options.limit=50] - Pagination limit
 * @returns {{ flowId: string, nodes: object[], totalCount: number, offset: number, limit: number, hasMore: boolean }}
 * @throws {Error} If flowId not found, or fromNodeId not found in flow
 */
export function transformFlowNodes(rawResponse, flowId, options = {}) {
  const {
    disabledOnly,
    nodeType,
    fromNodeId,
    direction = 'both',
    offset = 0,
    limit = 50,
  } = options;

  const allNodes = rawResponse.flows || [];

  // Get all nodes belonging to this flow (validates flowId exists)
  const flowNodes = getFlowNodes(allNodes, flowId);

  // Apply filters (subgraph, disabled, type)
  const filtered = applyFilters(flowNodes, { disabledOnly, nodeType, fromNodeId, direction });

  // Paginate
  const page = paginate(filtered, offset, limit);

  // Shape each node: top-level metadata + sanitized config
  const nodes = page.items.map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name || '',
    disabled: node.d === true,
    x: node.x,
    y: node.y,
    wires: node.wires || [],
    config: sanitizeNodeConfig(node),
  }));

  return {
    flowId,
    nodes,
    totalCount: page.totalCount,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

/**
 * Handler for the get-flow-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetFlowNodes(client, params) {
  const rawResponse = await client.request('GET', '/flows');
  const result = transformFlowNodes(rawResponse, params.flowId, params);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
