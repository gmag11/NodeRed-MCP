/**
 * MCP tool: disconnect-nodes
 *
 * Removes a wire from a node's output port to a target node.
 * Errors if the wire does not exist.
 * Refuses to mutate nodes in locked flows.
 */

/**
 * Apply a wire removal in the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} fromNodeId - ID of the source node
 * @param {number} outputPort - Output port index (0-based)
 * @param {string} toNodeId - ID of the target node whose connection to remove
 * @returns {{ updatedFlows: object[], previousWires: string[][], currentWires: string[][] }}
 */
export function applyDisconnect(rawResponse, fromNodeId, outputPort, toNodeId) {
  const flows = rawResponse.flows ?? rawResponse;

  // Find source node
  const fromIndex = flows.findIndex((n) => n.id === fromNodeId);
  if (fromIndex === -1) {
    throw new Error(`Node '${fromNodeId}' not found`);
  }

  const fromNode = flows[fromIndex];

  // Check parent flow lock
  const parentFlowId = fromNode.z;
  if (parentFlowId) {
    const parentFlow = flows.find(
      (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === parentFlowId,
    );
    if (parentFlow?.locked) {
      throw new Error(`Flow '${parentFlowId}' is locked`);
    }
  }

  const previousWires = (fromNode.wires ?? []).map((port) => [...port]);

  // Check the wire actually exists
  const portConnections = previousWires[outputPort];
  if (!portConnections || !portConnections.includes(toNodeId)) {
    throw new Error(
      `Wire from '${fromNodeId}'[${outputPort}] to '${toNodeId}' does not exist`,
    );
  }

  // Build new wires — deep copy and remove the target
  const newWires = previousWires.map((port, i) => {
    if (i === outputPort) {
      return port.filter((id) => id !== toNodeId);
    }
    return [...port];
  });

  const currentWires = newWires;
  const updatedNode = { ...fromNode, wires: currentWires };
  const updatedFlows = flows.map((n, i) => (i === fromIndex ? updatedNode : n));

  return { updatedFlows, previousWires, currentWires };
}

/**
 * Handler for the disconnect-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.fromNodeId
 * @param {number} [params.outputPort=0]
 * @param {string} params.toNodeId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDisconnectNodes(client, params) {
  const { fromNodeId, outputPort = 0, toNodeId } = params;

  const rawResponse = await client.request('GET', '/flows');
  const { rev } = rawResponse;

  const { updatedFlows, previousWires, currentWires } = applyDisconnect(
    rawResponse,
    fromNodeId,
    outputPort,
    toNodeId,
  );

  await client.putFlows({ rev, flows: updatedFlows }, 'flows');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ fromNodeId, outputPort, toNodeId, previousWires, currentWires }, null, 2),
      },
    ],
  };
}
