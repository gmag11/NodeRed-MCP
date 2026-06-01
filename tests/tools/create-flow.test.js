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
  it('POSTs to /flow with the assembled payload', async () => {
    const fakeResult = { id: 'new-flow-1', label: 'Test', disabled: false, info: '', env: [], nodes: [] };
    const client = { request: vi.fn().mockResolvedValue(fakeResult) };

    await handleCreateFlow(client, { label: 'Test' });

    expect(client.request).toHaveBeenCalledWith('POST', '/flow', {
      label: 'Test',
      disabled: false,
      info: '',
      env: [],
      nodes: [],
    });
  });

  it('returns flowId and currentState from API response', async () => {
    const fakeResult = { id: 'new-flow-1', label: 'Test', disabled: false, info: '', env: [], nodes: [] };
    const client = { request: vi.fn().mockResolvedValue(fakeResult) };

    const result = await handleCreateFlow(client, { label: 'Test' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.flowId).toBe('new-flow-1');
    expect(parsed.currentState).toEqual(fakeResult);
  });

  it('includes env in the POST payload when provided', async () => {
    const env = [{ name: 'PORT', value: '1880', type: 'num' }];
    const fakeResult = { id: 'f2', label: 'X', disabled: false, info: '', env, nodes: [] };
    const client = { request: vi.fn().mockResolvedValue(fakeResult) };

    await handleCreateFlow(client, { label: 'X', env });

    expect(client.request.mock.calls[0][2].env).toEqual(env);
  });
});
