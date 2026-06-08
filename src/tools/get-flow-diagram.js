/**
 * MCP tool: get-flow-diagram
 *
 * Returns a Mermaid flowchart (flowchart TD) representing the topology of nodes
 * within a specific Node-RED flow, with filtering and pagination support.
 * Delegates Mermaid generation to the shared renderer module.
 */

import { ANN_READONLY } from './constants.js';
import { FlowDiagramResponseSchema } from '../schemas/responses.js';
import { buildIR } from '../renderer/ir-builder.js';
import { buildMermaid } from '../renderer/mermaid-builder.js';
import {
  getFlowNodes,
  applyFilters,
  paginate,
} from './flow-utils.js';

/**
 * Transform a raw /flows response into a paginated Mermaid diagram for a given flow.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @param {string} flowId - ID of the tab or subflow to diagram
 * @param {object} [options]
 * @param {boolean} [options.disabledOnly]
 * @param {string} [options.nodeType]
 * @param {string} [options.fromNodeId]
 * @param {'downstream'|'upstream'|'both'} [options.direction='both']
 * @param {number} [options.offset=0]
 * @param {number} [options.limit=50]
 * @returns {{ flowId: string, diagram: string, totalCount: number, offset: number, limit: number, hasMore: boolean }}
 * @throws {Error} If flowId not found, or fromNodeId not found in flow
 */
export function transformFlowDiagram(rawResponse, flowId, options = {}) {
  const {
    disabledOnly,
    nodeType,
    fromNodeId,
    direction = 'both',
    offset = 0,
    limit = 50,
  } = options;

  const allNodes = rawResponse.flows || [];

  // Get all nodes belonging to this flow (validates flowId exists)
  const flowNodes = getFlowNodes(allNodes, flowId);

  // Apply filters
  const filtered = applyFilters(flowNodes, { disabledOnly, nodeType, fromNodeId, direction });

  // Paginate
  const page = paginate(filtered, offset, limit);

  // Build IR and delegate Mermaid generation to shared renderer
  const ir = buildIR(page.items);
  const diagram = buildMermaid(ir);

  return {
    flowId,
    diagram,
    totalCount: page.totalCount,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

/**
 * Handler for the get-flow-diagram MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params - Validated input parameters
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetFlowDiagram(staging, params) {
  const flows = await staging.getFlows();
  const result = transformFlowDiagram({ flows }, params.flowId, params);

  return {
    content: [
      {
        type: 'text',
        text: `Mermaid diagram for flow "${result.flowId}" (nodes ${result.offset + 1}–${result.offset + (result.totalCount === 0 ? 0 : Math.min(result.limit, result.totalCount - result.offset))} of ${result.totalCount}${result.hasMore ? ', hasMore: true' : ''}):\n\n\`\`\`mermaid\n${result.diagram}\n\`\`\``,
      },
    ],
    structuredContent: {
      mermaid: result.diagram,
      nodeCount: result.totalCount,
    },
  };
}

export const getFlowDiagramDefinition = {
  name: 'get-flow-diagram',
  annotations: ANN_READONLY,
  outputSchema: FlowDiagramResponseSchema,
  handler: handleGetFlowDiagram,
};
