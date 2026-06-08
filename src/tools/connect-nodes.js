/**
 * MCP tool: connect-nodes
 *
 * Adds a wire from a node's output port to a target node.
 * Supports single-wire mode (outputPort + toNodeId) and batch mode (connections array).
 * Idempotent — no-op if the wire already exists.
 * Refuses to wire nodes in locked flows.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_MUTATION } from './constants.js';
import { WireChangeResponseSchema } from '../schemas/responses.js';
/**
 * Apply a wire connection in the flows array.
 *
 * In single-wire mode, provide outputPort and toNodeId.
 * In batch mode, provide connections (array of { outputPort, toNodeId });
 * outputPort and toNodeId are ignored when connections is provided.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} fromNodeId - ID of the source node
 * @param {number} [outputPort=0] - Output port index (0-based) — ignored in batch mode
 * @param {string} [toNodeId] - ID of the target node — ignored in batch mode
 * @param {Array<{ outputPort: number, toNodeId: string }>} [connections] - Batch connections
 * @returns {{ updatedFlows: object[], previousWires: string[][], currentWires: string[][] }}
 */
export function applyConnect(rawResponse, fromNodeId, outputPort = 0, toNodeId, connections) {
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

  // Determine entries: batch mode takes precedence
  const entries = connections ?? [{ outputPort, toNodeId }];

  // Validate all target nodes exist BEFORE any mutation (atomicity)
  for (const entry of entries) {
    const targetExists = flows.some((n) => n.id === entry.toNodeId);
    if (!targetExists) {
      throw new Error(`Node '${entry.toNodeId}' not found`);
    }
  }

  const previousWires = (fromNode.wires ?? []).map((port) => [...port]);

  // Deep-copy the wires array so we can mutate safely
  const newWires = (fromNode.wires ?? []).map((port) => [...port]);

  // Apply each connection idempotently
  for (const entry of entries) {
    const port = entry.outputPort;

    // Pad wires array to accommodate the requested output port
    while (newWires.length <= port) {
      newWires.push([]);
    }

    // Add connection idempotently
    if (!newWires[port].includes(entry.toNodeId)) {
      newWires[port].push(entry.toNodeId);
    }
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
 * @param {string} [params.toNodeId]
 * @param {Array<{ outputPort: number, toNodeId: string }>} [params.connections]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleConnectNodes(staging, client, params) {
  const { fromNodeId, outputPort = 0, toNodeId, connections } = params;

  const { previousWires, currentWires } = await staging.applyMutation((rawResponse) => {
    return applyConnect(rawResponse, fromNodeId, outputPort, toNodeId, connections);
  });

      const data = { fromNodeId, previousWires, currentWires, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const connectNodesDefinition = {
  name: 'connect-nodes',
  annotations: ANN_MUTATION,
  outputSchema: WireChangeResponseSchema,
  handler: handleConnectNodes,
};
