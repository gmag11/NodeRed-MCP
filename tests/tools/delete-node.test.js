import { describe, it, expect, vi } from 'vitest';
import { applyDeleteNode, handleDeleteNode } from '../../src/tools/delete-node.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false, ...overrides.tab };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [['n2']] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  const n3 = { id: 'n3', type: 'function', z: 'flow-1', name: 'Fn', wires: [] };
  return { rev: 'rev-abc', flows: [tab, n1, n2, n3] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked Flow', locked: true };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [] };
  return { rev: 'rev-locked', flows: [tab, n1] };
};

// ---------------------------------------------------------------------------
// applyDeleteNode
// ---------------------------------------------------------------------------

describe('applyDeleteNode', () => {
  it('removes the correct node from updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyDeleteNode(rawResponse, 'n2');

    expect(updatedFlows.find((n) => n.id === 'n2')).toBeUndefined();
  });

  it('does not remove any other nodes', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyDeleteNode(rawResponse, 'n2');

    expect(updatedFlows.find((n) => n.id === 'n1')).toBeDefined();
    expect(updatedFlows.find((n) => n.id === 'n3')).toBeDefined();
    expect(updatedFlows.find((n) => n.id === 'flow-1')).toBeDefined();
  });

  it('returns the deleted node as previousState', () => {
    const rawResponse = makeFlows();
    const { previousState } = applyDeleteNode(rawResponse, 'n2');

    expect(previousState.id).toBe('n2');
    expect(previousState.type).toBe('debug');
    expect(previousState.name).toBe('Debug');
  });

  it('reduces flow count by exactly one', () => {
    const rawResponse = makeFlows();
    const originalCount = rawResponse.flows.length;
    const { updatedFlows } = applyDeleteNode(rawResponse, 'n1');

    expect(updatedFlows).toHaveLength(originalCount - 1);
  });

  it('does not mutate the original flows array', () => {
    const rawResponse = makeFlows();
    const originalCount = rawResponse.flows.length;
    applyDeleteNode(rawResponse, 'n2');

    expect(rawResponse.flows).toHaveLength(originalCount);
  });

  it('throws if nodeId is not found', () => {
    const rawResponse = makeFlows();
    expect(() => applyDeleteNode(rawResponse, 'ghost-node'))
      .toThrow("Node 'ghost-node' not found");
  });

  it('throws if the node parent flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyDeleteNode(rawResponse, 'n1'))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleDeleteNode
// ---------------------------------------------------------------------------

describe('handleDeleteNode', () => {
  it('GETs /flows, POSTs updated flows, returns nodeId and previousState', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleDeleteNode(client, { nodeId: 'n2' });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();

    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-abc');
    expect(putPayload.flows.find((n) => n.id === 'n2')).toBeUndefined();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.nodeId).toBe('n2');
    expect(parsed.previousState.id).toBe('n2');
    expect(parsed.previousState.type).toBe('debug');
  });

  it('round-trips the rev field in the POST body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'special-rev-007' };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleDeleteNode(client, { nodeId: 'n1' });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('special-rev-007');
  });

  it('does not modify any other nodes in the PUT body', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleDeleteNode(client, { nodeId: 'n2' });

    const [putPayload] = client.putFlows.mock.calls[0];
    const n1 = putPayload.flows.find((n) => n.id === 'n1');
    expect(n1).toBeDefined();
    expect(n1.name).toBe('Inject');
    const n3 = putPayload.flows.find((n) => n.id === 'n3');
    expect(n3).toBeDefined();
  });

  it('throws if nodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleDeleteNode(client, { nodeId: 'ghost' }))
      .rejects.toThrow("Node 'ghost' not found");
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('throws if the node parent flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleDeleteNode(client, { nodeId: 'n1' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });
});
