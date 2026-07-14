/**
 * Intermediate Representation (IR) Builder
 *
 * Transforms raw Node-RED flows into a normalized intermediate representation
 * that all format builders (SVG, HTML, Mermaid) consume.
 *
 * @module renderer/ir-builder
 */

import { JUNCTION_STYLE } from './colors.js';

/**
 * Resolve the display name for a subflow instance node.
 * If the instance has an explicit name, use it.
 * Otherwise, look up the subflow definition in the flows array.
 *
 * @param {object} node - Raw flow node
 * @param {object[]} flows - Full flows array (unfiltered)
 * @returns {string} Resolved display name
 */
function resolveSubflowInstanceName(node, flows) {
  if (node.name) return node.name;
  if (typeof node.type === 'string' && node.type.startsWith('subflow:')) {
    const defId = node.type.slice('subflow:'.length);
    const def = flows.find((n) => n.type === 'subflow' && n.id === defId);
    if (def && def.name) return def.name;
  }
  return node.type;
}

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
 * @property {boolean} [isJunction] - Whether this is a junction node
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
 * @property {IRNode[]} nodes - All flow nodes (including junctions)
 * @property {IRGroup[]} groups - All group nodes
 * @property {IRLink[]} links - All wire connections (junctions are intermediate hops)
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
    (n) => n.type !== 'group' && n.type !== 'tab'
  );
  const groups = filteredFlows.filter((n) => n.type === 'group');

  // Build node ID set for this flow (includes junctions for bounding box)
  const nodeIdSet = new Set(allFlowNodes.map((n) => n.id));

  // Convert to IR nodes
  const nodes = allFlowNodes.map((n) => {
    const isJunction = n.type === 'junction';
    const numWires = Array.isArray(n.wires) ? n.wires.length : 0;
    return {
      id: n.id,
      type: n.type,
      name: resolveSubflowInstanceName(n, flows),
      x: n.x || 0,
      y: n.y || 0,
      w: isJunction ? JUNCTION_STYLE.radius * 2 : (n.w || DEFAULT_W),
      h: isJunction ? JUNCTION_STYLE.radius * 2 : (n.h || DEFAULT_H),
      inputs: n.inputs ?? 0,
      outputs: n.outputs ?? numWires,
      d: n.d === true,
      dirty: highlightDirty ? dirtyNodeIds.has(n.id) : false,
      z: n.z,
      g: n.g,
      wires: n.wires || [],
      isJunction,
    };
  });

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

  // Build links. Junctions are included in `nodes[]`, so wires that target
  // or originate from a junction are resolved as ordinary direct links —
  // one segment from source to junction, another from junction to its
  // own targets (junction nodes are processed by this same loop).
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
    dirtyNodeIds,
  };
}
