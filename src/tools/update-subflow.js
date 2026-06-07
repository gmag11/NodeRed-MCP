/**
 * MCP tool: update-subflow
 *
 * Updates metadata fields of an existing subflow definition.
 * Allowed fields: name, info, category, color, icon, in, out.
 * Performs a partial merge — unspecified fields are preserved.
 * Refuses to update a locked subflow.
 */

const ALLOWED_FIELDS = ['name', 'info', 'category', 'color', 'icon', 'in', 'out'];

/**
 * Apply updates to a subflow object, returning the merged result.
 *
 * @param {object} currentSubflow - Full subflow node from GET /flows
 * @param {object} updates - Fields to update (only allowed fields honoured)
 * @returns {{ updatedSubflow: object, previousState: object }}
 * @throws {Error} If no valid updates provided or subflow is locked
 */
export function applySubflowUpdate(currentSubflow, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No properties to update');
  }

  if (currentSubflow.locked) {
    throw new Error(`Subflow '${currentSubflow.id}' is locked`);
  }

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k)),
  );

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid properties to update');
  }

  const updatedSubflow = {
    ...currentSubflow,
    ...filteredUpdates,
  };

  return { updatedSubflow, previousState: currentSubflow };
}

/**
 * Handler for the update-subflow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.subflowId
 * @param {object} params.updates
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateSubflow(staging, client, params) {
  const { subflowId, updates } = params;

  const { previousState, updatedSubflow: currentState } = await staging.applyMutation((rawResponse) => {
    const flows = rawResponse.flows || [];
    const subflowIndex = flows.findIndex(
      (n) => n.type === 'subflow' && n.id === subflowId,
    );
    if (subflowIndex === -1) {
      throw new Error(`Subflow '${subflowId}' not found`);
    }
    const { updatedSubflow, previousState } = applySubflowUpdate(flows[subflowIndex], updates);
    const updatedFlows = [...flows];
    updatedFlows[subflowIndex] = updatedSubflow;
    return { updatedFlows, previousState, updatedSubflow };
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ subflowId, previousState, currentState, staging: staging.getStagingSummary() }, null, 2),
      },
    ],
  };
}
