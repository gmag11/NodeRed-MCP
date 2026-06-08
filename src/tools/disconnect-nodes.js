/**
 * MCP tool: disconnect-nodes
 *
 * Removes wires from a node's output ports.
 * Supports three modes:
 *   1. Single: remove one specific wire (outputPort + toNodeId)
 *   2. Clear-port: remove all wires from an output port (clearPort=true, toNodeId omitted)
 *   3. Batch: remove multiple wires via connections array
 * Errors if a wire does not exist.  Refuses to mutate nodes in locked flows.
 */

import { formatSuccess } from './response-utils.js';

/**
 * Apply wire removal in the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response (must contain `flows` array)
 * @param {string} fromNodeId - ID of the source node
 * @param {number} [outputPort=0] - Output port index (0-based) — ignored in batch mode
 * @param {string} [toNodeId] - ID of the target node to disconnect — ignored in batch/clear-port mode
 * @param {boolean} [clearPort=false] - If true and toNodeId is absent, clear all wires from outputPort
 * @param {Array<{ outputPort: number, toNodeId: string }>} [connections] - Batch removal entries
 * @returns {{ updatedFlows: object[], previousWires: string[][], currentWires: string[][] }}
 */
export function applyDisconnect(rawResponse, fromNodeId, outputPort = 0, toNodeId, clearPort = false, connections) {
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

  // Determine mode: batch > clear-port > single
  if (connections) {
    // --- Batch mode ---
    // Validate all wires exist before removing any (atomicity)
    for (const entry of connections) {
      const port = entry.outputPort;
      const portWires = previousWires[port] ?? [];
      if (!portWires.includes(entry.toNodeId)) {
        throw new Error(
          `Wire from '${fromNodeId}'[${port}] to '${entry.toNodeId}' does not exist`,
        );
      }
    }

    // Build new wires — deep copy and remove all target wires
    const newWires = previousWires.map((port) => [...port]);
    for (const entry of connections) {
      const port = entry.outputPort;
      if (newWires[port]) {
        newWires[port] = newWires[port].filter((id) => id !== entry.toNodeId);
      }
    }

    const currentWires = newWires;
    const updatedNode = { ...fromNode, wires: currentWires };
    const updatedFlows = flows.map((n, i) => (i === fromIndex ? updatedNode : n));

    return { updatedFlows, previousWires, currentWires };
  }

  if (clearPort && !toNodeId) {
    // --- Clear-port mode ---
    const newWires = previousWires.map((port, i) => {
      if (i === outputPort) {
        return [];
      }
      return [...port];
    });

    const currentWires = newWires;
    const updatedNode = { ...fromNode, wires: currentWires };
    const updatedFlows = flows.map((n, i) => (i === fromIndex ? updatedNode : n));

    return { updatedFlows, previousWires, currentWires };
  }

  // --- Single-wire mode ---
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
 * @param {string} [params.toNodeId]
 * @param {boolean} [params.clearPort=false]
 * @param {Array<{ outputPort: number, toNodeId: string }>} [params.connections]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleDisconnectNodes(staging, client, params) {
  const { fromNodeId, outputPort = 0, toNodeId, clearPort = false, connections } = params;

  const { previousWires, currentWires } = await staging.applyMutation(
    (rawResponse) => {
      return applyDisconnect(
        rawResponse,
        fromNodeId,
        outputPort,
        toNodeId,
        clearPort,
        connections,
      );
    }
  );

      const data = { fromNodeId, previousWires, currentWires, staging: staging.getStagingSummary() };
    return formatSuccess(data);
}

export const disconnectNodesDefinition = {
  name: 'disconnect-nodes',
  handler: handleDisconnectNodes,
};
