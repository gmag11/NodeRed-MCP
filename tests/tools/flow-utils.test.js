import { describe, it, expect } from 'vitest';
import {
  BLOCKLISTED_FIELDS,
  sanitizeNodeConfig,
  getFlowNodes,
  buildReverseWireIndex,
  buildForwardWireIndex,
  getConnectedSubgraph,
  applyFilters,
  paginate,
} from '../../src/tools/flow-utils.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** A minimal Node-RED /flows v2 response for a flow with id "tab1" */
const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false });
const TAB2 = makeNode({ id: 'tab2', type: 'tab', label: 'Flow 2', disabled: false });

// tab1 nodes: A → B → C (chain), D isolated
const NODE_A = makeNode({ id: 'A', type: 'inject', z: 'tab1', name: 'Start', wires: [['B']] });
const NODE_B = makeNode({ id: 'B', type: 'function', z: 'tab1', name: 'Process', func: 'return msg;', outputs: 1, wires: [['C']] });
const NODE_C = makeNode({ id: 'C', type: 'debug', z: 'tab1', active: true, wires: [] });
const NODE_D = makeNode({ id: 'D', type: 'inject', z: 'tab1', name: 'Isolated', wires: [] });

// tab2 node
const NODE_E = makeNode({ id: 'E', type: 'debug', z: 'tab2', wires: [] });

// Global config node (no z)
const CONFIG_NODE = makeNode({ id: 'cfg1', type: 'mqtt-broker', broker: 'localhost', port: 1883 });

const ALL_NODES = [TAB1, TAB2, NODE_A, NODE_B, NODE_C, NODE_D, NODE_E, CONFIG_NODE];

// ---------------------------------------------------------------------------
// BLOCKLISTED_FIELDS
// ---------------------------------------------------------------------------
describe('BLOCKLISTED_FIELDS', () => {
  it('contains expected fields', () => {
    expect(BLOCKLISTED_FIELDS.has('func')).toBe(true);
    expect(BLOCKLISTED_FIELDS.has('template')).toBe(true);
    expect(BLOCKLISTED_FIELDS.has('format')).toBe(true);
    expect(BLOCKLISTED_FIELDS.has('html')).toBe(true);
    expect(BLOCKLISTED_FIELDS.has('css')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sanitizeNodeConfig
// ---------------------------------------------------------------------------
describe('sanitizeNodeConfig', () => {
  it('excludes blocklisted fields', () => {
    const config = sanitizeNodeConfig(NODE_B);
    expect(config).not.toHaveProperty('func');
  });

  it('excludes metadata fields', () => {
    const config = sanitizeNodeConfig(NODE_B);
    expect(config).not.toHaveProperty('id');
    expect(config).not.toHaveProperty('type');
    expect(config).not.toHaveProperty('z');
    expect(config).not.toHaveProperty('x');
    expect(config).not.toHaveProperty('y');
    expect(config).not.toHaveProperty('wires');
    expect(config).not.toHaveProperty('d');
    expect(config).not.toHaveProperty('name');
  });

  it('preserves safe config fields', () => {
    const config = sanitizeNodeConfig(NODE_B);
    expect(config).toHaveProperty('outputs', 1);
  });

  it('preserves all fields for a debug node', () => {
    const node = makeNode({ id: 'x', type: 'debug', z: 'tab1', active: true, tosidebar: true, console: false });
    const config = sanitizeNodeConfig(node);
    expect(config).toMatchObject({ active: true, tosidebar: true, console: false });
    expect(config).not.toHaveProperty('id');
    expect(config).not.toHaveProperty('type');
  });

  it('returns empty object when all fields are metadata or blocklisted', () => {
    const node = { id: 'x', type: 'function', z: 'tab1', name: 'F', wires: [], func: 'return msg;' };
    const config = sanitizeNodeConfig(node);
    expect(config).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getFlowNodes
// ---------------------------------------------------------------------------
describe('getFlowNodes', () => {
  it('returns nodes belonging to the specified flow', () => {
    const result = getFlowNodes(ALL_NODES, 'tab1');
    expect(result.map((n) => n.id).sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('returns empty array for a flow with no nodes', () => {
    // TAB2 exists but has no nodes with z === 'tab2' (NODE_E was moved to a separate fixture)
    const nodesWithoutE = [TAB1, TAB2, NODE_A, NODE_B, NODE_C, NODE_D, CONFIG_NODE];
    const result = getFlowNodes(nodesWithoutE, 'tab2');
    expect(result).toEqual([]);
  });

  it('throws if flowId does not match any tab or subflow', () => {
    expect(() => getFlowNodes(ALL_NODES, 'nonexistent')).toThrow(/Flow not found/);
  });
});

// ---------------------------------------------------------------------------
// buildReverseWireIndex
// ---------------------------------------------------------------------------
describe('buildReverseWireIndex', () => {
  it('maps targets to their source nodes', () => {
    const tab1Nodes = [NODE_A, NODE_B, NODE_C, NODE_D];
    const index = buildReverseWireIndex(tab1Nodes);
    expect(index.get('B')).toEqual(new Set(['A']));
    expect(index.get('C')).toEqual(new Set(['B']));
    expect(index.has('A')).toBe(false); // A has no incoming wires
    expect(index.has('D')).toBe(false); // D has no incoming wires
  });

  it('handles nodes with no wires', () => {
    const index = buildReverseWireIndex([NODE_D]);
    expect(index.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildForwardWireIndex
// ---------------------------------------------------------------------------
describe('buildForwardWireIndex', () => {
  it('maps sources to their target nodes', () => {
    const tab1Nodes = [NODE_A, NODE_B, NODE_C, NODE_D];
    const index = buildForwardWireIndex(tab1Nodes);
    expect(index.get('A')).toEqual(new Set(['B']));
    expect(index.get('B')).toEqual(new Set(['C']));
    expect(index.has('C')).toBe(false); // C has no outgoing wires
    expect(index.has('D')).toBe(false); // D has no outgoing wires
  });
});

// ---------------------------------------------------------------------------
// getConnectedSubgraph
// ---------------------------------------------------------------------------
describe('getConnectedSubgraph', () => {
  const nodes = [NODE_A, NODE_B, NODE_C, NODE_D];
  const reverseIndex = buildReverseWireIndex(nodes);

  it('downstream from A returns A, B, C', () => {
    const result = getConnectedSubgraph(nodes, 'A', 'downstream', reverseIndex);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('upstream from C returns A, B, C', () => {
    const result = getConnectedSubgraph(nodes, 'C', 'upstream', reverseIndex);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('both from B returns A, B, C (full component)', () => {
    const result = getConnectedSubgraph(nodes, 'B', 'both', reverseIndex);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('downstream from C (no outgoing) returns only C', () => {
    const result = getConnectedSubgraph(nodes, 'C', 'downstream', reverseIndex);
    expect(result).toEqual(new Set(['C']));
  });

  it('upstream from A (no incoming) returns only A', () => {
    const result = getConnectedSubgraph(nodes, 'A', 'upstream', reverseIndex);
    expect(result).toEqual(new Set(['A']));
  });

  it('isolated node D returns only D regardless of direction', () => {
    const result = getConnectedSubgraph(nodes, 'D', 'both', reverseIndex);
    expect(result).toEqual(new Set(['D']));
  });

  it('throws if fromNodeId not found', () => {
    expect(() =>
      getConnectedSubgraph(nodes, 'NONEXISTENT', 'both', reverseIndex)
    ).toThrow(/Node not found in flow/);
  });

  it('two independent chains: from first chain returns only first chain', () => {
    // Groups: A→B→C and D→E→F (separate variables to avoid collision with outer scope)
    const n1 = makeNode({ id: 'n1', type: 'inject', z: 't', wires: [['n2']] });
    const n2 = makeNode({ id: 'n2', type: 'function', z: 't', wires: [['n3']] });
    const n3 = makeNode({ id: 'n3', type: 'debug', z: 't', wires: [] });
    const n4 = makeNode({ id: 'n4', type: 'inject', z: 't', wires: [['n5']] });
    const n5 = makeNode({ id: 'n5', type: 'function', z: 't', wires: [['n6']] });
    const n6 = makeNode({ id: 'n6', type: 'debug', z: 't', wires: [] });
    const chainNodes = [n1, n2, n3, n4, n5, n6];
    const ri = buildReverseWireIndex(chainNodes);

    const result = getConnectedSubgraph(chainNodes, 'n2', 'both', ri);
    expect(result).toEqual(new Set(['n1', 'n2', 'n3']));
  });
});

// ---------------------------------------------------------------------------
// applyFilters
// ---------------------------------------------------------------------------
describe('applyFilters', () => {
  const nodes = [NODE_A, NODE_B, NODE_C, NODE_D];

  it('returns all nodes when no filters', () => {
    expect(applyFilters(nodes)).toHaveLength(4);
  });

  it('disabledOnly filters to nodes with d: true', () => {
    const disabledNode = makeNode({ id: 'X', type: 'inject', z: 'tab1', d: true });
    const result = applyFilters([...nodes, disabledNode], { disabledOnly: true });
    expect(result).toEqual([disabledNode]);
  });

  it('nodeType filter returns only matching types', () => {
    const result = applyFilters(nodes, { nodeType: 'debug' });
    expect(result.map((n) => n.id)).toEqual(['C']);
  });

  it('fromNodeId with direction downstream', () => {
    const result = applyFilters(nodes, { fromNodeId: 'A', direction: 'downstream' });
    expect(result.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('fromNodeId with direction upstream', () => {
    const result = applyFilters(nodes, { fromNodeId: 'C', direction: 'upstream' });
    expect(result.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('fromNodeId with direction both (default)', () => {
    const result = applyFilters(nodes, { fromNodeId: 'B' });
    expect(result.map((n) => n.id).sort()).toEqual(['A', 'B', 'C']);
  });

  it('throws when fromNodeId not found', () => {
    expect(() => applyFilters(nodes, { fromNodeId: 'MISSING' })).toThrow(/Node not found/);
  });
});

// ---------------------------------------------------------------------------
// paginate
// ---------------------------------------------------------------------------
describe('paginate', () => {
  const items = Array.from({ length: 12 }, (_, i) => i);

  it('returns first page with defaults', () => {
    const result = paginate(items);
    expect(result.items).toHaveLength(12); // 12 < default limit 50
    expect(result.totalCount).toBe(12);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(50);
    expect(result.hasMore).toBe(false);
  });

  it('returns first page when limit < totalCount', () => {
    const result = paginate(items, 0, 5);
    expect(result.items).toEqual([0, 1, 2, 3, 4]);
    expect(result.totalCount).toBe(12);
    expect(result.hasMore).toBe(true);
  });

  it('returns second page', () => {
    const result = paginate(items, 5, 5);
    expect(result.items).toEqual([5, 6, 7, 8, 9]);
    expect(result.hasMore).toBe(true);
  });

  it('returns last page with hasMore false', () => {
    const result = paginate(items, 10, 5);
    expect(result.items).toEqual([10, 11]);
    expect(result.hasMore).toBe(false);
  });

  it('empty array', () => {
    const result = paginate([], 0, 10);
    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
