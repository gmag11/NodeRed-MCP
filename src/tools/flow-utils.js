/**
 * Shared utilities for Node-RED flow inspection tools.
 *
 * Used by: get-flow-nodes, get-flow-diagram, get-config-nodes
 */

/**
 * Node configuration fields that are excluded from responses to avoid
 * wasting LLM context tokens on large text blobs.
 *
 * @type {Set<string>}
 */
export const BLOCKLISTED_FIELDS = new Set([
  'func',       // function node: JavaScript code
  'template',   // template node: Mustache/HTML template
  'format',     // various nodes: formatted text content
  'html',       // html node: HTML content
  'css',        // ui nodes: CSS styles
]);

/**
 * Top-level metadata fields extracted separately; excluded from the config object.
 *
 * @type {Set<string>}
 */
const METADATA_FIELDS = new Set(['id', 'type', 'z', 'x', 'y', 'wires', 'd', 'name', 'g']);

/**
 * Return a sanitized copy of a node's configuration fields,
 * excluding blocklisted large-text fields and top-level metadata fields.
 *
 * @param {object} node - Raw Node-RED node object
 * @returns {object} Sanitized config object (may be empty)
 */
export function sanitizeNodeConfig(node) {
  const config = {};
  for (const [key, value] of Object.entries(node)) {
    if (!METADATA_FIELDS.has(key) && !BLOCKLISTED_FIELDS.has(key)) {
      config[key] = value;
    }
  }
  return config;
}

/**
 * Extract nodes belonging to a specific flow (tab or subflow).
 * Throws if the flowId does not match any known tab or subflow.
 *
 * @param {object[]} allNodes - All nodes from the /flows response
 * @param {string} flowId - Target flow ID
 * @returns {object[]} Nodes whose `z` property equals `flowId`
 * @throws {Error} If no tab or subflow with flowId exists
 */
export function getFlowNodes(allNodes, flowId) {
  const flowExists = allNodes.some(
    (n) => (n.type === 'tab' || n.type === 'subflow') && n.id === flowId
  );

  if (!flowExists) {
    throw new Error(`Flow not found: no tab or subflow with id "${flowId}"`);
  }

  return allNodes.filter((n) => n.z === flowId);
}

/**
 * Build a reverse wire index: for each target node ID, the set of source node IDs
 * that have a wire pointing to it.
 *
 * @param {object[]} nodes - Array of Node-RED node objects
 * @returns {Map<string, Set<string>>} targetId → Set of sourceIds
 */
export function buildReverseWireIndex(nodes) {
  const reverseIndex = new Map();

  for (const node of nodes) {
    if (!node.wires) continue;
    for (const portTargets of node.wires) {
      for (const targetId of portTargets) {
        if (!reverseIndex.has(targetId)) {
          reverseIndex.set(targetId, new Set());
        }
        reverseIndex.get(targetId).add(node.id);
      }
    }
  }

  return reverseIndex;
}

/**
 * Build a forward wire index: for each source node ID, the set of target node IDs
 * it connects to across all output ports.
 *
 * @param {object[]} nodes - Array of Node-RED node objects
 * @returns {Map<string, Set<string>>} sourceId → Set of targetIds
 */
export function buildForwardWireIndex(nodes) {
  const forwardIndex = new Map();

  for (const node of nodes) {
    if (!node.wires) continue;
    const targets = new Set();
    for (const portTargets of node.wires) {
      for (const targetId of portTargets) {
        targets.add(targetId);
      }
    }
    if (targets.size > 0) {
      forwardIndex.set(node.id, targets);
    }
  }

  return forwardIndex;
}

/**
 * Get the set of node IDs reachable from `fromNodeId` via BFS in the given direction.
 *
 * @param {object[]} nodes - Nodes to search within (already filtered to a flow)
 * @param {string} fromNodeId - Starting node ID
 * @param {'downstream'|'upstream'|'both'} direction - Traversal direction
 * @param {Map<string, Set<string>>} reverseIndex - Reverse wire index (target → sources)
 * @returns {Set<string>} Set of reachable node IDs (including fromNodeId itself)
 * @throws {Error} If fromNodeId is not found among the nodes
 */
export function getConnectedSubgraph(nodes, fromNodeId, direction, reverseIndex) {
  const nodeIds = new Set(nodes.map((n) => n.id));

  if (!nodeIds.has(fromNodeId)) {
    throw new Error(`Node not found in flow: no node with id "${fromNodeId}"`);
  }

  const forwardIndex = buildForwardWireIndex(nodes);
  const visited = new Set();
  const queue = [fromNodeId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    // Traverse downstream (forward wires)
    if (direction === 'downstream' || direction === 'both') {
      const targets = forwardIndex.get(current) || new Set();
      for (const targetId of targets) {
        if (!visited.has(targetId) && nodeIds.has(targetId)) {
          queue.push(targetId);
        }
      }
    }

    // Traverse upstream (reverse wires)
    if (direction === 'upstream' || direction === 'both') {
      const sources = reverseIndex.get(current) || new Set();
      for (const sourceId of sources) {
        if (!visited.has(sourceId) && nodeIds.has(sourceId)) {
          queue.push(sourceId);
        }
      }
    }
  }

  return visited;
}

/**
 * Apply the chain of filters to a node list:
 * 1. Subgraph filter (fromNodeId + direction)
 * 2. Disabled-only filter
 * 3. Node type filter
 *
 * @param {object[]} nodes - Nodes to filter
 * @param {object} options
 * @param {string} [options.fromNodeId] - Filter to connected subgraph from this node ID
 * @param {'downstream'|'upstream'|'both'} [options.direction='both'] - Traversal direction
 * @param {boolean} [options.disabledOnly] - Return only disabled nodes
 * @param {string} [options.nodeType] - Return only nodes of this type
 * @returns {object[]} Filtered nodes
 * @throws {Error} If fromNodeId is specified but not found
 */
export function applyFilters(nodes, { fromNodeId, direction = 'both', disabledOnly, nodeType } = {}) {
  let filtered = nodes;

  // 1. Subgraph filter
  if (fromNodeId) {
    const reverseIndex = buildReverseWireIndex(nodes);
    const reachable = getConnectedSubgraph(nodes, fromNodeId, direction, reverseIndex);
    filtered = filtered.filter((n) => reachable.has(n.id));
  }

  // 2. Disabled-only filter
  if (disabledOnly) {
    filtered = filtered.filter((n) => n.d === true);
  }

  // 3. Node type filter
  if (nodeType) {
    filtered = filtered.filter((n) => n.type === nodeType);
  }

  return filtered;
}

/**
 * Paginate an array of items with offset + limit.
 *
 * @template T
 * @param {T[]} items - Full array of items (post-filter)
 * @param {number} offset - Zero-based start index (default 0)
 * @param {number} limit - Maximum number of items to return (default 50)
 * @returns {{ items: T[], totalCount: number, offset: number, limit: number, hasMore: boolean }}
 */
export function paginate(items, offset = 0, limit = 50) {
  const totalCount = items.length;
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    totalCount,
    offset,
    limit,
    hasMore: offset + limit < totalCount,
  };
}
