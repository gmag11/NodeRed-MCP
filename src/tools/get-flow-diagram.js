/**
 * MCP tool: get-flow-diagram
 *
 * Returns a Mermaid flowchart (flowchart TD) representing the topology of nodes
 * within a specific Node-RED flow, with filtering and pagination support.
 */

import {
  getFlowNodes,
  applyFilters,
  paginate,
} from './flow-utils.js';

/**
 * Escape a string for use as a Mermaid node label.
 * Wraps in quotes and escapes internal quotes.
 *
 * @param {string} label
 * @returns {string}
 */
function escapeMermaidLabel(label) {
  return `"${label.replace(/"/g, '#quot;')}"`;
}

/**
 * Generate a Mermaid flowchart TD string from a list of nodes.
 * Renders group nodes as Mermaid subgraph containers.
 *
 * @param {object[]} nodes - Node-RED node objects (already filtered/paginated)
 * @returns {string} Mermaid diagram string
 */
export function generateMermaidDiagram(nodes) {
  if (nodes.length === 0) {
    return 'flowchart TD\n  %% Empty flow — no nodes to display';
  }

  const lines = ['flowchart TD'];
  const hasDisabled = nodes.some((n) => n.d === true);

  // Separate groups from flow nodes
  const groupNodes = nodes.filter((n) => n.type === 'group');
  const flowNodes = nodes.filter((n) => n.type !== 'group');

  // Build member-to-group lookup
  const memberGroupMap = new Map();
  for (const g of groupNodes) {
    for (const mid of (g.nodes || [])) {
      memberGroupMap.set(mid, g);
    }
  }

  // Identify nodes that are in a group whose group definition is present
  const groupedIds = new Set();
  for (const n of flowNodes) {
    const gNode = memberGroupMap.get(n.id);
    if (gNode) {
      groupedIds.add(n.id);
    }
  }
  const ungroupedIds = new Set(flowNodes.map((n) => n.id).filter((id) => !groupedIds.has(id)));

  const nodeIds = new Set(nodes.map((n) => n.id));

  // ── Render ungrouped nodes at top level ──
  for (const node of flowNodes) {
    if (!ungroupedIds.has(node.id)) continue;
    const label = escapeMermaidLabel(node.name || node.type);
    const classTag = node.d === true ? ':::disabled' : '';
    lines.push(`  ${node.id}[${label}]${classTag}`);
  }

  // ── Render each group as a subgraph ──
  for (const g of groupNodes) {
    const gMembers = (g.nodes || []).filter((mid) => nodeIds.has(mid));
    const gLabel = escapeMermaidLabel(g.name || 'Group');
    lines.push(`  subgraph ${g.id}[${gLabel}]`);
    // Collect style attributes from group style
    const styleAttrs = buildStyleAttrs(g.style);
    if (styleAttrs) {
      lines.push(`  style ${g.id} ${styleAttrs}`);
    }
    for (const mid of gMembers) {
      const member = flowNodes.find((n) => n.id === mid);
      if (!member) continue;
      const mLabel = escapeMermaidLabel(member.name || member.type);
      const mClass = member.d === true ? ':::disabled' : '';
      lines.push(`    ${mid}[${mLabel}]${mClass}`);
    }
    lines.push('  end');
  }

  // ── Edge definitions ──
  for (const node of nodes) {
    if (!node.wires || node.type === 'group') continue;
    const multiOutput = node.wires.length > 1;
    node.wires.forEach((portTargets, portIndex) => {
      for (const targetId of portTargets) {
        if (!nodeIds.has(targetId)) continue;
        const edgeLabel = multiOutput ? `|out${portIndex + 1}|` : '';
        lines.push(`  ${node.id} -->${edgeLabel} ${targetId}`);
      }
    });
  }

  // Class definitions
  if (hasDisabled) {
    lines.push('  classDef disabled stroke-dasharray:5 5,stroke:#999,color:#999');
  }

  return lines.join('\n');
}

/**
 * Build a Mermaid style attribute string from a group's style object.
 * Maps: fill → fill, stroke → stroke, color → color, fill-opacity → fill-opacity
 *
 * @param {object} [style] - Group style object
 * @returns {string|null} Style string like "fill:#ff0,stroke:#000" or null
 */
function buildStyleAttrs(style) {
  if (!style || typeof style !== 'object') return null;
  const parts = [];
  if (style.fill) parts.push(`fill:${style.fill}`);
  if (style.stroke) parts.push(`stroke:${style.stroke}`);
  if (style.color) parts.push(`color:${style.color}`);
  if (style['fill-opacity']) parts.push(`fill-opacity:${style['fill-opacity']}`);
  return parts.length > 0 ? parts.join(',') : null;
}

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

  // Generate Mermaid from the page slice
  const diagram = generateMermaidDiagram(page.items);

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
export async function handleGetFlowDiagram(client, params) {
  const rawResponse = await client.request('GET', '/flows');
  const result = transformFlowDiagram(rawResponse, params.flowId, params);

  return {
    content: [
      {
        type: 'text',
        text: `Mermaid diagram for flow "${result.flowId}" (nodes ${result.offset + 1}–${result.offset + (result.totalCount === 0 ? 0 : Math.min(result.limit, result.totalCount - result.offset))} of ${result.totalCount}${result.hasMore ? ', hasMore: true' : ''}):\n\n\`\`\`mermaid\n${result.diagram}\n\`\`\``,
      },
    ],
  };
}
