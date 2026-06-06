import { describe, it, expect, vi } from 'vitest';
import { applyFlowUpdate, handleUpdateFlow } from '../../src/tools/update-flow.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlow = (overrides = {}) => ({
  id: 'flow-1',
  label: 'My Flow',
  disabled: false,
  locked: false,
  info: '',
  env: [],
  nodes: [
    { id: 'n1', type: 'inject', z: 'flow-1' },
    { id: 'n2', type: 'debug', z: 'flow-1' },
  ],
  ...overrides,
});

// ---------------------------------------------------------------------------
// applyFlowUpdate
// ---------------------------------------------------------------------------

describe('applyFlowUpdate', () => {
  it('renames a flow when label is updated', () => {
    const flow = makeFlow();
    const { updatedFlow } = applyFlowUpdate(flow, { label: 'Renamed Flow' });
    expect(updatedFlow.label).toBe('Renamed Flow');
  });

  it('enables a disabled flow', () => {
    const flow = makeFlow({ disabled: true });
    const { updatedFlow } = applyFlowUpdate(flow, { disabled: false });
    expect(updatedFlow.disabled).toBe(false);
  });

  it('disables an enabled flow', () => {
    const flow = makeFlow({ disabled: false });
    const { updatedFlow } = applyFlowUpdate(flow, { disabled: true });
    expect(updatedFlow.disabled).toBe(true);
  });

  it('updates the info field', () => {
    const flow = makeFlow();
    const { updatedFlow } = applyFlowUpdate(flow, { info: 'New description' });
    expect(updatedFlow.info).toBe('New description');
  });

  it('replaces the env array', () => {
    const flow = makeFlow({ env: [{ name: 'OLD', value: '1', type: 'str' }] });
    const newEnv = [{ name: 'NEW', value: '2', type: 'num' }];
    const { updatedFlow } = applyFlowUpdate(flow, { env: newEnv });
    expect(updatedFlow.env).toEqual(newEnv);
  });

  it('preserves the nodes array unchanged', () => {
    const flow = makeFlow();
    const { updatedFlow } = applyFlowUpdate(flow, { label: 'Changed' });
    expect(updatedFlow.nodes).toEqual(flow.nodes);
    expect(updatedFlow.nodes).toHaveLength(2);
  });

  it('returns the original flow as previousState', () => {
    const flow = makeFlow();
    const { previousState } = applyFlowUpdate(flow, { label: 'Changed' });
    expect(previousState).toEqual(flow);
    expect(previousState.label).toBe('My Flow');
  });

  it('throws when updates object is empty', () => {
    expect(() => applyFlowUpdate(makeFlow(), {})).toThrow('No properties to update');
  });

  it('throws when updates is null or undefined', () => {
    expect(() => applyFlowUpdate(makeFlow(), null)).toThrow('No properties to update');
    expect(() => applyFlowUpdate(makeFlow(), undefined)).toThrow('No properties to update');
  });

  it('throws a locked error when the flow is locked', () => {
    const flow = makeFlow({ locked: true });
    expect(() => applyFlowUpdate(flow, { label: 'X' })).toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleUpdateFlow
// ---------------------------------------------------------------------------

describe('handleUpdateFlow', () => {
  function makeFlows(overrides = {}) {
    const tab = {
      id: 'flow-1', type: 'tab', label: 'My Flow',
      disabled: false, locked: false, info: '', env: [],
      ...overrides,
    };
    const n1 = { id: 'n1', type: 'inject', z: 'flow-1' };
    const n2 = { id: 'n2', type: 'debug', z: 'flow-1' };
    return [tab, n1, n2];
  }

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

  it('stages the update via staging.applyMutation', async () => {
    const staging = makeStaging(makeFlows());

    const result = await handleUpdateFlow(staging, { flowId: 'flow-1', updates: { label: 'Renamed' } });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.flowId).toBe('flow-1');
    expect(parsed.previousState.label).toBe('My Flow');
    expect(parsed.currentState.label).toBe('Renamed');
    expect(parsed.staging).toBeDefined();
    expect(staging.applyMutation).toHaveBeenCalledOnce();
  });

  it('throws when flow is not found', async () => {
    const staging = makeStaging(makeFlows());

    await expect(handleUpdateFlow(staging, { flowId: 'missing', updates: { label: 'X' } }))
      .rejects.toThrow("Flow 'missing' not found");
  });

  it('throws when flow is locked', async () => {
    const staging = makeStaging(makeFlows({ locked: true }));

    await expect(handleUpdateFlow(staging, { flowId: 'flow-1', updates: { label: 'X' } }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });
});
