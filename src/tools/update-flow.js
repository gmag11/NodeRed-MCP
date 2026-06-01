/**
 * MCP tool: update-flow
 *
 * Updates metadata fields (label, disabled, info, env) of an existing Node-RED flow tab.
 * Preserves the nodes array unchanged. Refuses to update a locked flow.
 */

const ALLOWED_FIELDS = ['label', 'disabled', 'info', 'env'];

/**
 * Apply updates to a flow object, returning the merged result and the original.
 *
 * @param {object} currentFlow - Full flow object from GET /flow/:id
 * @param {object} updates - Fields to update (only label/disabled/info/env honoured)
 * @returns {{ updatedFlow: object, previousState: object }}
 */
export function applyFlowUpdate(currentFlow, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No properties to update');
  }

  if (currentFlow.locked) {
    throw new Error(`Flow '${currentFlow.id}' is locked`);
  }

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k)),
  );

  const updatedFlow = {
    ...currentFlow,
    ...filteredUpdates,
  };

  return { updatedFlow, previousState: currentFlow };
}

/**
 * Handler for the update-flow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.flowId
 * @param {object} params.updates
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateFlow(client, params) {
  const { flowId, updates } = params;

  // Fetch current flow state
  let currentFlow;
  try {
    currentFlow = await client.request('GET', `/flow/${flowId}`);
  } catch (err) {
    if (err.message.includes('404')) {
      throw new Error(`Flow '${flowId}' not found`);
    }
    throw err;
  }

  const { updatedFlow, previousState } = applyFlowUpdate(currentFlow, updates);

  // Persist the updated flow
  const currentState = await client.request('PUT', `/flow/${flowId}`, updatedFlow);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ flowId, previousState, currentState }, null, 2),
      },
    ],
  };
}
