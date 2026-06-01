import { describe, it, expect, vi } from 'vitest';
import { handleDeleteFlow } from '../../src/tools/delete-flow.js';

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
// handleDeleteFlow
// ---------------------------------------------------------------------------

describe('handleDeleteFlow', () => {
  it('returns flowId and previousState of the deleted flow', async () => {
    const flow = makeFlow();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)   // GET /flow/flow-1
        .mockResolvedValueOnce(null),  // DELETE /flow/flow-1
    };

    const result = await handleDeleteFlow(client, { flowId: 'flow-1' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.flowId).toBe('flow-1');
    expect(parsed.previousState).toEqual(flow);
  });

  it('previousState.nodes contains the nodes from the GET response', async () => {
    const flow = makeFlow();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)
        .mockResolvedValueOnce(null),
    };

    const result = await handleDeleteFlow(client, { flowId: 'flow-1' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.previousState.nodes).toHaveLength(2);
    expect(parsed.previousState.nodes[0].id).toBe('n1');
  });

  it('calls DELETE after a successful GET', async () => {
    const flow = makeFlow();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(flow)
        .mockResolvedValueOnce(null),
    };

    await handleDeleteFlow(client, { flowId: 'flow-1' });

    expect(client.request).toHaveBeenCalledTimes(2);
    expect(client.request).toHaveBeenNthCalledWith(1, 'GET', '/flow/flow-1');
    expect(client.request).toHaveBeenNthCalledWith(2, 'DELETE', '/flow/flow-1');
  });

  it('throws a friendly error when the flow is not found (404)', async () => {
    const client = {
      request: vi.fn().mockRejectedValue(
        new Error('Node-RED API error: GET /flow/missing returned 404'),
      ),
    };

    await expect(handleDeleteFlow(client, { flowId: 'missing' }))
      .rejects.toThrow("Flow 'missing' not found");
  });

  it('re-throws non-404 errors from GET', async () => {
    const client = {
      request: vi.fn().mockRejectedValue(
        new Error('Node-RED API error: GET /flow/flow-1 returned 500'),
      ),
    };

    await expect(handleDeleteFlow(client, { flowId: 'flow-1' }))
      .rejects.toThrow('500');
  });

  it('throws a locked error when the flow is locked', async () => {
    const flow = makeFlow({ locked: true });
    const client = {
      request: vi.fn().mockResolvedValueOnce(flow),
    };

    await expect(handleDeleteFlow(client, { flowId: 'flow-1' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });

  it('does not call DELETE when the flow is locked', async () => {
    const flow = makeFlow({ locked: true });
    const client = {
      request: vi.fn().mockResolvedValueOnce(flow),
    };

    await expect(handleDeleteFlow(client, { flowId: 'flow-1' })).rejects.toThrow();
    expect(client.request).toHaveBeenCalledTimes(1);
  });
});
