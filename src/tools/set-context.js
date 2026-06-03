/**
 * MCP tool: set-context
 *
 * Writes a context variable to a node, flow, or global scope in Node-RED
 * via the Admin API.
 *
 * Note: In-memory context values are lost when Node-RED restarts.
 */

/**
 * Build the API path for a context PUT request.
 *
 * @param {string} scope - 'node' | 'flow' | 'global'
 * @param {string|undefined} id - Node or flow UUID (required for node/flow scopes)
 * @returns {string} The API path
 */
export function buildSetContextPath(scope, id) {
  return scope === 'global' ? '/context/global' : `/context/${scope}/${id}`;
}

/**
 * Build the request body for a context PUT request.
 *
 * @param {string} key - The context key to write
 * @param {unknown} value - The value to set
 * @returns {object} Body with a single key-value pair
 */
export function buildSetContextBody(key, value) {
  return { [key]: value };
}

/**
 * Handler for the set-context MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @param {string} params.scope - 'node' | 'flow' | 'global'
 * @param {string} [params.id] - Node or flow UUID (required for node/flow scopes)
 * @param {string} params.key - Context key to write
 * @param {unknown} params.value - Value to set (any JSON-serializable value)
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleSetContext(client, params) {
  const { scope, id, key, value } = params;

  // Validate: id is required for node and flow scopes
  if ((scope === 'node' || scope === 'flow') && !id) {
    throw new Error(`id is required for scope "${scope}"`);
  }

  const path = buildSetContextPath(scope, id);
  const body = buildSetContextBody(key, value);
  await client.request('PUT', path, body);

  const result = { scope, key, value, success: true };
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
