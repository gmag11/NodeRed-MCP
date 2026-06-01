/**
 * MCP tool: create-flow
 *
 * Creates a new Node-RED flow tab with the given label and optional properties.
 */

/**
 * Assemble the POST /flow request body.
 *
 * @param {string} label
 * @param {boolean|undefined} disabled
 * @param {string|undefined} info
 * @param {Array<{name: string, value: string, type: string}>|undefined} env
 * @returns {object}
 */
export function buildCreateFlowPayload(label, disabled, info, env) {
  return {
    label,
    disabled: disabled ?? false,
    info: info ?? '',
    env: env ?? [],
    nodes: [],
  };
}

/**
 * Handler for the create-flow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.label
 * @param {boolean} [params.disabled]
 * @param {string} [params.info]
 * @param {Array<{name: string, value: string, type: string}>} [params.env]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleCreateFlow(client, params) {
  const payload = buildCreateFlowPayload(
    params.label,
    params.disabled,
    params.info,
    params.env,
  );

  const result = await client.request('POST', '/flow', payload);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ flowId: result.id, currentState: result }, null, 2),
      },
    ],
  };
}
