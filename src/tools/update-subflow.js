/**
 * MCP tool: update-subflow
 *
 * Updates metadata fields of an existing subflow DEFINITION (type: "subflow").
 * Allowed fields: name, info, category, color, icon, in, out.
 * Performs a partial merge — unspecified fields are preserved.
 * Refuses to update a locked subflow.
 *
 * IMPORTANT: This tool ONLY edits subflow definitions (templates).
 * To edit a subflow INSTANCE placed on a flow tab (type: "subflow:<uuid>"),
 * use update-node instead.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_MUTATION } from './constants.js';
import { UpdateSubflowResponseSchema } from '../schemas/responses.js';
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
    throw new Error('No properties to update. Provide at least one of: name, info, category, color, icon, in, out.');
  }

  if (currentSubflow.locked) {
    throw new Error(`Subflow '${currentSubflow.id}' is locked. This subflow is locked (read-only). Use get-subflow-detail to inspect it without modifying.`);
  }

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED_FIELDS.includes(k)),
  );

  if (Object.keys(filteredUpdates).length === 0) {
    throw new Error('No valid properties to update. Allowed fields are: name, info, category, color, icon, in, out.');
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

    // Detect type mismatch: subflowId matches a subflow instance, not a definition
    const instanceNode = flows.find(
      (n) => n.type && n.type.startsWith('subflow:') && n.id === subflowId,
    );
    if (instanceNode) {
      throw new Error(
        `Node '${subflowId}' is a subflow instance (type: '${instanceNode.type}'), ` +
        'not a subflow definition. Use update-node to edit subflow instances.',
      );
    }

    const subflowIndex = flows.findIndex(
      (n) => n.type === 'subflow' && n.id === subflowId,
    );
    if (subflowIndex === -1) {
      throw new Error(`Subflow '${subflowId}' not found. Use get-subflows to list available subflow definitions.`);
    }
    const { updatedSubflow, previousState } = applySubflowUpdate(flows[subflowIndex], updates);
    const updatedFlows = [...flows];
    updatedFlows[subflowIndex] = updatedSubflow;
    return { updatedFlows, previousState, updatedSubflow };
  });

      const data = { subflowId, previousState, currentState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const updateSubflowDefinition = {
  name: 'update-subflow',
  annotations: ANN_MUTATION,
  outputSchema: UpdateSubflowResponseSchema,
  handler: handleUpdateSubflow,
};
