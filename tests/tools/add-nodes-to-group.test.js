import { describe, it, expect } from 'vitest';
import { applyAddNodesToGroup } from '../../src/tools/add-nodes-to-group.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlowNode = (overrides) => ({
  id: 'N1',
  type: 'debug',
  z: 'tab1',
  x: 100,
  y: 100,
  wires: [],
  ...overrides,
});

const TAB1 = { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false };
const NODE_A = makeFlowNode({ id: 'A', type: 'inject', x: 100, y: 100 });
const NODE_B = makeFlowNode({ id: 'B', type: 'function', x: 300, y: 100 });
const NODE_C = makeFlowNode({ id: 'C', type: 'debug', x: 100, y: 300 });
const NODE_OTHER_FLOW = makeFlowNode({ id: 'D', z: 'tab2' });
const TAB2 = { id: 'tab2', type: 'tab', label: 'Flow 2' };

const EXISTING_GROUP = {
  id: 'grp1',
  type: 'group',
  z: 'tab1',
  name: 'Existing',
  style: { fill: '#ff0000' },
  nodes: ['A'],
  x: 80, y: 80, w: 100, h: 100,
};

// Node A already belongs to the existing group
const NODE_A_GROUPED = { ...NODE_A, g: 'grp1' };

// ---------------------------------------------------------------------------
// applyAddNodesToGroup
// ---------------------------------------------------------------------------
describe('applyAddNodesToGroup', () => {
  describe('new group creation', () => {
    it('creates a new group enclosing all specified nodes', () => {
      const raw = { flows: [TAB1, NODE_A, NODE_B] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A', 'B']);

      expect(result.created).toBe(true);
      expect(result.groupId).toBeDefined();
      expect(result.groupName).toBe('Group'); // default when no node name
      expect(result.nodeIds.sort()).toEqual(['A', 'B']);

      // Verify group node was added
      const group = result.updatedFlows.find((n) => n.type === 'group');
      expect(group).toBeDefined();
      expect(group.nodes.sort()).toEqual(['A', 'B']);
      expect(group.style.fill).toBe('#ffff7f'); // default
    });

    it('uses custom groupName when provided', () => {
      const raw = { flows: [TAB1, NODE_A] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A'], { groupName: 'My Group' });

      expect(result.groupName).toBe('My Group');
    });

    it('merges custom style with defaults', () => {
      const raw = { flows: [TAB1, NODE_A] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A'], {
        style: { fill: '#aaccff', stroke: '#0000ff' },
      });

      const group = result.updatedFlows.find((n) => n.type === 'group');
      expect(group.style.fill).toBe('#aaccff');
      expect(group.style.stroke).toBe('#0000ff');
      expect(group.style.label).toBe(true); // default preserved
    });

    it('computes bounding box with 20px padding', () => {
      const raw = { flows: [TAB1, NODE_A, NODE_B, NODE_C] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A', 'B', 'C']);

      // A: (100,100), B: (300,100), C: (100,300)
      // min: 100,100 max: 300,300
      const group = result.updatedFlows.find((n) => n.type === 'group');
      expect(group.x).toBe(80);
      expect(group.y).toBe(80);
      expect(group.w).toBe(240);
      expect(group.h).toBe(240);
    });

    it('sets g property on all member nodes', () => {
      const raw = { flows: [TAB1, NODE_A, NODE_B] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A', 'B']);

      const a = result.updatedFlows.find((n) => n.id === 'A');
      const b = result.updatedFlows.find((n) => n.id === 'B');
      expect(a.g).toBe(result.groupId);
      expect(b.g).toBe(result.groupId);
    });
  });

  describe('existing group addition', () => {
    it('adds nodes to an existing group', () => {
      const raw = { flows: [TAB1, EXISTING_GROUP, NODE_A_GROUPED, NODE_B] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['B'], { groupId: 'grp1' });

      expect(result.created).toBe(false);
      expect(result.groupId).toBe('grp1');
      expect(result.nodeIds.sort()).toEqual(['A', 'B']);

      const group = result.updatedFlows.find((n) => n.id === 'grp1');
      expect(group.nodes.sort()).toEqual(['A', 'B']);
    });

    it('is idempotent — already-grouped node is not duplicated', () => {
      const raw = { flows: [TAB1, EXISTING_GROUP, NODE_A_GROUPED] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['A'], { groupId: 'grp1' });

      const group = result.updatedFlows.find((n) => n.id === 'grp1');
      expect(group.nodes).toEqual(['A']);
    });

    it('reassigns node from another group', () => {
      const otherGroup = {
        id: 'grp2', type: 'group', z: 'tab1', name: 'Other',
        style: {}, nodes: ['B'], x: 0, y: 0, w: 50, h: 50,
      };
      const nodeBGrouped = { ...NODE_B, g: 'grp2' };
      const raw = { flows: [TAB1, EXISTING_GROUP, otherGroup, NODE_A_GROUPED, nodeBGrouped] };
      const result = applyAddNodesToGroup(raw, 'tab1', ['B'], { groupId: 'grp1' });

      const grp1 = result.updatedFlows.find((n) => n.id === 'grp1');
      const grp2 = result.updatedFlows.find((n) => n.id === 'grp2');
      const b = result.updatedFlows.find((n) => n.id === 'B');

      expect(b.g).toBe('grp1');
      expect(grp1.nodes.sort()).toEqual(['A', 'B']);
      expect(grp2.nodes).toEqual([]); // B was removed from grp2
    });
  });

  describe('error handling', () => {
    it('throws when flowId not found', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyAddNodesToGroup(raw, 'nonexistent', ['A'])).toThrow(/Flow 'nonexistent' not found/);
    });

    it('throws when a node does not exist', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyAddNodesToGroup(raw, 'tab1', ['Z'])).toThrow(/Node 'Z' not found/);
    });

    it('throws when a node is in a different flow', () => {
      const raw = { flows: [TAB1, TAB2, NODE_A, NODE_OTHER_FLOW] };
      expect(() => applyAddNodesToGroup(raw, 'tab1', ['D'])).toThrow(/All nodes must belong to flow 'tab1'/);
    });

    it('throws when existing groupId not found', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyAddNodesToGroup(raw, 'tab1', ['A'], { groupId: 'nope' })).toThrow(/Group 'nope' not found/);
    });

    it('throws when flow is locked', () => {
      const lockedTab = { ...TAB1, locked: true };
      const raw = { flows: [lockedTab, NODE_A] };
      expect(() => applyAddNodesToGroup(raw, 'tab1', ['A'])).toThrow(/Flow 'tab1' is locked/);
    });
  });
});
