import { describe, it, expect } from 'vitest';
import { applyUpdateGroup } from '../../src/tools/update-group.js';

// ---------------------------------------------------------------------------
const TAB1 = { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false };
const GROUP = {
  id: 'grp1', type: 'group', z: 'tab1', name: 'Test',
  style: { fill: '#ff0', stroke: '#000', label: true, 'label-position': 'nw', color: '#000' },
  nodes: ['A'], x: 100, y: 100, w: 200, h: 100,
};
const NODE_A = { id: 'A', type: 'debug', z: 'tab1', wires: [], x: 120, y: 120 };

// Not a group
const REGULAR_NODE = { id: 'B', type: 'function', z: 'tab1', wires: [], name: 'Fn' };

// ---------------------------------------------------------------------------
describe('applyUpdateGroup', () => {
  describe('valid updates', () => {
    it('updates group name', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      const result = applyUpdateGroup(raw, 'grp1', { name: 'New Name' });

      expect(result.currentState.name).toBe('New Name');
      expect(result.previousState.name).toBe('Test');
    });

    it('updates group style', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      const result = applyUpdateGroup(raw, 'grp1', {
        style: { fill: '#aaccff', 'label-position': 'se' },
      });

      expect(result.currentState.style.fill).toBe('#aaccff');
      expect(result.currentState.style['label-position']).toBe('se');
      expect(result.currentState.style.label).toBeUndefined(); // shallow merge — old style replaced
    });

    it('updates bounding box dimensions', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      const result = applyUpdateGroup(raw, 'grp1', { x: 50, y: 50, w: 400, h: 200 });

      expect(result.currentState.x).toBe(50);
      expect(result.currentState.y).toBe(50);
      expect(result.currentState.w).toBe(400);
      expect(result.currentState.h).toBe(200);
    });
  });

  describe('error handling', () => {
    it('throws when target is not a group', () => {
      const raw = { flows: [TAB1, REGULAR_NODE] };
      expect(() => applyUpdateGroup(raw, 'B', { name: 'X' }))
        .toThrow(/Node 'B' is not a group/);
    });

    it('throws when group not found', () => {
      const raw = { flows: [TAB1, NODE_A] };
      expect(() => applyUpdateGroup(raw, 'nope', { name: 'X' }))
        .toThrow(/Group 'nope' not found/);
    });

    it('throws when flow is locked', () => {
      const lockedTab = { ...TAB1, locked: true };
      const raw = { flows: [lockedTab, GROUP, NODE_A] };
      expect(() => applyUpdateGroup(raw, 'grp1', { name: 'X' }))
        .toThrow(/Flow 'tab1' is locked/);
    });

    it('rejects wires in properties', () => {
      const raw = { flows: [TAB1, GROUP, NODE_A] };
      expect(() => applyUpdateGroup(raw, 'grp1', { wires: [['A']] }))
        .toThrow(/Cannot set 'wires'/);
    });
  });
});
