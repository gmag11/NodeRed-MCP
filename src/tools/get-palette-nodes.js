/**
 * MCP tool: get-palette-nodes
 *
 * Returns a paginated list of node sets from the Node-RED palette,
 * exactly as returned by the GET /nodes API.
 */

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

/**
 * Apply pagination to an array of node sets.
 *
 * @param {Array<object>} nodes - Array of node set objects from GET /nodes
 * @param {number} page - 1-based page number (default 1)
 * @param {number} pageSize - Items per page (default 50, max 200)
 * @returns {{ page: number, pageSize: number, total: number, totalPages: number, nodes: Array<object> }}
 */
export function paginateNodes(nodes, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const clampedSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const total = nodes.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / clampedSize);

  const start = (page - 1) * clampedSize;
  const slice = start >= total ? [] : nodes.slice(start, start + clampedSize);

  return {
    page,
    pageSize: clampedSize,
    total,
    totalPages,
    nodes: slice,
  };
}

/**
 * Handler for the get-palette-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetPaletteNodes(client, params) {
  const rawResponse = await client.request('GET', '/nodes');
  const result = paginateNodes(
    rawResponse,
    params.page ?? 1,
    params.pageSize ?? DEFAULT_PAGE_SIZE,
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
