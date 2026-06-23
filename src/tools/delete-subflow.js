/**
 * MCP tool: delete-subflow
 *
 * Deletes a subflow definition, its internal nodes, and optionally
 * its instances. Returns previousState for undo support.
 * Refuses to delete a locked subflow.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_DESTRUCTIVE } from './constants.js';
import { DeleteSubflowResponseSchema } from '../schemas/responses.js';
/**
 * Collect the full previous state of a subflow before deletion.
 *
 * @param {object[]} flows - All nodes from the flows array
 * @param {string} subflowId - ID of the subflow to collect
 * @returns {{ definition: object|undefined, internalNodes: object[], instances: object[] }}
 * @throws {Error} If subflowId does not match any type: "subflow" node
 */
export function collectSubflowState(flows, subflowId) {
  const definition = flows.find(
    (n) => n.type === 'subflow' && n.id === subflowId,
  );

  if (!definition) {
    throw new Error(`Subflow '${subflowId}' not found. Use get-subflows to list available subflow definitions.`);
  }

  if (definition.locked) {
    throw new Error(`Subflow '${subflowId}' is locked. This subflow is locked (read-only). Use get-subflow-detail to inspect it without modifying.`);
  }

  const internalNodes = flows.filter(
    (n) => n.z === subflowId,
  );

  const instanceType = `subflow:${subflowId}`;
  const instances = flows.filter(
    (n) => n.type === instanceType,
  );

  return { definition, internalNodes, instances };
}

/**
 * Remove a subflow and related nodes from the flows array.
 *
 * @param {object[]} flows - All nodes from the flows array
 * @param {string} subflowId - ID of the subflow to delete
 * @param {boolean} deleteInstances - Whether to also delete instances
 * @returns {{ updatedFlows: object[], previousState: object }}
 * @throws {Error} If subflow not found or is locked
 */
export function applyDeleteSubflow(flows, subflowId, deleteInstances) {
  const previousState = collectSubflowState(flows, subflowId);

  // Build set of IDs to remove
  const idsToRemove = new Set();
  idsToRemove.add(subflowId);

  for (const node of previousState.internalNodes) {
    idsToRemove.add(node.id);
  }

  if (deleteInstances) {
    for (const node of previousState.instances) {
      idsToRemove.add(node.id);
    }
  }

  const updatedFlows = flows.filter((n) => !idsToRemove.has(n.id));

  return { updatedFlows, previousState };
}

/**
 * Handler for the delete-subflow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.subflowId
 * @param {boolean} [params.deleteInstances=true]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDeleteSubflow(staging, client, params) {
  const { subflowId, deleteInstances = true } = params;

  const { previousState } = await staging.applyMutation((rawResponse) => {
    const flows = rawResponse.flows || [];
    return applyDeleteSubflow(flows, subflowId, deleteInstances);
  });

      const data = { subflowId, previousState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const deleteSubflowDefinition = {
  name: 'delete-subflow',
  annotations: ANN_DESTRUCTIVE,
  outputSchema: DeleteSubflowResponseSchema,
  handler: handleDeleteSubflow,
};
