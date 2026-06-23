/**
 * MCP tool: get-flows
 *
 * Returns a summarized list of flow tabs from the connected
 * Node-RED instance, optimized for LLM consumption.
 * Use get-subflows for subflow definitions.
 */
import { formatSuccess } from './response-utils.js';


import { ANN_READONLY } from './constants.js';
import { FlowSummarySchema } from '../schemas/responses.js';
import { z } from 'zod';
/**
 * Transform the raw Node-RED /flows response into an LLM-friendly summary.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @returns {Array<{ id: string, label: string, type: string, disabled: boolean, nodeCount: number, nodeTypes: string[] }>}
 */
export function transformFlows(rawResponse) {
  const allNodes = rawResponse.flows || [];

  // Identify flows: tabs only (subflows are handled by get-subflows)
  const flows = allNodes.filter(
    (node) => node.type === 'tab'
  );

  // Group child nodes by their parent flow (z property)
  const childrenByFlow = new Map();
  for (const node of allNodes) {
    if (node.z) {
      if (!childrenByFlow.has(node.z)) {
        childrenByFlow.set(node.z, []);
      }
      childrenByFlow.get(node.z).push(node);
    }
  }

  return flows.map((flow) => {
    const children = childrenByFlow.get(flow.id) || [];
    const uniqueTypes = [...new Set(children.map((n) => n.type))];

    return {
      id: flow.id,
      label: flow.label || flow.name || '',
      type: flow.type,
      disabled: flow.disabled || false,
      locked: flow.locked || false,
      info: flow.info || '',
      nodeCount: children.length,
      nodeTypes: uniqueTypes,
    };
  });
}

/**
 * Handler for the get-flows MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetFlows(staging) {
  const flows = await staging.getFlows();
  const result = transformFlows({ flows });

  return formatSuccess({ flows: result });
}

export const getFlowsDefinition = {
  name: 'get-flows',
  annotations: ANN_READONLY,
  outputSchema: z.object({ flows: z.array(FlowSummarySchema) }),
  handler: handleGetFlows,
};
