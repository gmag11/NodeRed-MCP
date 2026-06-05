import { describe, it, expect } from 'vitest';
import { applyCreateSubflowInstance, buildSubflowInstance } from '../../src/tools/create-subflow-instance.js';

describe('buildSubflowInstance', () => {
  it('builds a node with correct type and auto-sized wires', () => {
    const node = buildSubflowInstance('sub1', 'tab1', 'My Instance', [], 4, 200, 300);

    expect(node.type).toBe('subflow:sub1');
    expect(node.z).toBe('tab1');
    expect(node.name).toBe('My Instance');
    expect(node.wires).toEqual([[], [], [], []]);
    expect(node.x).toBe(200);
    expect(node.y).toBe(300);
  });

  it('defaults name and env when not provided', () => {
    const node = buildSubflowInstance('sub1', 'tab1', undefined, undefined, 2, 100, 100);

    expect(node.name).toBe('');
    expect(node.env).toEqual([]);
    expect(node.wires).toEqual([[], []]);
  });

  it('generates a UUID for the node id', () => {
    const node1 = buildSubflowInstance('sub1', 'tab1', '', [], 0, 0, 0);
    const node2 = buildSubflowInstance('sub1', 'tab1', '', [], 0, 0, 0);

    expect(node1.id).toBeTruthy();
    expect(node2.id).toBeTruthy();
    expect(node1.id).not.toBe(node2.id);
  });
});

describe('applyCreateSubflowInstance', () => {
  it('creates instance when subflow and flow exist', () => {
    const { updatedFlows, currentState } = applyCreateSubflowInstance(
      {
        flows: [
          { id: 'sub1', type: 'subflow', name: 'My Subflow', out: [{}, {}, {}] },
          { id: 'tab1', type: 'tab', label: 'Flow 1' },
        ],
      },
      'sub1', 'tab1', 'Inst A', [{ name: 'VAR', value: 'x', type: 'str' }], 200, 100,
    );

    expect(updatedFlows).toHaveLength(3);
    expect(currentState.type).toBe('subflow:sub1');
    expect(currentState.z).toBe('tab1');
    expect(currentState.name).toBe('Inst A');
    expect(currentState.env).toEqual([{ name: 'VAR', value: 'x', type: 'str' }]);
    expect(currentState.wires).toEqual([[], [], []]); // 3 outputs
  });

  it('throws when subflow does not exist', () => {
    expect(() => applyCreateSubflowInstance(
      { flows: [{ id: 'tab1', type: 'tab', label: 'Flow 1' }] },
      'nonexistent', 'tab1', '', [], 0, 0,
    )).toThrow("Subflow 'nonexistent' not found");
  });

  it('throws when flow tab does not exist', () => {
    expect(() => applyCreateSubflowInstance(
      { flows: [{ id: 'sub1', type: 'subflow', name: 'My Subflow', out: [] }] },
      'sub1', 'nonexistent', '', [], 0, 0,
    )).toThrow("Flow 'nonexistent' not found");
  });

  it('throws when flow is locked', () => {
    expect(() => applyCreateSubflowInstance(
      {
        flows: [
          { id: 'sub1', type: 'subflow', name: 'My Subflow', out: [] },
          { id: 'tab1', type: 'tab', label: 'Flow 1', locked: true },
        ],
      },
      'sub1', 'tab1', '', [], 0, 0,
    )).toThrow("Flow 'tab1' is locked");
  });

  it('auto-sizes wires based on subflow output count', () => {
    const { currentState } = applyCreateSubflowInstance(
      {
        flows: [
          { id: 'sub1', type: 'subflow', name: 'My Subflow', out: [{}, {}, {}, {}] },
          { id: 'tab1', type: 'tab', label: 'Flow 1' },
        ],
      },
      'sub1', 'tab1', '', [], 100, 200,
    );

    expect(currentState.wires).toEqual([[], [], [], []]);
  });

  it('handles subflow with no outputs', () => {
    const { currentState } = applyCreateSubflowInstance(
      {
        flows: [
          { id: 'sub1', type: 'subflow', name: 'My Subflow', out: [] },
          { id: 'tab1', type: 'tab', label: 'Flow 1' },
        ],
      },
      'sub1', 'tab1', '', [], 100, 200,
    );

    expect(currentState.wires).toEqual([]);
  });
});
