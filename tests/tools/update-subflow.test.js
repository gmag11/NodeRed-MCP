import { describe, it, expect } from 'vitest';
import { applySubflowUpdate } from '../../src/tools/update-subflow.js';

describe('applySubflowUpdate', () => {
  const baseSubflow = {
    id: 'sub1',
    type: 'subflow',
    name: 'Original Name',
    info: 'Original info',
    in: [],
    out: [],
  };

  it('updates name field', () => {
    const { updatedSubflow, previousState } = applySubflowUpdate(baseSubflow, { name: 'New Name' });

    expect(updatedSubflow.name).toBe('New Name');
    expect(updatedSubflow.info).toBe('Original info');
    expect(previousState.name).toBe('Original Name');
  });

  it('updates info field', () => {
    const { updatedSubflow } = applySubflowUpdate(baseSubflow, { info: 'Updated info' });

    expect(updatedSubflow.info).toBe('Updated info');
  });

  it('updates output ports', () => {
    const newOut = [{ x: 600, y: 80, wires: [{ id: 'n1', port: 0 }] }];
    const { updatedSubflow } = applySubflowUpdate(baseSubflow, { out: newOut });

    expect(updatedSubflow.out).toEqual(newOut);
  });

  it('partial merge preserves unspecified fields', () => {
    const extendedSubflow = {
      ...baseSubflow,
      category: 'custom',
      color: '#FF0000',
    };

    const { updatedSubflow } = applySubflowUpdate(extendedSubflow, { name: 'Renamed' });

    expect(updatedSubflow.name).toBe('Renamed');
    expect(updatedSubflow.category).toBe('custom');
    expect(updatedSubflow.color).toBe('#FF0000');
  });

  it('throws for empty updates', () => {
    expect(() => applySubflowUpdate(baseSubflow, {}))
      .toThrow('No properties to update');
  });

  it('throws for locked subflow', () => {
    const locked = { ...baseSubflow, locked: true };
    expect(() => applySubflowUpdate(locked, { name: 'X' }))
      .toThrow("Subflow 'sub1' is locked");
  });

  it('throws for updates with no allowed fields', () => {
    expect(() => applySubflowUpdate(baseSubflow, { unknownField: 'value' }))
      .toThrow('No valid properties to update');
  });

  it('allows updating category, color, and icon', () => {
    const { updatedSubflow } = applySubflowUpdate(baseSubflow, {
      category: 'subflow',
      color: '#AABBCC',
      icon: 'icon.svg',
    });

    expect(updatedSubflow.category).toBe('subflow');
    expect(updatedSubflow.color).toBe('#AABBCC');
    expect(updatedSubflow.icon).toBe('icon.svg');
  });
});
