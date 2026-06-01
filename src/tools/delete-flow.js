/**
 * MCP tool: delete-flow
 *
 * Deletes an existing Node-RED flow tab by ID.
 * Returns the full previous state (including nodes) before deletion.
 * Refuses to delete a locked flow.
 */

/**
 * Handler for the delete-flow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.flowId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDeleteFlow(client, params) {
  const { flowId } = params;

  // Fetch the full flow state before deletion
  let previousState;
  try {
    previousState = await client.request('GET', `/flow/${flowId}`);
  } catch (err) {
    if (err.message.includes('404')) {
      throw new Error(`Flow '${flowId}' not found`);
    }
    throw err;
  }

  // Reject locked flows
  if (previousState.locked) {
    throw new Error(`Flow '${flowId}' is locked`);
  }

  // Delete the flow
  await client.request('DELETE', `/flow/${flowId}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ flowId, previousState }, null, 2),
      },
    ],
  };
}
