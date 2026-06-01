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
  it('GETs the current flow then PUTs the updated flow', async () => {
    const flow = makeFlow();
    const updated = { ...flow, label: 'Renamed' };
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)    // GET
        .mockResolvedValueOnce(updated), // PUT
    };

    await handleUpdateFlow(client, { flowId: 'flow-1', updates: { label: 'Renamed' } });

    expect(client.request).toHaveBeenCalledTimes(2);
    expect(client.request).toHaveBeenNthCalledWith(1, 'GET', '/flow/flow-1');
    const putCall = client.request.mock.calls[1];
    expect(putCall[0]).toBe('PUT');
    expect(putCall[1]).toBe('/flow/flow-1');
    expect(putCall[2].label).toBe('Renamed');
  });

  it('returns previousState and currentState', async () => {
    const flow = makeFlow();
    const updated = { ...flow, label: 'Renamed' };
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)
        .mockResolvedValueOnce(updated),
    };

    const result = await handleUpdateFlow(client, { flowId: 'flow-1', updates: { label: 'Renamed' } });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.flowId).toBe('flow-1');
    expect(parsed.previousState.label).toBe('My Flow');
    expect(parsed.currentState.label).toBe('Renamed');
  });

  it('preserves nodes in the PUT body', async () => {
    const flow = makeFlow();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)
        .mockResolvedValueOnce({ ...flow, info: 'Updated' }),
    };

    await handleUpdateFlow(client, { flowId: 'flow-1', updates: { info: 'Updated' } });

    const putBody = client.request.mock.calls[1][2];
    expect(putBody.nodes).toEqual(flow.nodes);
  });

  it('throws a friendly error when the flow is not found (404)', async () => {
    const client = {
      request: vi.fn().mockRejectedValue(
        new Error('Node-RED API error: GET /flow/missing returned 404'),
      ),
    };

    await expect(handleUpdateFlow(client, { flowId: 'missing', updates: { label: 'X' } }))
      .rejects.toThrow("Flow 'missing' not found");
  });

  it('re-throws non-404 errors from GET', async () => {
    const client = {
      request: vi.fn().mockRejectedValue(
        new Error('Node-RED API error: GET /flow/flow-1 returned 500'),
      ),
    };

    await expect(handleUpdateFlow(client, { flowId: 'flow-1', updates: { label: 'X' } }))
      .rejects.toThrow('500');
  });

  it('throws a locked error when the flow is locked', async () => {
    const flow = makeFlow({ locked: true });
    const client = {
      request: vi.fn().mockResolvedValueOnce(flow),
    };

    await expect(handleUpdateFlow(client, { flowId: 'flow-1', updates: { label: 'X' } }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });

  it('does not call PUT when the flow is locked', async () => {
    const flow = makeFlow({ locked: true });
    const client = {
      request: vi.fn().mockResolvedValueOnce(flow),
    };

    await expect(handleUpdateFlow(client, { flowId: 'flow-1', updates: { label: 'X' } })).rejects.toThrow();
    expect(client.request).toHaveBeenCalledTimes(1);
  });
});
