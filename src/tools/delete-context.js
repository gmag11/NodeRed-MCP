/**
 * MCP tool: delete-context
 *
 * Deletes a context variable from a node, flow, or global scope in Node-RED
 * via the Admin API (DELETE /context/{scope}/{id}/{var_name}).
 *
 * Note: In-memory context values are lost when Node-RED restarts anyway,
 * but this tool explicitly removes a key from any configured store.
 */

/**
 * Build the API path for a context DELETE request.
 *
 * @param {string} scope - 'node' | 'flow' | 'global'
 * @param {string|undefined} id - Node or flow UUID (required for node/flow scopes)
 * @param {string} key - The context variable name to delete
 * @returns {string} The API path
 */
export function buildDeleteContextPath(scope, id, key) {
  const base = scope === 'global' ? '/context/global' : `/context/${scope}/${id}`;
  return `${base}/${encodeURIComponent(key)}`;
}

/**
 * Handler for the delete-context MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @param {string} params.scope - 'node' | 'flow' | 'global'
 * @param {string} [params.id] - Node or flow UUID (required for node/flow scopes)
 * @param {string} params.key - Context key to delete
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDeleteContext(client, params) {
  const { scope, id, key } = params;

  // Validate: id is required for node and flow scopes
  if ((scope === 'node' || scope === 'flow') && !id) {
    throw new Error(`id is required for scope "${scope}"`);
  }

  const path = buildDeleteContextPath(scope, id, key);
  await client.request('DELETE', path);

  const result = { scope, key, deleted: true };
  if (id) result.id = id;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
