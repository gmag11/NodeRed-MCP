/**
 * MCP tool: update-node
 *
 * Shallow-merges a `properties` object onto an existing Node-RED node's
 * configuration and deploys the result. Wiring changes are explicitly
 * rejected — agents must use connect-nodes / disconnect-nodes instead.
 * Refuses to mutate nodes in locked flows.
 */

/**
 * Apply a property update to a node in the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} nodeId - ID of the node to update
 * @param {object} properties - Properties to shallow-merge onto the node
 * @returns {{ updatedFlows: object[], previousState: object, currentState: object }}
 */
export function applyNodeUpdate(rawResponse, nodeId, properties) {
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
    throw new Error(`Node '${nodeId}' not found`);
  }

  const node = flows[nodeIndex];

  // Check parent flow lock
  const parentFlowId = node.z;
  if (parentFlowId) {
    const parentFlow = flows.find(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === parentFlowId,
    );
    if (parentFlow?.locked) {
      throw new Error(`Flow '${parentFlowId}' is locked`);
    }
  }

  const previousState = { ...node };
  const currentState = { ...node, ...properties };

  const updatedFlows = flows.map((n, i) => (i === nodeIndex ? currentState : n));

  return { updatedFlows, previousState, currentState };
}

/**
 * Handler for the update-node MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.nodeId
 * @param {object} params.properties
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleUpdateNode(client, params) {
  const { nodeId, properties } = params;

  // GET current flows (includes rev for optimistic locking)
  const rawResponse = await client.request('GET', '/flows');
  const { rev } = rawResponse;

  const { updatedFlows, previousState, currentState } = applyNodeUpdate(
    rawResponse,
    nodeId,
    properties,
  );

  // PUT updated flows back with revision token
  await client.putFlows({ rev, flows: updatedFlows }, 'flows');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ nodeId, previousState, currentState }, null, 2),
      },
    ],
  };
}
