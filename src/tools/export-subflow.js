/**
 * MCP tool: export-subflow
 *
 * Exports a subflow definition, all its internal nodes, and any referenced
 * config nodes as a JSON array string compatible with import-flow.
 */

import { collectReferencedConfigNodes } from './export-flow.js';

/**
 * Collect the subflow definition, its internal nodes, and referenced config nodes.
 *
 * @param {object[]} allNodes - All nodes from GET /flows
 * @param {string} subflowId - ID of the subflow to export
 * @returns {{ subflowNodes: object[], name: string, nodeCount: number }}
 * @throws {Error} If subflowId does not match any type: "subflow" node
 */
export function collectSubflowExport(allNodes, subflowId) {
  // Find the subflow definition
  const subflow = allNodes.find(
    (n) => n.type === 'subflow' && n.id === subflowId,
  );

  if (!subflow) {
    throw new Error(`Subflow '${subflowId}' not found`);
  }

  // Collect internal nodes (z === subflowId, with wires property)
  const internalNodes = allNodes.filter(
    (n) => n.z === subflowId && ('wires' in n),
  );

  // Start with definition + internals
  const subflowNodes = [subflow, ...internalNodes];

  // Collect referenced config nodes
  const configNodes = collectReferencedConfigNodes(allNodes, subflowNodes);

  const allExported = [...subflowNodes, ...configNodes];

  return {
    subflowNodes: allExported,
    name: subflow.name || '',
    nodeCount: allExported.length,
  };
}

/**
 * Handler for the export-subflow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.subflowId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleExportSubflow(client, params) {
  const rawResponse = await client.request('GET', '/flows');
  const allNodes = rawResponse.flows || [];

  const { subflowNodes, name, nodeCount } = collectSubflowExport(allNodes, params.subflowId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          subflowId: params.subflowId,
          name,
          nodeCount,
          json: JSON.stringify(subflowNodes),
        }, null, 2),
      },
    ],
  };
}
