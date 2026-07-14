import { describe, it, expect, vi } from 'vitest';
import { applySubflowUpdate, handleUpdateSubflow } from '../../src/tools/update-subflow.js';

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

// ---------------------------------------------------------------------------
// handleUpdateSubflow — type mismatch detection
// ---------------------------------------------------------------------------

describe('handleUpdateSubflow', () => {
  function makeStaging(flowsArray) {
    return {
      applyMutation: vi.fn().mockImplementation(async (fn) => {
        const result = fn({ flows: [...flowsArray] });
        const { updatedFlows, ...output } = result;
        return output;
      }),
      getStagingSummary: vi.fn().mockReturnValue({
        pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true,
      }),
    };
  }

  it('throws type-mismatch error when subflowId matches a subflow instance', async () => {
    const flows = [
      { id: 'subdef', type: 'subflow', name: 'My Subflow', in: [], out: [] },
      { id: 'inst1', type: 'subflow:subdef', name: 'Instance 1', z: 'tab1', x: 100, y: 100, wires: [[]] },
    ];
    const staging = makeStaging(flows);
    const client = {};

    await expect(handleUpdateSubflow(staging, client, { subflowId: 'inst1', updates: { name: 'Renamed' } }))
      .rejects.toThrow("is a subflow instance (type: 'subflow:subdef'), not a subflow definition");
  });

  it('does NOT throw type-mismatch for a valid subflow definition ID', async () => {
    const flows = [
      { id: 'subdef', type: 'subflow', name: 'My Subflow', in: [], out: [] },
    ];
    const staging = makeStaging(flows);
    const client = {};

    const result = await handleUpdateSubflow(staging, client, { subflowId: 'subdef', updates: { name: 'Renamed' } });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.subflowId).toBe('subdef');
    expect(parsed.currentState.name).toBe('Renamed');
  });
});
