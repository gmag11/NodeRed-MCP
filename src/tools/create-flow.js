/**
 * MCP tool: create-flow
 *
 * Creates a new Node-RED flow tab with the given label and optional properties.
 * Stages the change locally — call `deploy` to push to Node-RED.
 */

import { randomUUID } from 'crypto';

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
 * Apply a create-flow mutation to the flows array.
 *
 * Creates a new tab node with the given properties and appends it to the
 * flows array. No HTTP — pure data transformation.
 *
 * @param {object} rawResponse - Wrapper with `flows` array
 * @param {string} label - Display label for the new flow tab
 * @param {boolean} [disabled=false]
 * @param {string} [info='']
 * @param {Array} [env=[]]
 * @returns {{ updatedFlows: object[], currentState: object }}
 */
export function applyCreateFlow(rawResponse, label, disabled = false, info = '', env = []) {
  const flows = rawResponse.flows ?? rawResponse;

  const newTab = {
    id: randomUUID(),
    type: 'tab',
    label,
    disabled,
    info,
    env,
  };

  const updatedFlows = [...flows, newTab];

  return { updatedFlows, currentState: newTab };
}

/**
 * Handler for the create-flow MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @param {object} params
 * @param {string} params.label
 * @param {boolean} [params.disabled]
 * @param {string} [params.info]
 * @param {Array<{name: string, value: string, type: string}>} [params.env]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleCreateFlow(staging, params) {
  const { currentState } = await staging.applyMutation((rawResponse) => {
    return applyCreateFlow(rawResponse, params.label, params.disabled, params.info, params.env);
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ flowId: currentState.id, currentState, staging: staging.getStagingSummary() }, null, 2),
      },
    ],
  };
}

export const createFlowDefinition = {
  name: 'create-flow',
  handler: handleCreateFlow,
};
