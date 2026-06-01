/**
 * MCP tool: get-node-detail
 *
 * Returns the full detail of a single Node-RED node by its ID, including
 * large text fields (func, template, etc.) that are excluded from get-flow-nodes.
 */

/**
 * Find a node by ID in the raw /flows response and return all its fields.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @param {string} nodeId - ID of the node to retrieve
 * @returns {object} The full node object
 * @throws {Error} If no node with the given ID is found
 */
export function transformNodeDetail(rawResponse, nodeId) {
  const allNodes = rawResponse.flows || [];
  const node = allNodes.find((n) => n.id === nodeId);

  if (!node) {
    throw new Error(`Node '${nodeId}' not found`);
  }

  return node;
}

/**
 * Handler for the get-node-detail MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @param {string} params.nodeId - ID of the node to retrieve
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetNodeDetail(client, params) {
  const rawResponse = await client.request('GET', '/flows');
  const result = transformNodeDetail(rawResponse, params.nodeId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
