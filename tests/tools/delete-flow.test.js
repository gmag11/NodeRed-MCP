import { describe, it, expect, vi } from 'vitest';
import { applyDeleteFlow, handleDeleteFlow } from '../../src/tools/delete-flow.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeFlows(overrides = {}) {
  const tab = {
    id: 'flow-1',
    type: 'tab',
    label: 'My Flow',
    disabled: false,
    locked: false,
    info: '',
    env: [],
    ...overrides,
  };
  const tab2 = { id: 'flow-2', type: 'tab', label: 'Other Flow', locked: false };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [[]] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  return [tab, tab2, n1, n2];
}

function makeLockedFlows() {
  return [{ id: 'flow-1', type: 'tab', label: 'Locked Flow', locked: true }];
}

/**
 * Create a staging mock that delegates to applyDeleteFlow.
 */
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

// ---------------------------------------------------------------------------
// applyDeleteFlow
// ---------------------------------------------------------------------------

describe('applyDeleteFlow', () => {
  it('removes the tab and all its child nodes', () => {
    const flows = makeFlows();
    const { updatedFlows, previousState } = applyDeleteFlow({ flows }, 'flow-1');

    // Tab and children should be gone
    expect(updatedFlows.find((n) => n.id === 'flow-1')).toBeUndefined();
    expect(updatedFlows.find((n) => n.id === 'n1')).toBeUndefined();
    expect(updatedFlows.find((n) => n.id === 'n2')).toBeUndefined();

    // previousState should contain the tab and its children
    expect(previousState.tab.id).toBe('flow-1');
    expect(previousState.nodes).toHaveLength(2);
  });

  it('throws if flow is not found', () => {
    expect(() => applyDeleteFlow({ flows: makeFlows() }, 'missing'))
      .toThrow("Flow 'missing' not found");
  });

  it('throws if flow is locked', () => {
    expect(() => applyDeleteFlow({ flows: makeLockedFlows() }, 'flow-1'))
      .toThrow("Flow 'flow-1' is locked");
  });

  it('throws if flow is the last remaining flow tab', () => {
    const flows = [{ id: 'flow-1', type: 'tab', label: 'Solo', locked: false }];
    expect(() => applyDeleteFlow({ flows }, 'flow-1'))
      .toThrow(
        'Cannot delete the last flow — at least one flow tab must exist'
      );
  });

  it('allows deletion when multiple flow tabs exist', () => {
    const flows = [
      { id: 'flow-1', type: 'tab', label: 'First', locked: false },
      { id: 'flow-2', type: 'tab', label: 'Second', locked: false },
      { id: 'n1', type: 'inject', z: 'flow-1', wires: [[]] },
    ];
    const { updatedFlows, previousState } = applyDeleteFlow({ flows }, 'flow-1');
    expect(previousState.tab.id).toBe('flow-1');
    // flow-2 should still exist
    expect(updatedFlows.find((n) => n.id === 'flow-2')).toBeDefined();
    // flow-1 should be removed
    expect(updatedFlows.find((n) => n.id === 'flow-1')).toBeUndefined();
  });

  it('throws locked error before last-flow error for single locked flow', () => {
    const flows = [{ id: 'flow-1', type: 'tab', label: 'Only', locked: true }];
    expect(() => applyDeleteFlow({ flows }, 'flow-1'))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleDeleteFlow
// ---------------------------------------------------------------------------

describe('handleDeleteFlow', () => {
  it('returns flowId and previousState via staging.applyMutation', async () => {
    const flows = makeFlows();
    const staging = makeStaging(flows);

    const result = await handleDeleteFlow(staging, { flowId: 'flow-1' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.flowId).toBe('flow-1');
    expect(parsed.previousState.tab.id).toBe('flow-1');
    expect(parsed.previousState.nodes).toHaveLength(2);
    expect(parsed.staging).toBeDefined();
    expect(parsed.staging.deployed).toBe(true);
    expect(staging.applyMutation).toHaveBeenCalledOnce();
  });

  it('throws when flow is not found', async () => {
    const staging = makeStaging(makeFlows());

    await expect(handleDeleteFlow(staging, { flowId: 'missing' }))
      .rejects.toThrow("Flow 'missing' not found");
  });

  it('throws when flow is locked', async () => {
    const staging = makeStaging(makeLockedFlows());

    await expect(handleDeleteFlow(staging, { flowId: 'flow-1' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });
});
