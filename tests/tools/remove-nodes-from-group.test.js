import { describe, it, expect } from 'vitest';
import { applyRemoveNodesFromGroup } from '../../src/tools/remove-nodes-from-group.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TAB1 = { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false };

const GROUP = {
  id: 'grp1', type: 'group', z: 'tab1', name: 'Test Group',
  style: { fill: '#ff0' },
  nodes: ['A', 'B', 'C'],
  x: 100, y: 100, w: 200, h: 150,
};

const NODE_A = { id: 'A', type: 'debug', z: 'tab1', g: 'grp1', x: 120, y: 120, wires: [] };
const NODE_B = { id: 'B', type: 'inject', z: 'tab1', g: 'grp1', x: 200, y: 150, wires: [] };
const NODE_C = { id: 'C', type: 'function', z: 'tab1', g: 'grp1', x: 150, y: 200, wires: [] };
const NODE_D = { id: 'D', type: 'debug', z: 'tab1', x: 400, y: 100, wires: [] }; // ungrouped

// ---------------------------------------------------------------------------
describe('applyRemoveNodesFromGroup', () => {
  describe('specific node removal', () => {
    it('removes specified nodes from the group', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B, NODE_C] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1', { nodeIds: ['A', 'B'] });

      expect(result.removedNodeIds.sort()).toEqual(['A', 'B']);
      expect(result.remainingNodeIds).toEqual(['C']);

      const updatedA = result.updatedFlows.find((n) => n.id === 'A');
      expect(updatedA.g).toBeUndefined();

      const group = result.updatedFlows.find((n) => n.id === 'grp1');
      expect(group.nodes).toEqual(['C']);
    });

    it('removes g property from detached nodes', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1', { nodeIds: ['A'] });

      const updatedA = result.updatedFlows.find((n) => n.id === 'A');
      expect(updatedA).not.toHaveProperty('g');
    });
  });

  describe('full removal (all members)', () => {
    it('removes all nodes when nodeIds is omitted', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B, NODE_C] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1');

      expect(result.removedNodeIds.sort()).toEqual(['A', 'B', 'C']);
      expect(result.remainingNodeIds).toEqual([]);

      const group = result.updatedFlows.find((n) => n.id === 'grp1');
      expect(group.nodes).toEqual([]);
    });
  });

  describe('reposition', () => {
    it('repositions nodes outside group bounds when reposition is true', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1', {
        nodeIds: ['A', 'B'],
        reposition: true,
      });

      // group.x=100, group.w=200 → reposition x = 100+200+40 = 340
      const updatedA = result.updatedFlows.find((n) => n.id === 'A');
      const updatedB = result.updatedFlows.find((n) => n.id === 'B');
      expect(updatedA.x).toBe(340);
      expect(updatedA.y).toBe(100); // group.y
      expect(updatedB.x).toBe(340);
      expect(updatedB.y).toBe(140); // group.y + 40
    });

    it('does not reposition when reposition is false', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1', {
        nodeIds: ['A'],
        reposition: false,
      });

      const updatedA = result.updatedFlows.find((n) => n.id === 'A');
      expect(updatedA.x).toBe(120); // unchanged
      expect(result.repositionedNodes).toEqual([]);
    });
  });

  describe('non-member skip', () => {
    it('silently skips nodes not in the group with warning', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_D] };
      const result = applyRemoveNodesFromGroup(raw, 'grp1', { nodeIds: ['D'] });

      expect(result.removedNodeIds).toEqual([]);
      expect(result.remainingNodeIds).toEqual(['A', 'B', 'C']);
      expect(result.warnings).toBeDefined();
      expect(result.warnings[0]).toContain('not a member');
    });
  });

  describe('error handling', () => {
    it('throws when group not found', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyRemoveNodesFromGroup(raw, 'nope')).toThrow(/Group 'nope' not found/);
    });

    it('throws when parent flow is locked', () => {
      const lockedTab = { ...TAB1, locked: true };
      const raw = { flows: [lockedTab, GROUP, NODE_A] };
      expect(() => applyRemoveNodesFromGroup(raw, 'grp1')).toThrow(/Flow 'tab1' is locked/);
    });
  });
});
