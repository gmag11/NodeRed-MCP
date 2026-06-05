import { describe, it, expect } from 'vitest';
import { applyDeleteSubflow, collectSubflowState } from '../../src/tools/delete-subflow.js';

describe('collectSubflowState', () => {
  it('collects definition, internal nodes, and instances', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'n1', type: 'inject', z: 'sub1', wires: [[]] },
      { id: 'n2', type: 'debug', z: 'sub1', wires: [[]] },
      { id: 'tab1', type: 'tab', label: 'Flow 1' },
      { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Instance' },
    ];

    const state = collectSubflowState(flows, 'sub1');

    expect(state.definition.id).toBe('sub1');
    expect(state.internalNodes).toHaveLength(2);
    expect(state.instances).toHaveLength(1);
  });

  it('throws for unknown subflowId', () => {
    expect(() => collectSubflowState([], 'nonexistent'))
      .toThrow("Subflow 'nonexistent' not found");
  });

  it('throws for locked subflow', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'Locked', locked: true, in: [], out: [] },
    ];

    expect(() => collectSubflowState(flows, 'sub1'))
      .toThrow("Subflow 'sub1' is locked");
  });
});

describe('applyDeleteSubflow', () => {
  it('deletes subflow and all related nodes (cascade)', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'n1', type: 'inject', z: 'sub1', wires: [[]] },
      { id: 'n2', type: 'debug', z: 'sub1', wires: [[]] },
      { id: 'tab1', type: 'tab', label: 'Flow 1' },
      { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Instance' },
      { id: 'other1', type: 'inject', z: 'tab1', wires: [[]] },
    ];

    const { updatedFlows, previousState } = applyDeleteSubflow(flows, 'sub1', true);

    expect(updatedFlows).toHaveLength(2); // Only tab1 and other1 remain
    expect(updatedFlows.find((n) => n.id === 'tab1')).toBeTruthy();
    expect(updatedFlows.find((n) => n.id === 'other1')).toBeTruthy();
    expect(previousState.definition.id).toBe('sub1');
    expect(previousState.internalNodes).toHaveLength(2);
    expect(previousState.instances).toHaveLength(1);
  });

  it('keeps instances when deleteInstances is false', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'n1', type: 'inject', z: 'sub1', wires: [[]] },
      { id: 'tab1', type: 'tab', label: 'Flow 1' },
      { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Instance' },
    ];

    const { updatedFlows } = applyDeleteSubflow(flows, 'sub1', false);

    expect(updatedFlows).toHaveLength(2); // tab1 + orphan instance
    expect(updatedFlows.find((n) => n.id === 'i1')).toBeTruthy();
    expect(updatedFlows.find((n) => n.id === 'sub1')).toBeFalsy();
    expect(updatedFlows.find((n) => n.id === 'n1')).toBeFalsy();
  });

  it('throws for unknown subflowId', () => {
    expect(() => applyDeleteSubflow([], 'nonexistent', true))
      .toThrow("Subflow 'nonexistent' not found");
  });
});
