import { describe, it, expect } from 'vitest';
import { applyCreateSubflow, buildSubflowDefinition } from '../../src/tools/create-subflow.js';

describe('buildSubflowDefinition', () => {
  it('creates a subflow with minimal fields', () => {
    const node = buildSubflowDefinition('My Subflow', '', undefined, undefined, undefined, [], []);

    expect(node.type).toBe('subflow');
    expect(node.name).toBe('My Subflow');
    expect(node.info).toBe('');
    expect(node.in).toEqual([]);
    expect(node.out).toEqual([]);
    expect(node.id).toBeTruthy();
  });

  it('generates unique IDs', () => {
    const n1 = buildSubflowDefinition('A', '', undefined, undefined, undefined, [], []);
    const n2 = buildSubflowDefinition('B', '', undefined, undefined, undefined, [], []);

    expect(n1.id).not.toBe(n2.id);
  });

  it('includes optional palette metadata when provided', () => {
    const node = buildSubflowDefinition(
      'My Subflow', 'Description', 'custom', '#DDAA99', 'node-red/subflow.svg', [], [],
    );

    expect(node.category).toBe('custom');
    expect(node.color).toBe('#DDAA99');
    expect(node.icon).toBe('node-red/subflow.svg');
  });

  it('omits undefined palette fields', () => {
    const node = buildSubflowDefinition('My Subflow', '', undefined, undefined, undefined, [], []);

    expect(node).not.toHaveProperty('category');
    expect(node).not.toHaveProperty('color');
    expect(node).not.toHaveProperty('icon');
  });

  it('includes port definitions when provided', () => {
    const inPorts = [{ x: 100, y: 100, wires: [{ id: 'n1', port: 0 }] }];
    const outPorts = [{ x: 400, y: 100, wires: [{ id: 'n1', port: 0 }] }];

    const node = buildSubflowDefinition('Sub', '', undefined, undefined, undefined, inPorts, outPorts);

    expect(node.in).toEqual(inPorts);
    expect(node.out).toEqual(outPorts);
  });
});

describe('applyCreateSubflow', () => {
  it('appends subflow to flows array', () => {
    const { updatedFlows, currentState } = applyCreateSubflow(
      { flows: [{ id: 'tab1', type: 'tab', label: 'Flow 1' }] },
      'New Subflow', 'My info', undefined, undefined, undefined, [], [],
    );

    expect(updatedFlows).toHaveLength(2);
    expect(currentState.type).toBe('subflow');
    expect(currentState.name).toBe('New Subflow');
    expect(currentState.info).toBe('My info');
  });
});
