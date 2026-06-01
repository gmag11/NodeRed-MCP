import { describe, it, expect } from 'vitest';
import { transformFlows } from '../../src/tools/get-flows.js';

describe('transformFlows', () => {
  it('returns empty array when there are no flows', () => {
    const result = transformFlows({ rev: '1', flows: [] });
    expect(result).toEqual([]);
  });

  it('returns empty array when flows only has non-tab/non-subflow nodes', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'n1', type: 'inject', z: 'missing-tab' },
        { id: 'cfg1', type: 'mqtt-broker' },
      ],
    });
    expect(result).toEqual([]);
  });

  it('extracts tabs with correct nodeCount and nodeTypes', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false },
        { id: 'n1', type: 'inject', z: 'tab1' },
        { id: 'n2', type: 'function', z: 'tab1' },
        { id: 'n3', type: 'debug', z: 'tab1' },
        { id: 'n4', type: 'inject', z: 'tab1' },
        { id: 'n5', type: 'function', z: 'tab1' },
      ],
    });

    expect(result).toEqual([
      {
        id: 'tab1',
        label: 'Flow 1',
        type: 'tab',
        disabled: false,
        locked: false,
        info: '',
        nodeCount: 5,
        nodeTypes: ['inject', 'function', 'debug'],
      },
    ]);
  });

  it('extracts subflows with correct nodeCount', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'sub1', type: 'subflow', name: 'My Subflow' },
        { id: 'n1', type: 'http request', z: 'sub1' },
        { id: 'n2', type: 'function', z: 'sub1' },
      ],
    });

    expect(result).toEqual([
      {
        id: 'sub1',
        label: 'My Subflow',
        type: 'subflow',
        disabled: false,
        locked: false,
        info: '',
        nodeCount: 2,
        nodeTypes: ['http request', 'function'],
      },
    ]);
  });

  it('excludes global config nodes (no z property) from counts', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false },
        { id: 'cfg1', type: 'mqtt-broker' },
        { id: 'cfg2', type: 'tls-config' },
        { id: 'n1', type: 'mqtt in', z: 'tab1' },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].nodeCount).toBe(1);
    expect(result[0].nodeTypes).toEqual(['mqtt in']);
  });

  it('includes disabled tabs with disabled: true', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Active Flow', disabled: false },
        { id: 'tab2', type: 'tab', label: 'Disabled Flow', disabled: true },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].disabled).toBe(false);
    expect(result[1].disabled).toBe(true);
  });

  it('handles tabs with no child nodes', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Empty Flow', disabled: false },
      ],
    });

    expect(result).toEqual([
      {
        id: 'tab1',
        label: 'Empty Flow',
        type: 'tab',
        disabled: false,
        locked: false,
        info: '',
        nodeCount: 0,
        nodeTypes: [],
      },
    ]);
  });

  it('includes locked: true when tab is locked', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Locked Flow', disabled: false, locked: true, info: '' },
      ],
    });

    expect(result[0].locked).toBe(true);
  });

  it('includes info text when tab has a description', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false, info: 'Handles webhooks' },
      ],
    });

    expect(result[0].info).toBe('Handles webhooks');
  });

  it('defaults locked to false and info to empty string when absent', () => {
    const result = transformFlows({
      rev: '1',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false },
      ],
    });

    expect(result[0].locked).toBe(false);
    expect(result[0].info).toBe('');
  });

  it('handles mixed tabs and subflows', () => {
    const result = transformFlows({
      rev: '2',
      flows: [
        { id: 'tab1', type: 'tab', label: 'Main', disabled: false },
        { id: 'sub1', type: 'subflow', name: 'Helper' },
        { id: 'n1', type: 'inject', z: 'tab1' },
        { id: 'n2', type: 'function', z: 'sub1' },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('tab1');
    expect(result[0].nodeCount).toBe(1);
    expect(result[1].id).toBe('sub1');
    expect(result[1].nodeCount).toBe(1);
  });
});
