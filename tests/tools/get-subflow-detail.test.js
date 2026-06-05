import { describe, it, expect } from 'vitest';
import { transformSubflowDetail } from '../../src/tools/get-subflow-detail.js';

describe('transformSubflowDetail', () => {
  it('returns subflow definition, internal nodes, instances, and diagram', () => {
    const result = transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', info: '', in: [], out: [] },
        { id: 'n1', type: 'inject', z: 'sub1', name: 'Trigger', x: 100, y: 100, wires: [['n2']] },
        { id: 'n2', type: 'debug', z: 'sub1', name: 'Output', x: 300, y: 100, wires: [[]] },
      ],
    }, 'sub1');

    expect(result.definition.id).toBe('sub1');
    expect(result.definition.type).toBe('subflow');
    expect(result.internalNodes).toHaveLength(2);
    expect(result.internalNodes[0].type).toBe('inject');
    expect(result.instances).toHaveLength(0);
    expect(result.diagram).toContain('flowchart TD');
    expect(result.diagram).toContain('Trigger');
    expect(result.diagram).toContain('Output');
  });

  it('throws error for unknown subflowId', () => {
    expect(() => transformSubflowDetail({
      rev: '1',
      flows: [],
    }, 'nonexistent')).toThrow("Subflow 'nonexistent' not found");
  });

  it('handles subflow with instances', () => {
    const result = transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Instance 1', x: 200, y: 200, wires: [[], []] },
      ],
    }, 'sub1');

    expect(result.instances).toHaveLength(1);
    expect(result.instances[0].id).toBe('i1');
    expect(result.instances[0].name).toBe('Instance 1');
    expect(result.instances[0].flowId).toBe('tab1');
  });

  it('handles empty subflow (no internal nodes)', () => {
    const result = transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'Empty', in: [], out: [] },
      ],
    }, 'sub1');

    expect(result.internalNodes).toHaveLength(0);
    expect(result.diagram).toContain('Empty flow');
  });

  it('does not confuse subflow with tab', () => {
    expect(() => transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        { id: 'n1', type: 'inject', z: 'tab1' },
      ],
    }, 'tab1')).toThrow("Subflow 'tab1' not found");
  });

  it('includes instance env variables', () => {
    const result = transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        {
          id: 'i1',
          type: 'subflow:sub1',
          z: 'tab1',
          name: 'Inst',
          env: [{ name: 'THRESHOLD', value: '42', type: 'num' }],
          x: 200,
          y: 200,
          wires: [[]],
        },
      ],
    }, 'sub1');

    expect(result.instances[0].env).toEqual([{ name: 'THRESHOLD', value: '42', type: 'num' }]);
  });

  it('sanitizes internal node configs (no func body)', () => {
    const result = transformSubflowDetail({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
        { id: 'n1', type: 'function', z: 'sub1', name: 'Logic', func: 'return msg;', x: 100, y: 100, wires: [[]] },
      ],
    }, 'sub1');

    expect(result.internalNodes[0].config).not.toHaveProperty('func');
  });
});
