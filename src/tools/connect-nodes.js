/**
 * MCP tool: connect-nodes
 *
 * Adds a wire from a node's output port to a target node.
 * Idempotent — no-op if the wire already exists.
 * Refuses to wire nodes in locked flows.
 */

/**
 * Apply a wire connection in the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} fromNodeId - ID of the source node
 * @param {number} outputPort - Output port index (0-based)
 * @param {string} toNodeId - ID of the target node
 * @returns {{ updatedFlows: object[], previousWires: string[][], currentWires: string[][] }}
 */
export function applyConnect(rawResponse, fromNodeId, outputPort, toNodeId) {
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

  // Validate target node exists
  const toExists = flows.some((n) => n.id === toNodeId);
  if (!toExists) {
    throw new Error(`Node '${toNodeId}' not found`);
  }

  const previousWires = (fromNode.wires ?? []).map((port) => [...port]);

  // Deep-copy the wires array so we can mutate safely
  const newWires = (fromNode.wires ?? []).map((port) => [...port]);

  // Pad wires array to accommodate the requested output port
  while (newWires.length <= outputPort) {
    newWires.push([]);
  }

  // Add connection idempotently
  if (!newWires[outputPort].includes(toNodeId)) {
    newWires[outputPort].push(toNodeId);
  }

  const currentWires = newWires;
  const updatedNode = { ...fromNode, wires: currentWires };
  const updatedFlows = flows.map((n, i) => (i === fromIndex ? updatedNode : n));

  return { updatedFlows, previousWires, currentWires };
}

/**
 * Handler for the connect-nodes MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.fromNodeId
 * @param {number} [params.outputPort=0]
 * @param {string} params.toNodeId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleConnectNodes(client, params) {
  const { fromNodeId, outputPort = 0, toNodeId } = params;

  const rawResponse = await client.request('GET', '/flows');
  const { rev } = rawResponse;

  const { updatedFlows, previousWires, currentWires } = applyConnect(
    rawResponse,
    fromNodeId,
    outputPort,
    toNodeId,
  );

  // Only deploy if a change was actually made (idempotency guard)
  const alreadyConnected =
    previousWires[outputPort] !== undefined &&
    previousWires[outputPort].includes(toNodeId);

  if (!alreadyConnected) {
    await client.putFlows({ rev, flows: updatedFlows }, 'flows');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ fromNodeId, outputPort, toNodeId, previousWires, currentWires }, null, 2),
      },
    ],
  };
}
