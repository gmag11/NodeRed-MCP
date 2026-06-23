/**
 * MCP tool: create-node
 *
 * Creates a new node of any installed palette type in a specified Node-RED flow.
 * Generates a UUID for the node ID, assembles the node object, appends it to the
 * flows, and deploys. Returns nodeId and currentState.
 *
 * ⚠️ INJECT NODE GOTCHA: The inject node in Node-RED 5.x requires ALL fields
 * (repeat, crontab, once, onceDelay, topic, props) to be explicitly set in
 * `properties`, even if their value is the default empty/false. Omitting any
 * of these fields causes the Node-RED editor to display a red-triangle error
 * on the node, even though the inject works functionally. See
 * nodered-node-reference skill for the complete field set.
 *
 * Credential handling (via normalizeCredentials from flow-utils.js):
 * When creating configuration nodes (e.g. mqtt-broker, http-proxy),
 * credential fields like `username`, `password`, `key`, `token`, etc.
 * are automatically nested under a `credentials` sub-object to match
 * Node-RED's credential storage model.
 */

import { randomUUID } from 'crypto';
import { normalizeCredentials } from './flow-utils.js';

import { formatSuccess } from './response-utils.js';
import { ANN_MUTATION } from './constants.js';
import { CreateNodeResponseSchema } from '../schemas/responses.js';
/**
 * Build a new node object with structural fields set and properties merged in.
 * Strips `id`, `z`, and `wires` from `properties` if the caller accidentally
 * includes them — the tool controls those fields.
 *
 * @param {string} type - Palette node type (e.g. "function", "debug")
 * @param {string} flowId - ID of the flow (tab or subflow) to place the node in
 * @param {object} properties - Optional extra fields to merge onto the node
 * @param {number} x - X position (default 300)
 * @param {number} y - Y position (default 200)
 * @returns {object} New node object
 */
export function buildNewNode(type, flowId, properties, x, y) {
  // Strip structural fields the caller must not override
  const { id: _id, z: _z, wires: _wires, ...safeProperties } = properties;

  // Normalize credentials: move credential fields like username, password,
  // key, token, etc. into a `credentials` sub-object for config nodes.
  // Pass null for node since this is a new node (no existing credentials).
  const normalizedProperties = normalizeCredentials(safeProperties, null);

  // Nodes that have no output ports by default get wires: [].
  // All other nodes default to 1 output port: wires: [[]].
  const zeroOutputTypes = new Set(['debug', 'comment']);
  const defaultWires = zeroOutputTypes.has(type) ? [] : [[]];

  return {
    id: randomUUID(),
    type,
    z: flowId,
    x,
    y,
    wires: defaultWires,
    ...normalizedProperties,
  };
}

/**
 * Apply the create-node operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} type - Palette node type
 * @param {string} flowId - ID of the target flow tab or subflow
 * @param {object} properties - Extra properties to merge onto the node
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {{ updatedFlows: object[], currentState: object }}
 */
export function applyCreateNode(rawResponse, type, flowId, properties, x, y) {
  const flows = rawResponse.flows ?? rawResponse;

  // Verify the target flow exists
  const targetFlow = flows.find(
    (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === flowId,
  );
  if (!targetFlow) {
    throw new Error(`Flow '${flowId}' not found. Use get-flows to list available flow tabs and subflows.`);
  }

  // Reject locked flows
  if (targetFlow.locked) {
    throw new Error(`Flow '${flowId}' is locked. This flow is locked (read-only). Use get-flow-nodes to inspect its nodes without modifying them.`);
  }

  const newNode = buildNewNode(type, flowId, properties, x, y);
  const updatedFlows = [...flows, newNode];

  return { updatedFlows, currentState: newNode };
}

/**
 * Handler for the create-node MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.type
 * @param {string} params.flowId
 * @param {object} [params.properties={}]
 * @param {number} [params.x=300]
 * @param {number} [params.y=200]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleCreateNode(staging, client, params) {
  const { type, flowId, properties = {}, x = 300, y = 200 } = params;

  const { currentState } = await staging.applyMutation((rawResponse) => {
    return applyCreateNode(rawResponse, type, flowId, properties, x, y);
  });

      const data = { nodeId: currentState.id, currentState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const createNodeDefinition = {
  name: 'create-node',
  annotations: ANN_MUTATION,
  outputSchema: CreateNodeResponseSchema,
  handler: handleCreateNode,
};
