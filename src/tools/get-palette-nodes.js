/**
 * MCP tool: get-palette-nodes
 *
 * Returns a paginated list of node sets from the Node-RED palette,
 * exactly as returned by the GET /nodes API.
 */

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/**
 * Apply pagination to an array of node sets.
 *
 * @param {Array<object>} nodes - Array of node set objects from GET /nodes
 * @param {number} offset - 0-based pagination offset (default 0)
 * @param {number} limit - Max items to return (default 50, max 200)
 * @returns {{ offset: number, limit: number, total: number, nodes: Array<object> }}
 */
export function paginateNodes(nodes, offset = 0, limit = DEFAULT_LIMIT) {
  const clampedLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const total = nodes.length;

  const start = offset;
  const slice = start >= total ? [] : nodes.slice(start, start + clampedLimit);

  return {
    offset,
    limit: clampedLimit,
    total,
    nodes: slice,
  };
}

/**
 * Handler for the get-palette-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {number} [params.offset]
 * @param {number} [params.limit]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetPaletteNodes(client, params) {
  const rawResponse = await client.request('GET', '/nodes');
  const result = paginateNodes(
    rawResponse,
    params.offset ?? 0,
    params.limit ?? DEFAULT_LIMIT,
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
