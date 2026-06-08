/**
 * MCP tool: get-config-nodes
 *
 * Returns a paginated list of global configuration nodes from the connected
 * Node-RED instance.  Configuration nodes are shared resources (e.g. MQTT
 * brokers, TLS configs) used by flow nodes but not wired on the canvas.
 */

import {
  sanitizeNodeConfig,
  paginate,
} from './flow-utils.js';
import { formatSuccess } from './response-utils.js';

import { ANN_READONLY } from './constants.js';
import { ConfigNodesResponseSchema } from '../schemas/responses.js';
/**
 * Transform a raw /flows response into a paginated list of global config nodes.
 *
 * Config nodes are those that:
 * - Have no `wires` property (unlike flow nodes, config nodes are not wired)
 * - Are not of type `tab` or `subflow`
 *
 * Note: config nodes *may* have a `z` property when defined within a flow tab.
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

  // Config nodes: no wires property (not placed on canvas), and not tab or subflow
  let configNodes = allNodes.filter(
    (n) => !('wires' in n) && n.type !== 'tab' && n.type !== 'subflow'
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
export async function handleGetConfigNodes(staging, params) {
  const flows = await staging.getFlows();
  const result = transformConfigNodes({ flows }, params);

  return formatSuccess(result);
}

export const getConfigNodesDefinition = {
  name: 'get-config-nodes',
  annotations: ANN_READONLY,
  outputSchema: ConfigNodesResponseSchema,
  handler: handleGetConfigNodes,
};
