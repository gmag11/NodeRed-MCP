/**
 * MCP tool: uninstall-node
 *
 * Uninstalls a Node-RED node module from the running instance via the Admin API's
 * DELETE /nodes/:module endpoint. The module identifier comes from the palette
 * listing (get-palette-nodes). Returns a confirmation object on success.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_UNINSTALL } from './constants.js';
import { UninstallNodeResponseSchema } from '../schemas/responses.js';
/**
 * Handle the uninstall-node MCP tool invocation.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {{ module: string }} params
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUninstallNode(client, { module: moduleName }) {
  await client.request('DELETE', `/nodes/${encodeURIComponent(moduleName)}`);
      const data = { uninstalled: true, module: moduleName };
    return formatSuccess(data);
}

export const uninstallNodeDefinition = {
  name: 'uninstall-node',
  annotations: ANN_UNINSTALL,
  outputSchema: UninstallNodeResponseSchema,
  handler: handleUninstallNode,
};
