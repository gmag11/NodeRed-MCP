/**
 * MCP tool: uninstall-node
 *
 * Uninstalls a Node-RED node module from the running instance via the Admin API's
 * DELETE /nodes/:module endpoint. The module identifier comes from the palette
 * listing (get-palette-nodes). Returns a confirmation object on success.
 */

/**
 * Handle the uninstall-node MCP tool invocation.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {{ module: string }} params
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUninstallNode(client, { module: moduleName }) {
  await client.request('DELETE', `/nodes/${encodeURIComponent(moduleName)}`);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ uninstalled: true, module: moduleName }, null, 2),
      },
    ],
  };
}
