/**
 * MCP tool: update-flow
 *
 * Updates metadata fields (label, disabled, info, env) of an existing Node-RED flow tab.
 * Stages the change locally — call `deploy` to push to Node-RED.
 * Preserves the nodes array unchanged. Refuses to update a locked flow.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_MUTATION } from './constants.js';
import { UpdateFlowResponseSchema } from '../schemas/responses.js';
const ALLOWED_FIELDS = ['label', 'disabled', 'info', 'env'];

/**
 * Apply updates to a flow object, returning the merged result and the original.
 *
 * @param {object} currentFlow - Full flow object
 * @param {object} updates - Fields to update (only label/disabled/info/env honoured)
 * @returns {{ updatedFlow: object, previousState: object }}
 */
export function applyFlowUpdate(currentFlow, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No properties to update. Provide at least one of: label, disabled, info, env.');
  }

  if (currentFlow.locked) {
    throw new Error(`Flow '${currentFlow.id}' is locked. This flow is locked (read-only). Use get-flow-nodes to inspect its nodes without modifying them.`);
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
 * Apply an update-flow mutation to the flows array.
 *
 * Finds the tab by ID, applies updates, replaces it in the array.
 * No HTTP — pure data transformation.
 *
 * @param {object} rawResponse - Wrapper with `flows` array
 * @param {string} flowId - ID of the flow tab to update
 * @param {object} updates - Fields to update
 * @returns {{ updatedFlows: object[], previousState: object, currentState: object }}
 * @throws {Error} If flow not found or locked
 */
export function applyUpdateFlow(rawResponse, flowId, updates) {
  const flows = rawResponse.flows ?? rawResponse;

  const tabIndex = flows.findIndex((n) => n.type === 'tab' && n.id === flowId);
  if (tabIndex === -1) {
    throw new Error(`Flow '${flowId}' not found. Use get-flows to list available flow tabs.`);
  }

  const { updatedFlow, previousState } = applyFlowUpdate(flows[tabIndex], updates);

  const updatedFlows = flows.map((n, i) => (i === tabIndex ? updatedFlow : n));

  return { updatedFlows, previousState, currentState: updatedFlow };
}

/**
 * Handler for the update-flow MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @param {object} params
 * @param {string} params.flowId
 * @param {object} params.updates
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateFlow(staging, params) {
  const { flowId, updates } = params;

  const { previousState, currentState } = await staging.applyMutation((rawResponse) => {
    return applyUpdateFlow(rawResponse, flowId, updates);
  });

      const data = { flowId, previousState, currentState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const updateFlowDefinition = {
  name: 'update-flow',
  annotations: ANN_MUTATION,
  outputSchema: UpdateFlowResponseSchema,
  handler: handleUpdateFlow,
};
