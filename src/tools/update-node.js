/**
 * MCP tool: update-node
 *
 * Shallow-merges a `properties` object onto an existing Node-RED node's
 * configuration and deploys the result. Wiring changes are explicitly
 * rejected — agents must use connect-nodes / disconnect-nodes instead.
 * Refuses to mutate nodes in locked flows.
 *
 * Works on any node type: regular flow nodes, subflow instances
 * (type: "subflow:<uuid>"), and subflow definitions (type: "subflow").
 *
 * Credential handling (via normalizeCredentials from flow-utils.js):
 * When updating configuration nodes (e.g. mqtt-broker, http-proxy),
 * credential fields like `username`, `password`, `key`, `token`, etc.
 * must be nested under a `credentials` sub-object to match Node-RED's
 * credential storage model. This module automatically detects and moves
 * credential fields into the `credentials` object.
 *
 * Node-RED strips credential values from GET /flows responses for privacy,
 * so the `credentials` property may be absent from the node. Detection uses
 * a well-known set of credential field names as a fallback.
 *
 * Partial credential updates are supported: only the fields you specify
 * are updated; unspecified credential fields retain their previous values.
 */

import { normalizeCredentials } from './flow-utils.js';

import { formatSuccess } from './response-utils.js';
import { ANN_MUTATION } from './constants.js';
import { UpdateNodeResponseSchema } from '../schemas/responses.js';
/**
 * Apply a property update to a node in the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} nodeId - ID of the node to update
 * @param {object} properties - Properties to shallow-merge onto the node
 * @param {string[]|null} [credentialKeys=null] - Authoritative credential field names from the API, or null to auto-detect
 * @returns {{ updatedFlows: object[], previousState: object, currentState: object }}
 */
export function applyNodeUpdate(rawResponse, nodeId, properties, credentialKeys = null) {
  // Reject wires in properties — wiring is managed by connect/disconnect tools
  if (Object.prototype.hasOwnProperty.call(properties, 'wires')) {
    throw new Error(
      "Cannot set 'wires' via update-node. " +
      "To add a connection: call connect-nodes with { fromNodeId, toNodeId, outputPort }. " +
      "To remove a connection: call disconnect-nodes with { fromNodeId, toNodeId, outputPort }.",
    );
  }

  const flows = rawResponse.flows ?? rawResponse;

  // Find the target node
  const nodeIndex = flows.findIndex((n) => n.id === nodeId);
  if (nodeIndex === -1) {
    throw new Error(`Node '${nodeId}' not found. Use search-nodes with the node name or get-flow-nodes to list nodes in the parent flow.`);
  }

  const node = flows[nodeIndex];

  // Check parent flow lock
  const parentFlowId = node.z;
  if (parentFlowId) {
    const parentFlow = flows.find(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === parentFlowId,
    );
    if (parentFlow?.locked) {
      throw new Error(`Flow '${parentFlowId}' is locked. This flow is locked (read-only). Use get-flow-nodes to inspect its nodes without modifying them.`);
    }
  }

  // Normalize properties: move credential fields under `credentials` and
  // deep-merge with existing credentials to preserve unspecified fields.
  // credentialKeys comes from the Node-RED /credentials/:type/:id API when available.
  const normalizedProperties = normalizeCredentials(properties, node, credentialKeys);

  const previousState = { ...node };
  const currentState = { ...node, ...normalizedProperties };

  const updatedFlows = flows.map((n, i) => (i === nodeIndex ? currentState : n));

  return { updatedFlows, previousState, currentState };
}

/**
 * Handler for the update-node MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.nodeId
 * @param {object} params.properties
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateNode(staging, client, params) {
  const { nodeId, properties } = params;

  // Fetch credential metadata once (outside mutation — just for detection)
  let credentialKeys = null;
  try {
    const initialFlows = await staging.getFlows();
    const initialNode = initialFlows.find((n) => n.id === nodeId);
    if (initialNode) {
      try {
        const credResponse = await client.request('GET', `/credentials/${encodeURIComponent(initialNode.type)}/${encodeURIComponent(nodeId)}`);
        if (credResponse && typeof credResponse === 'object') {
          credentialKeys = Object.keys(credResponse).flatMap((k) => {
            if (k.startsWith('has_')) {
              return [k.slice(4)]; // has_password → password
            }
            return [k];
          });
        }
      } catch {
        // Fall back to heuristic detection
      }
    }
  } catch {
    // Node not found or other error — applyNodeUpdate will handle validation
  }

  const { previousState, currentState } = await staging.applyMutation((rawResponse) => {
    return applyNodeUpdate(rawResponse, nodeId, properties, credentialKeys);
  });

      const data = { nodeId, previousState, currentState, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const updateNodeDefinition = {
  name: 'update-node',
  annotations: ANN_MUTATION,
  outputSchema: UpdateNodeResponseSchema,
  handler: handleUpdateNode,
};
