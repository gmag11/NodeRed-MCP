import { describe, it, expect } from 'vitest';
import { transformFlowNodes } from '../../src/tools/get-flow-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'My Flow', disabled: false });
const TAB2 = makeNode({ id: 'tab2', type: 'tab', label: 'Empty Flow', disabled: false });

const FUNC_NODE = makeNode({
  id: 'n1', type: 'function', z: 'tab1', name: 'Transform',
  func: 'return msg;', outputs: 2, wires: [['n2'], ['n3']],
});
const TMPL_NODE = makeNode({
  id: 'n2', type: 'template', z: 'tab1', name: '',
  template: '<h1>{{payload}}</h1>', field: 'payload', syntax: 'mustache', wires: [],
});
const DEBUG_NODE = makeNode({
  id: 'n3', type: 'debug', z: 'tab1', active: true, tosidebar: true, console: false, wires: [],
});
const DISABLED_NODE = makeNode({
  id: 'n4', type: 'inject', z: 'tab1', name: 'Timer', d: true, wires: [['n1']],
});

const ALL_NODES = [TAB1, TAB2, FUNC_NODE, TMPL_NODE, DEBUG_NODE, DISABLED_NODE];
const RAW = { flows: ALL_NODES };

// ---------------------------------------------------------------------------
// transformFlowNodes
// ---------------------------------------------------------------------------
describe('transformFlowNodes', () => {
  describe('basic retrieval', () => {
    it('returns nodes for a valid flowId', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      expect(result.flowId).toBe('tab1');
      expect(result.nodes).toHaveLength(4);
      expect(result.totalCount).toBe(4);
      expect(result.hasMore).toBe(false);
    });

    it('returns top-level metadata for each node', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      const fn = result.nodes.find((n) => n.id === 'n1');
      expect(fn).toMatchObject({
        id: 'n1',
        type: 'function',
        name: 'Transform',
        disabled: false,
        wires: [['n2'], ['n3']],
      });
    });

    it('returns empty nodes array for an empty flow', () => {
      const result = transformFlowNodes(RAW, 'tab2');
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('throws for unknown flowId', () => {
      expect(() => transformFlowNodes(RAW, 'nonexistent')).toThrow(/Flow not found/);
    });
  });

  describe('config sanitization', () => {
    it('excludes func from function node config', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      const fn = result.nodes.find((n) => n.id === 'n1');
      expect(fn.config).not.toHaveProperty('func');
      expect(fn.config).toHaveProperty('outputs', 2);
    });

    it('excludes template from template node config', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      const tmpl = result.nodes.find((n) => n.id === 'n2');
      expect(tmpl.config).not.toHaveProperty('template');
      expect(tmpl.config).toHaveProperty('field', 'payload');
      expect(tmpl.config).toHaveProperty('syntax', 'mustache');
    });

    it('preserves all safe fields for debug node', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      const dbg = result.nodes.find((n) => n.id === 'n3');
      expect(dbg.config).toMatchObject({ active: true, tosidebar: true, console: false });
    });

    it('config does not contain metadata fields', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      for (const node of result.nodes) {
        expect(node.config).not.toHaveProperty('id');
        expect(node.config).not.toHaveProperty('type');
        expect(node.config).not.toHaveProperty('z');
        expect(node.config).not.toHaveProperty('wires');
        expect(node.config).not.toHaveProperty('name');
      }
    });
  });

  describe('disabledOnly filter', () => {
    it('returns only disabled nodes when disabledOnly: true', () => {
      const result = transformFlowNodes(RAW, 'tab1', { disabledOnly: true });
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('n4');
      expect(result.nodes[0].disabled).toBe(true);
    });

    it('returns all nodes when disabledOnly not set', () => {
      const result = transformFlowNodes(RAW, 'tab1');
      expect(result.nodes).toHaveLength(4);
    });
  });

  describe('nodeType filter', () => {
    it('returns only matching node types', () => {
      const result = transformFlowNodes(RAW, 'tab1', { nodeType: 'debug' });
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('n3');
    });

    it('returns empty when no nodes match type', () => {
      const result = transformFlowNodes(RAW, 'tab1', { nodeType: 'mqtt in' });
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('fromNodeId subgraph filter', () => {
    // Chain: n4(inject,disabled) → n1(function) → n2(template), n3(debug)
    it('downstream from n1 returns n1, n2, n3', () => {
      const result = transformFlowNodes(RAW, 'tab1', { fromNodeId: 'n1', direction: 'downstream' });
      const ids = result.nodes.map((n) => n.id).sort();
      expect(ids).toEqual(['n1', 'n2', 'n3']);
    });

    it('upstream from n1 returns n4, n1', () => {
      const result = transformFlowNodes(RAW, 'tab1', { fromNodeId: 'n1', direction: 'upstream' });
      const ids = result.nodes.map((n) => n.id).sort();
      expect(ids).toEqual(['n1', 'n4']);
    });

    it('both from n1 returns all connected nodes', () => {
      const result = transformFlowNodes(RAW, 'tab1', { fromNodeId: 'n1', direction: 'both' });
      const ids = result.nodes.map((n) => n.id).sort();
      expect(ids).toEqual(['n1', 'n2', 'n3', 'n4']);
    });

    it('throws when fromNodeId not found in flow', () => {
      expect(() =>
        transformFlowNodes(RAW, 'tab1', { fromNodeId: 'MISSING' })
      ).toThrow(/Node not found in flow/);
    });
  });

  describe('pagination', () => {
    const manyNodes = [
      TAB1,
      ...Array.from({ length: 120 }, (_, i) =>
        makeNode({ id: `node${i}`, type: 'debug', z: 'tab1', wires: [] })
      ),
    ];
    const bigRaw = { flows: manyNodes };

    it('returns first 50 with hasMore: true', () => {
      const result = transformFlowNodes(bigRaw, 'tab1');
      expect(result.nodes).toHaveLength(50);
      expect(result.totalCount).toBe(120);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.hasMore).toBe(true);
    });

    it('returns second page correctly', () => {
      const result = transformFlowNodes(bigRaw, 'tab1', { offset: 50, limit: 50 });
      expect(result.nodes).toHaveLength(50);
      expect(result.offset).toBe(50);
      expect(result.hasMore).toBe(true);
    });

    it('returns last page with hasMore: false', () => {
      const result = transformFlowNodes(bigRaw, 'tab1', { offset: 100, limit: 50 });
      expect(result.nodes).toHaveLength(20);
      expect(result.offset).toBe(100);
      expect(result.hasMore).toBe(false);
    });
  });
});
