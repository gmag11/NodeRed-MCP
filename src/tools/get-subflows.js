/**
 * MCP tool: get-subflows
 *
 * Returns a summarized list of subflow definitions from the connected
 * Node-RED instance, with enriched metadata for LLM consumption.
 */
import { formatSuccess } from './response-utils.js';


import { ANN_READONLY } from './constants.js';
import { SubflowSummarySchema } from '../schemas/responses.js';
import { z } from 'zod';
/**
 * Transform the raw Node-RED /flows response into an LLM-friendly
 * summary of subflow definitions only.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @returns {Array<{
 *   id: string,
 *   name: string,
 *   info: string,
 *   inputCount: number,
 *   outputCount: number,
 *   internalNodeCount: number,
 *   internalNodeTypes: string[],
 *   instanceCount: number,
 *   instances: Array<{ id: string, name: string, flowId: string }>
 * }>}
 */
export function transformSubflows(rawResponse) {
  const allNodes = rawResponse.flows || [];

  // Identify subflow definitions only
  const subflows = allNodes.filter(
    (node) => node.type === 'subflow',
  );

  if (subflows.length === 0) return [];

  // Build lookup for instance nodes (type: "subflow:<id>")
  const subflowTypeSet = new Set(subflows.map((sf) => sf.id));
  const instancesBySubflow = new Map();
  const childrenBySubflow = new Map();

  for (const sf of subflows) {
    instancesBySubflow.set(sf.id, []);
    childrenBySubflow.set(sf.id, []);
  }

  for (const node of allNodes) {
    // Collect internal nodes (z === subflowId)
    if (node.z && childrenBySubflow.has(node.z)) {
      childrenBySubflow.get(node.z).push(node);
    }
    // Collect instances (type === "subflow:<id>")
    if (node.type && node.type.startsWith('subflow:')) {
      const subflowId = node.type.slice('subflow:'.length);
      if (instancesBySubflow.has(subflowId)) {
        instancesBySubflow.get(subflowId).push(node);
      }
    }
  }

  return subflows.map((sf) => {
    const children = childrenBySubflow.get(sf.id) || [];
    const instances = instancesBySubflow.get(sf.id) || [];
    const uniqueTypes = [...new Set(children.map((n) => n.type))];

    return {
      id: sf.id,
      name: sf.name || '',
      info: sf.info || '',
      inputCount: Array.isArray(sf.in) ? sf.in.length : 0,
      outputCount: Array.isArray(sf.out) ? sf.out.length : 0,
      internalNodeCount: children.length,
      internalNodeTypes: uniqueTypes,
      instanceCount: instances.length,
      instances: instances.map((i) => ({
        id: i.id,
        name: i.name || '',
        flowId: i.z || '',
      })),
    };
  });
}

/**
 * Handler for the get-subflows MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetSubflows(staging) {
  const flows = await staging.getFlows();
  const subflows = transformSubflows({ flows });

  return formatSuccess({ subflows });
}

export const getSubflowsDefinition = {
  name: 'get-subflows',
  annotations: ANN_READONLY,
  outputSchema: z.object({ subflows: z.array(SubflowSummarySchema) }),
  handler: handleGetSubflows,
};
