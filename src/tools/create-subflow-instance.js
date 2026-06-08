/**
 * MCP tool: create-subflow-instance
 *
 * Creates a new instance of an existing subflow inside a flow tab.
 * Auto-sizes output wires to match the subflow's output port count.
 * Validates that both the subflow and the target flow exist.
 */

import { randomUUID } from 'crypto';

/**
 * Build a subflow instance node object.
 *
 * @param {string} subflowId - ID of the subflow definition
 * @param {string} flowId - ID of the target flow tab
 * @param {string|undefined} name - Display name for the instance
 * @param {Array<{name: string, value: string, type: string}>|undefined} env - Env vars
 * @param {number} outputCount - Number of output ports (from subflow.out.length)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {object} New instance node
 */
export function buildSubflowInstance(subflowId, flowId, name, env, outputCount, x, y) {
  // Auto-size wires: one empty array per output port
  const wires = Array.from({ length: outputCount }, () => []);

  return {
    id: randomUUID(),
    type: `subflow:${subflowId}`,
    z: flowId,
    name: name || '',
    env: env || [],
    x,
    y,
    wires,
  };
}

/**
 * Apply the create-subflow-instance operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response
 * @param {string} subflowId - ID of the subflow definition
 * @param {string} flowId - ID of the target flow tab
 * @param {string|undefined} name - Display name
 * @param {Array<{name: string, value: string, type: string}>|undefined} env - Env vars
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {{ updatedFlows: object[], currentState: object }}
 * @throws {Error} If subflow or flow does not exist, or flow is locked
 */
export function applyCreateSubflowInstance(rawResponse, subflowId, flowId, name, env, x, y) {
  const flows = rawResponse.flows ?? rawResponse;

  // Validate subflow exists
  const subflow = flows.find(
    (n) => n.type === 'subflow' && n.id === subflowId,
  );
  if (!subflow) {
    throw new Error(`Subflow '${subflowId}' not found`);
  }

  // Validate target flow tab exists
  const targetFlow = flows.find(
    (n) => n.type === 'tab' && n.id === flowId,
  );
  if (!targetFlow) {
    throw new Error(`Flow '${flowId}' not found`);
  }

  // Reject locked flows
  if (targetFlow.locked) {
    throw new Error(`Flow '${flowId}' is locked`);
  }

  const outputCount = Array.isArray(subflow.out) ? subflow.out.length : 0;
  const newNode = buildSubflowInstance(subflowId, flowId, name, env, outputCount, x, y);
  const updatedFlows = [...flows, newNode];

  return { updatedFlows, currentState: newNode };
}

/**
 * Handler for the create-subflow-instance MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.subflowId
 * @param {string} params.flowId
 * @param {string} [params.name]
 * @param {Array<{name: string, value: string, type: string}>} [params.env]
 * @param {number} [params.x=200]
 * @param {number} [params.y=200]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleCreateSubflowInstance(staging, client, params) {
  const { subflowId, flowId, name, env, x = 200, y = 200 } = params;

  const { currentState } = await staging.applyMutation((rawResponse) => {
    return applyCreateSubflowInstance(
      rawResponse,
      subflowId,
      flowId,
      name,
      env,
      x,
      y,
    );
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ nodeId: currentState.id, currentState, staging: staging.getStagingSummary() }, null, 2),
      },
    ],
  };
}

export const createSubflowInstanceDefinition = {
  name: 'create-subflow-instance',
  handler: handleCreateSubflowInstance,
};
