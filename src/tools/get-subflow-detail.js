/**
 * MCP tool: get-subflow-detail
 *
 * Returns the full definition of a single subflow including:
 * - The subflow definition node
 * - All internal nodes (with sanitized configs)
 * - All instances placed in flow tabs
 * - A Mermaid diagram of the internal flow
 */

import { getFlowNodes, sanitizeNodeConfig } from './flow-utils.js';
import { buildIR } from '../renderer/ir-builder.js';
import { buildMermaid } from '../renderer/mermaid-builder.js';
import { formatSuccess } from './response-utils.js';

import { ANN_READONLY } from './constants.js';
import { SubflowDetailResponseSchema } from '../schemas/responses.js';
/**
 * Transform the raw /flows response into a detailed subflow view.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @param {string} subflowId - ID of the subflow to inspect
 * @returns {{
 *   definition: object,
 *   internalNodes: object[],
 *   instances: object[],
 *   diagram: string
 * }}
 * @throws {Error} If subflowId does not match any type: "subflow" node
 */
export function transformSubflowDetail(rawResponse, subflowId) {
  const allNodes = rawResponse.flows || [];

  // Find the subflow definition
  const subflow = allNodes.find(
    (n) => n.type === 'subflow' && n.id === subflowId,
  );

  if (!subflow) {
    throw new Error(`Subflow '${subflowId}' not found`);
  }

  // Get internal nodes using the shared flow-utils (validates consistency)
  let internalNodes;
  try {
    internalNodes = getFlowNodes(allNodes, subflowId);
  } catch {
    internalNodes = [];
  }

  // Get all instances (nodes of type "subflow:<subflowId>")
  const instanceType = `subflow:${subflowId}`;
  const instances = allNodes.filter((n) => n.type === instanceType);

  // Generate Mermaid diagram from internal nodes (via shared renderer)
  const ir = buildIR(internalNodes);
  const diagram = buildMermaid(ir);

  // Sanitize internal nodes: metadata + config (like get-flow-nodes does)
  const sanitizedInternals = internalNodes.map((node) => ({
    id: node.id,
    type: node.type,
    name: node.name || '',
    disabled: node.d === true,
    x: node.x,
    y: node.y,
    wires: node.wires || [],
    config: sanitizeNodeConfig(node),
  }));

  // Simplify instances to key fields
  const simplifiedInstances = instances.map((node) => ({
    id: node.id,
    name: node.name || '',
    flowId: node.z || '',
    x: node.x,
    y: node.y,
    wires: node.wires || [],
    env: node.env || [],
  }));

  return {
    definition: subflow,
    internalNodes: sanitizedInternals,
    instances: simplifiedInstances,
    diagram,
  };
}

/**
 * Handler for the get-subflow-detail MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.subflowId
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetSubflowDetail(staging, params) {
  const flows = await staging.getFlows();
  const result = transformSubflowDetail({ flows }, params.subflowId);

  return formatSuccess(result);
}

export const getSubflowDetailDefinition = {
  name: 'get-subflow-detail',
  annotations: ANN_READONLY,
  outputSchema: SubflowDetailResponseSchema,
  handler: handleGetSubflowDetail,
};
