import { describe, it, expect, vi } from 'vitest';
import { buildCreateFlowPayload, handleCreateFlow } from '../../src/tools/create-flow.js';

// ---------------------------------------------------------------------------
// buildCreateFlowPayload
// ---------------------------------------------------------------------------

describe('buildCreateFlowPayload', () => {
  it('uses provided label, disabled, info, env when all are given', () => {
    const env = [{ name: 'HOST', value: 'localhost', type: 'str' }];
    const payload = buildCreateFlowPayload('My Flow', true, 'Some notes', env);
    expect(payload).toEqual({
      label: 'My Flow',
      disabled: true,
      info: 'Some notes',
      env,
      nodes: [],
    });
  });

  it('defaults disabled to false when omitted', () => {
    const payload = buildCreateFlowPayload('My Flow', undefined, undefined, undefined);
    expect(payload.disabled).toBe(false);
  });

  it('defaults info to empty string when omitted', () => {
    const payload = buildCreateFlowPayload('My Flow', undefined, undefined, undefined);
    expect(payload.info).toBe('');
  });

  it('defaults env to empty array when omitted', () => {
    const payload = buildCreateFlowPayload('My Flow', undefined, undefined, undefined);
    expect(payload.env).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// handleCreateFlow
// ---------------------------------------------------------------------------

describe('handleCreateFlow', () => {
  function makeStaging() {
    return {
      applyMutation: vi.fn().mockImplementation(async (fn) => {
        const result = fn({ flows: [] });
        const { updatedFlows, ...output } = result;
        return output;
      }),
      getStagingSummary: vi.fn().mockReturnValue({
        pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true,
      }),
    };
  }

  it('stages a new flow via staging.applyMutation', async () => {
    const staging = makeStaging();

    const result = await handleCreateFlow(staging, { label: 'Test' });
    const parsed = JSON.parse(result.content[0].text);

    expect(staging.applyMutation).toHaveBeenCalledOnce();
    expect(parsed.flowId).toBeTruthy();
    expect(parsed.currentState.type).toBe('tab');
    expect(parsed.currentState.label).toBe('Test');
    expect(parsed.currentState.disabled).toBe(false);
    expect(parsed.currentState.info).toBe('');
    expect(parsed.staging).toBeDefined();
    expect(parsed.staging.deployed).toBe(true);
  });

  it('includes env and disabled in the staged flow', async () => {
    const staging = makeStaging();
    const env = [{ name: 'PORT', value: '1880', type: 'num' }];

    const result = await handleCreateFlow(staging, { label: 'X', disabled: true, info: 'Notes', env });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.currentState.label).toBe('X');
    expect(parsed.currentState.disabled).toBe(true);
    expect(parsed.currentState.info).toBe('Notes');
    expect(parsed.currentState.env).toEqual(env);
  });
});
