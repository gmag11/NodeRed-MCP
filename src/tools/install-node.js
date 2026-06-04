/**
 * MCP tool: install-node
 *
 * Installs a new Node-RED node module from the npm registry via the Admin API's
 * POST /nodes endpoint. Accepts a plain npm package name (no @version qualifiers
 * — the API does not support them via JSON body). Returns the Node Module object
 * with name, version, and the list of installed node types.
 */

/**
 * Handle the install-node MCP tool invocation.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {{ module: string }} params
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleInstallNode(client, { module: moduleName }) {
  const result = await client.request('POST', '/nodes', { module: moduleName });
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
