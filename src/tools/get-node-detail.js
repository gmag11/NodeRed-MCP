/**
 * MCP tool: get-node-detail
 *
 * Returns the full detail of a single Node-RED node by its ID, including
 * large text fields (func, template, etc.) that are excluded from get-flow-nodes.
 *
 * Also queries the /credentials/:type/:id endpoint to include credential
 * metadata: field names and whether each password-type field is set.
 * Password values are never exposed — only `has_<field>: true/false` is returned.
 */
import { formatSuccess } from './response-utils.js';


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
export async function handleGetNodeDetail(staging, client, params) {
  const flows = await staging.getFlows();
  const node = transformNodeDetail({ flows }, params.nodeId);

  // Fetch credential metadata if the node type may have credentials.
  // The /credentials/:type/:id endpoint returns field names and
  // has_<field>: true/false for password-type fields (never real values).
  let credentialMetadata = null;
  try {
    const credResponse = await client.request(
      'GET',
      `/credentials/${encodeURIComponent(node.type)}/${encodeURIComponent(node.id)}`,
    );
    if (credResponse && typeof credResponse === 'object' && Object.keys(credResponse).length > 0) {
      credentialMetadata = credResponse;
    }
  } catch {
    // Node type has no credentials registered, or editor is disabled.
    // credentialMetadata stays null — the response simply won't include _credentials.
  }

  // Build the result, adding _credentials metadata when available
  const result = credentialMetadata
    ? { ...node, _credentials: credentialMetadata }
    : node;

  return formatSuccess(result);
}

export const getNodeDetailDefinition = {
  name: 'get-node-detail',
  handler: handleGetNodeDetail,
};
