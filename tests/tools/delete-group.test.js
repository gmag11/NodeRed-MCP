import { describe, it, expect } from 'vitest';
import { applyDeleteGroup } from '../../src/tools/delete-group.js';

// ---------------------------------------------------------------------------
const TAB1 = { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false };
const GROUP = {
  id: 'grp1', type: 'group', z: 'tab1', name: 'Test',
  style: { fill: '#ff0' },
  nodes: ['A', 'B'],
  x: 100, y: 100, w: 200, h: 100,
};
const NODE_A = { id: 'A', type: 'debug', z: 'tab1', g: 'grp1', wires: [], x: 120, y: 120 };
const NODE_B = { id: 'B', type: 'inject', z: 'tab1', g: 'grp1', wires: [], x: 150, y: 150 };
const NODE_C = { id: 'C', type: 'debug', z: 'tab1', wires: [], x: 400, y: 100 };

// ---------------------------------------------------------------------------
describe('applyDeleteGroup', () => {
  describe('delete with members', () => {
    it('deletes group and all member nodes', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B, NODE_C] };
      const result = applyDeleteGroup(raw, 'grp1', { deleteMembers: true });

      const ids = result.updatedFlows.map((n) => n.id).sort();
      expect(ids).toEqual(['C', 'tab1']); // only tab + ungrouped node survive
    });

    it('returns previousState with group and members', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B] };
      const result = applyDeleteGroup(raw, 'grp1', { deleteMembers: true });

      expect(result.previousState.group.id).toBe('grp1');
      expect(result.previousState.members).toHaveLength(2);
      expect(result.previousState.members.map((m) => m.id).sort()).toEqual(['A', 'B']);
    });
  });

  describe('delete without members', () => {
    it('deletes group but keeps members with g stripped', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A, NODE_B] };
      const result = applyDeleteGroup(raw, 'grp1', { deleteMembers: false });

      const ids = result.updatedFlows.map((n) => n.id).sort();
      expect(ids).toEqual(['A', 'B', 'tab1']); // nodes survive

      const a = result.updatedFlows.find((n) => n.id === 'A');
      expect(a).not.toHaveProperty('g');
    });
  });

  describe('empty group', () => {
    it('deletes group with no members cleanly', () => {
      const emptyGroup = { ...GROUP, nodes: [] };
      const raw = { flows: [TAB1, emptyGroup] };
      const result = applyDeleteGroup(raw, 'grp1');

      expect(result.updatedFlows.map((n) => n.id)).toEqual(['tab1']);
      expect(result.previousState.members).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('throws when group not found', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyDeleteGroup(raw, 'nope')).toThrow(/Group 'nope' not found/);
    });

    it('throws when parent flow is locked', () => {
      const lockedTab = { ...TAB1, locked: true };
      const raw = { flows: [lockedTab, GROUP, NODE_A] };
      expect(() => applyDeleteGroup(raw, 'grp1')).toThrow(/Flow 'tab1' is locked/);
    });
  });
});
