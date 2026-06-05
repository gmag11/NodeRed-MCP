import { describe, it, expect } from 'vitest';
import { collectSubflowExport } from '../../src/tools/export-subflow.js';

describe('collectSubflowExport', () => {
  it('exports subflow definition and internal nodes', () => {
    const allNodes = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', info: '', in: [], out: [] },
      { id: 'n1', type: 'inject', z: 'sub1', name: 'Trigger', wires: [[]] },
      { id: 'n2', type: 'debug', z: 'sub1', name: 'Output', wires: [[]] },
    ];

    const { subflowNodes, name, nodeCount } = collectSubflowExport(allNodes, 'sub1');

    expect(name).toBe('My Subflow');
    expect(nodeCount).toBe(3);
    expect(subflowNodes).toHaveLength(3);
    expect(subflowNodes.map((n) => n.id).sort()).toEqual(['sub1', 'n1', 'n2'].sort());
  });

  it('throws for unknown subflowId', () => {
    expect(() => collectSubflowExport([], 'nonexistent'))
      .toThrow("Subflow 'nonexistent' not found");
  });

  it('exports empty subflow (definition only)', () => {
    const allNodes = [
      { id: 'sub1', type: 'subflow', name: 'Empty', info: '', in: [], out: [] },
    ];

    const { subflowNodes, nodeCount } = collectSubflowExport(allNodes, 'sub1');

    expect(nodeCount).toBe(1);
    expect(subflowNodes[0].id).toBe('sub1');
  });

  it('includes referenced config nodes', () => {
    const allNodes = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'n1', type: 'mqtt in', z: 'sub1', name: 'MQTT', broker: 'broker1', wires: [[]] },
      { id: 'broker1', type: 'mqtt-broker', broker: 'localhost', port: 1883 },
    ];

    const { subflowNodes, nodeCount } = collectSubflowExport(allNodes, 'sub1');

    expect(nodeCount).toBe(3); // subflow + mqtt in + broker
    expect(subflowNodes.find((n) => n.id === 'broker1')).toBeTruthy();
  });

  it('excludes instances from export', () => {
    const allNodes = [
      { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'n1', type: 'inject', z: 'sub1', name: 'Trigger', wires: [[]] },
      { id: 'tab1', type: 'tab', label: 'Flow 1' },
      { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Instance' },
    ];

    const { subflowNodes, nodeCount } = collectSubflowExport(allNodes, 'sub1');

    expect(nodeCount).toBe(2); // Only subflow + inject
    expect(subflowNodes.find((n) => n.id === 'i1')).toBeFalsy();
  });
});
