/**
 * MCP tool: get-flows
 *
 * Returns a summarized list of flows (tabs and subflows) from the connected
 * Node-RED instance, optimized for LLM consumption.
 */

/**
 * Transform the raw Node-RED /flows response into an LLM-friendly summary.
 *
 * @param {object} rawResponse - Response from GET /flows (v2 format: { rev, flows })
 * @returns {Array<{ id: string, label: string, type: string, disabled: boolean, nodeCount: number, nodeTypes: string[] }>}
 */
export function transformFlows(rawResponse) {
  const allNodes = rawResponse.flows || [];

  // Identify flows: tabs and subflows
  const flows = allNodes.filter(
    (node) => node.type === 'tab' || node.type === 'subflow'
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
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetFlows(client) {
  const rawResponse = await client.request('GET', '/flows');
  const flows = transformFlows(rawResponse);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(flows, null, 2),
      },
    ],
  };
}
