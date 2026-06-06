/**
 * MCP tool: create-subflow
 *
 * Creates a new empty subflow definition (type: "subflow").
 * The subflow can then be populated with internal nodes using
 * create-node (with flowId = subflowId) and connect-nodes.
 * Ports are defined via update-subflow.
 */

import { randomUUID } from 'crypto';

/**
 * Build a new subflow definition node.
 *
 * @param {string} name - Subflow display name
 * @param {string|undefined} info - Markdown description
 * @param {string|undefined} category - Palette category
 * @param {string|undefined} color - Palette color
 * @param {string|undefined} icon - Palette icon
 * @param {object[]|undefined} inPorts - Input port definitions
 * @param {object[]|undefined} outPorts - Output port definitions
 * @returns {object} New subflow node
 */
export function buildSubflowDefinition(name, info, category, color, icon, inPorts, outPorts) {
  const node = {
    id: randomUUID(),
    type: 'subflow',
    name,
    info: info || '',
    in: inPorts || [],
    out: outPorts || [],
  };

  // Add optional palette metadata only if provided
  if (category) node.category = category;
  if (color) node.color = color;
  if (icon) node.icon = icon;

  return node;
}

/**
 * Apply the create-subflow operation to the flows array.
 *
 * @param {object} rawResponse - Raw GET /flows response
 * @param {string} name - Subflow name
 * @param {string|undefined} info - Description
 * @param {string|undefined} category - Palette category
 * @param {string|undefined} color - Palette color
 * @param {string|undefined} icon - Palette icon
 * @param {object[]|undefined} inPorts - Input port definitions
 * @param {object[]|undefined} outPorts - Output port definitions
 * @returns {{ updatedFlows: object[], currentState: object }}
 */
export function applyCreateSubflow(rawResponse, name, info, category, color, icon, inPorts, outPorts) {
  const flows = rawResponse.flows ?? rawResponse;

  const newNode = buildSubflowDefinition(name, info, category, color, icon, inPorts, outPorts);
  const updatedFlows = [...flows, newNode];

  return { updatedFlows, currentState: newNode };
}

/**
 * Handler for the create-subflow MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.info]
 * @param {string} [params.category]
 * @param {string} [params.color]
 * @param {string} [params.icon]
 * @param {object[]} [params.in]
 * @param {object[]} [params.out]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleCreateSubflow(staging, client, params) {
  const { name, info, category, color, icon } = params;
  const inPorts = params.in;
  const outPorts = params.out;

  const { currentState } = await staging.applyMutation((rawResponse) => {
    return applyCreateSubflow(
      rawResponse, name, info, category, color, icon, inPorts, outPorts,
    );
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ subflowId: currentState.id, currentState, staging: staging.getStagingSummary() }, null, 2),
      },
    ],
  };
}
