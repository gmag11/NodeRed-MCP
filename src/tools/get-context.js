/**
 * MCP tool: get-context
 *
 * Reads a context variable from a node, flow, or global scope in Node-RED
 * via the Admin API. Supports reading a single key or all keys in a scope.
 *
 * Note: In-memory context values are lost when Node-RED restarts.
 */

/**
 * Build the API path for a context GET request.
 *
 * @param {string} scope - 'node' | 'flow' | 'global'
 * @param {string|undefined} id - Node or flow UUID (required for node/flow scopes)
 * @param {string|undefined} key - Optional context key to read
 * @returns {string} The API path (with optional ?key= query string)
 */
export function buildGetContextPath(scope, id, key) {
  const base = scope === 'global' ? '/context/global' : `/context/${scope}/${id}`;
  return key ? `${base}/${encodeURIComponent(key)}` : base;
}

/**
 * Transform the raw Node-RED context API response into the tool result shape.
 *
 * Single-key query: returns { [key]: value }
 * All-keys query:   returns { [key]: value, ... } (the raw object as-is)
 *
 * @param {string|undefined} key - The requested key (if any)
 * @param {unknown} rawResponse - Raw value returned by the Node-RED API
 * @returns {object}
 */
export function transformGetContextResponse(key, rawResponse) {
  if (key) {
    return { [key]: rawResponse ?? null };
  }

  // All-keys query: rawResponse is already an object of key-value pairs
  return rawResponse ?? {};
}

/**
 * Handler for the get-context MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @param {string} params.scope - 'node' | 'flow' | 'global'
 * @param {string} [params.id] - Node or flow UUID (required for node/flow scopes)
 * @param {string} [params.key] - Context key to read (omit to read all keys)
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetContext(client, params) {
  const { scope, id, key } = params;

  // Validate: id is required for node and flow scopes
  if ((scope === 'node' || scope === 'flow') && !id) {
    throw new Error(`id is required for scope "${scope}"`);
  }

  const path = buildGetContextPath(scope, id, key);
  const rawResponse = await client.request('GET', path);
  const result = transformGetContextResponse(key, rawResponse);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
