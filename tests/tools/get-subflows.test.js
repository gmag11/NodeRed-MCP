import { describe, it, expect } from 'vitest';
import { transformSubflows } from '../../src/tools/get-subflows.js';

describe('transformSubflows', () => {
  it('returns empty array when there are no flows', () => {
    const result = transformSubflows({ rev: '1', flows: [] });
    expect(result).toEqual([]);
  });

  it('returns empty array when no subflows exist', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        { id: 'n1', type: 'inject', z: 'tab1' },
      ],
    });
    expect(result).toEqual([]);
  });

  it('extracts subflow with correct metadata', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', info: 'Processes data', in: [], out: [] },
      ],
    });

    expect(result).toEqual([
      {
        id: 'sub1',
        name: 'My Subflow',
        info: 'Processes data',
        inputCount: 0,
        outputCount: 0,
        internalNodeCount: 0,
        internalNodeTypes: [],
        instanceCount: 0,
        instances: [],
      },
    ]);
  });

  it('counts internal nodes correctly', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
        { id: 'n1', type: 'inject', z: 'sub1' },
        { id: 'n2', type: 'function', z: 'sub1' },
        { id: 'n3', type: 'debug', z: 'sub1' },
        { id: 'n4', type: 'function', z: 'sub1' },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].internalNodeCount).toBe(4);
    expect(result[0].internalNodeTypes).toEqual(['inject', 'function', 'debug']);
  });

  it('counts input and output ports', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        {
          id: 'sub1',
          type: 'subflow',
          name: 'My Subflow',
          in: [{ x: 100, y: 100, wires: [] }, { x: 100, y: 200, wires: [] }],
          out: [{ x: 400, y: 100, wires: [{ id: 'n1', port: 0 }] }],
        },
      ],
    });

    expect(result[0].inputCount).toBe(2);
    expect(result[0].outputCount).toBe(1);
  });

  it('counts instances and their locations', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        { id: 'tab2', type: 'tab', label: 'Flow 2' },
        { id: 'i1', type: 'subflow:sub1', z: 'tab1', name: 'Inst A' },
        { id: 'i2', type: 'subflow:sub1', z: 'tab2', name: 'Inst B' },
      ],
    });

    expect(result[0].instanceCount).toBe(2);
    expect(result[0].instances).toEqual([
      { id: 'i1', name: 'Inst A', flowId: 'tab1' },
      { id: 'i2', name: 'Inst B', flowId: 'tab2' },
    ]);
  });

  it('handles subflow with no instances', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      ],
    });

    expect(result[0].instanceCount).toBe(0);
    expect(result[0].instances).toEqual([]);
  });

  it('defaults missing fields to empty values', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow' },
      ],
    });

    expect(result[0].name).toBe('');
    expect(result[0].info).toBe('');
  });

  it('handles multiple subflows', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'Helper 1', in: [], out: [] },
        { id: 'sub2', type: 'subflow', name: 'Helper 2', in: [], out: [] },
        { id: 'n1', type: 'inject', z: 'sub1' },
        { id: 'n2', type: 'function', z: 'sub2' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].internalNodeCount).toBe(1);
    expect(result[1].internalNodeCount).toBe(1);
  });

  it('excludes flow tabs from results', () => {
    const result = transformSubflows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1' },
        { id: 'tab2', type: 'tab', label: 'Flow 2' },
        { id: 'n1', type: 'inject', z: 'tab1' },
      ],
    });

    expect(result).toEqual([]);
  });
});
