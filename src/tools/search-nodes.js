/**
 * MCP tool: search-nodes
 *
 * Deep-searches all nodes across all flows (or a single flow via flowId) with a
 * single query string. Serializes each node with JSON.stringify and matches
 * against the full string. Supports plain text (case-insensitive substring) and
 * regex modes.
 */
import { formatSuccess } from './response-utils.js';


import { ANN_READONLY } from './constants.js';
import { NodeBasicSchema } from '../schemas/responses.js';
import { z } from 'zod';
/**
 * Search regular nodes across all flows and return enriched results.
 *
 * Only regular nodes (those with a `z` property, excluding tabs and subflow
 * definitions) are searched. Each result includes flow context.
 *
 * @param {object[]} allNodes - Raw nodes from GET /flows
 * @param {object} options
 * @param {string} options.query - The search term
 * @param {boolean} [options.regex=false] - Treat query as a regex pattern
 * @param {string} [options.flowId] - Limit search to nodes in this flow
 * @param {number} [options.limit=50] - Max results to return
 * @returns {{ results: object[], total: number, truncated: boolean }}
 * @throws {Error} If regex is true and the pattern is invalid
 */
export function searchNodes(allNodes, { query, regex = false, flowId, limit = 50 }) {
  // --- Build flow index: flowId → { id, label } for tabs ---
  const flowIndex = new Map();
  for (const node of allNodes) {
    if (node.type === 'tab') {
      flowIndex.set(node.id, { id: node.id, label: node.label || '' });
    }
  }

  // --- Filter to searchable nodes ---
  // Regular nodes have a `z` property; exclude tabs and subflow definitions
  let candidates = allNodes.filter(
    (n) => n.z !== undefined && n.type !== 'tab' && n.type !== 'subflow',
  );

  // Optional flow scoping
  if (flowId) {
    candidates = candidates.filter((n) => n.z === flowId);
  }

  // --- Deep search ---
  const results = [];
  let total = 0;

  for (const node of candidates) {
    const serialized = JSON.stringify(node);

    let matches = false;
    if (regex) {
      // Regex mode: compile and test
      let pattern;
      try {
        pattern = new RegExp(query);
      } catch {
        throw new Error(`Invalid regex pattern: ${query}. Provide a valid JavaScript regular expression, e.g. "debug" for plain text or "/debug\\d+/" for regex.`);
      }
      matches = pattern.test(serialized);
    } else {
      // Plain text mode: case-insensitive substring
      matches = serialized.toLowerCase().includes(query.toLowerCase());
    }

    if (matches) {
      total++;
      if (results.length < limit) {
        const flowInfo = flowIndex.get(node.z);
        results.push({
          flowId: node.z,
          flowLabel: flowInfo ? flowInfo.label : '',
          nodeId: node.id,
          type: node.type,
          name: node.name || '',
          x: node.x,
          y: node.y,
        });
      }
    }
  }

  return {
    results,
    total,
    truncated: total > limit,
  };
}

/**
 * Handler for the search-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleSearchNodes(staging, params) {
  const { query, regex, flowId, limit } = params;

  // Validate query
  if (!query || query.trim() === '') {
    throw new Error('The "query" parameter is required and must be non-empty. Provide a search term to match against node properties (case-insensitive substring).');
  }

  // Fetch all flows
  const allNodes = await staging.getFlows();

  // Validate flowId if provided
  if (flowId) {
    const flowExists = allNodes.some(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === flowId,
    );
    if (!flowExists) {
      throw new Error(`Flow not found: no tab or subflow with id "${flowId}". Use get-flows to list available flow tabs and subflows.`);
    }
  }

  const result = searchNodes(allNodes, { query, regex, flowId, limit });

  return formatSuccess(result);
}

export const searchNodesDefinition = {
  name: 'search-nodes',
  annotations: ANN_READONLY,
  outputSchema: z.array(NodeBasicSchema),
  handler: handleSearchNodes,
};
