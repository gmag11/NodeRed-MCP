/**
 * Intermediate Representation (IR) Builder
 *
 * Transforms raw Node-RED flows into a normalized intermediate representation
 * that all format builders (SVG, HTML, Mermaid) consume.
 *
 * @module renderer/ir-builder
 */

/**
 * @typedef {object} IRNode
 * @property {string} id - Node ID
 * @property {string} type - Node type (e.g., 'inject', 'function')
 * @property {string} [name] - Node display name
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} w - Node width
 * @property {number} h - Node height
 * @property {number} [inputs] - Number of input ports
 * @property {number} [outputs] - Number of output ports
 * @property {boolean} [d] - Whether node is disabled
 * @property {boolean} [dirty] - Whether node has un-deployed changes
 * @property {string} [z] - Parent flow ID
 * @property {string} [g] - Parent group ID
 * @property {object[]} [wires] - Outgoing wire connections
 */

/**
 * @typedef {object} IRLink
 * @property {IRNode} source - Source node
 * @property {number} sourcePort - Source output port index
 * @property {IRNode} target - Target node
 */

/**
 * @typedef {object} IRGroup
 * @property {string} id - Group ID
 * @property {string} [name] - Group label
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} w - Width
 * @property {number} h - Height
 * @property {object} [style] - Group style (fill, stroke, color, etc.)
 * @property {string[]} nodes - Member node IDs
 */

/**
 * @typedef {object} IR
 * @property {IRNode[]} nodes - All flow nodes
 * @property {IRGroup[]} groups - All group nodes
 * @property {IRLink[]} links - All wire connections
 * @property {Set<string>} dirtyNodeIds - IDs of dirty (un-deployed) nodes
 */

/**
 * Default node dimensions if not specified.
 */
const DEFAULT_W = 100;
const DEFAULT_H = 30;

/**
 * Build the intermediate representation from raw flows data.
 *
 * @param {object[]} flows - Raw Node-RED flows array
 * @param {object} options
 * @param {string} [options.flowId] - Filter to a single flow
 * @param {boolean} [options.highlightDirty=true] - Mark dirty nodes
 * @param {Set<string>} [options.dirtyNodeIds] - Dirty node IDs
 * @param {Set<string>} [options.dirtyFlowIds] - Dirty flow IDs
 * @returns {IR}
 * @throws {Error} If flowId is provided but not found
 */
export function buildIR(flows, options = {}) {
  const {
    flowId,
    highlightDirty = true,
    dirtyNodeIds = new Set(),
  } = options;

  let filteredFlows = flows;

  // Filter by flow if requested
  if (flowId) {
    filteredFlows = flows.filter(
      (n) => n.z === flowId || n.id === flowId
    );
    if (filteredFlows.length === 0 && !flows.some((n) => n.id === flowId)) {
      throw new Error(`Flow not found: ${flowId}`);
    }
  }

  // Separate nodes, groups, and junctions
  const allFlowNodes = filteredFlows.filter(
    (n) => n.type !== 'group' && n.type !== 'tab' && n.type !== 'junction'
  );
  const groups = filteredFlows.filter((n) => n.type === 'group');
  const junctions = filteredFlows.filter((n) => n.type === 'junction');

  // Build node ID set for this flow
  const nodeIdSet = new Set(allFlowNodes.map((n) => n.id));

  // Convert to IR nodes
  const nodes = allFlowNodes.map((n) => ({
    id: n.id,
    type: n.type,
    name: n.name || n.type,
    x: n.x || 0,
    y: n.y || 0,
    w: n.w || DEFAULT_W,
    h: n.h || DEFAULT_H,
    inputs: n.inputs ?? 0,
    outputs: n.outputs ?? 0,
    d: n.d === true,
    dirty: highlightDirty ? dirtyNodeIds.has(n.id) : false,
    z: n.z,
    g: n.g,
    wires: n.wires || [],
  }));

  // Convert groups
  const irGroups = groups.map((g) => ({
    id: g.id,
    name: g.name || 'Group',
    x: g.x || 0,
    y: g.y || 0,
    w: g.w || 40,
    h: g.h || 40,
    style: g.style || {},
    nodes: (g.nodes || []).filter((mid) => nodeIdSet.has(mid)),
  }));

  // Build links
  const links = [];
  for (const node of nodes) {
    if (!node.wires || node.wires.length === 0) continue;
    node.wires.forEach((targets, portIndex) => {
      if (!Array.isArray(targets)) return;
      for (const targetId of targets) {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode) {
          links.push({
            source: node,
            sourcePort: portIndex,
            target: targetNode,
          });
        }
      }
    });
  }

  return {
    nodes,
    groups: irGroups,
    links,
    junctions,
    dirtyNodeIds,
  };
}
