import { describe, it, expect, vi } from 'vitest';
import { buildNewNode, applyCreateNode, handleCreateNode } from '../../src/tools/create-node.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false, ...overrides.tab };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [[]] };
  return { rev: 'rev-abc', flows: [tab, n1] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked Flow', locked: true };
  return { rev: 'rev-locked', flows: [tab] };
};

// ---------------------------------------------------------------------------
// buildNewNode
// ---------------------------------------------------------------------------

describe('buildNewNode', () => {
  it('returns a node with correct structural fields', () => {
    const node = buildNewNode('debug', 'flow-1', {}, 200, 200);

    expect(node.type).toBe('debug');
    expect(node.z).toBe('flow-1');
    expect(node.x).toBe(200);
    expect(node.y).toBe(200);
    expect(node.wires).toEqual([[]]);
  });

  it('generates a unique UUID for id', () => {
    const a = buildNewNode('debug', 'flow-1', {}, 200, 200);
    const b = buildNewNode('debug', 'flow-1', {}, 200, 200);

    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    // UUID v4 format
    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('merges type-specific properties onto the skeleton', () => {
    const node = buildNewNode('function', 'flow-1', { name: 'My Fn', func: 'return msg;' }, 200, 200);

    expect(node.name).toBe('My Fn');
    expect(node.func).toBe('return msg;');
  });

  it('silently strips id from properties', () => {
    const node = buildNewNode('debug', 'flow-1', { id: 'hacked-id' }, 200, 200);

    expect(node.id).not.toBe('hacked-id');
    expect(node.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('silently strips z from properties', () => {
    const node = buildNewNode('debug', 'flow-1', { z: 'other-flow' }, 200, 200);

    expect(node.z).toBe('flow-1');
  });

  it('silently strips wires from properties', () => {
    const node = buildNewNode('debug', 'flow-1', { wires: [['n99']] }, 200, 200);

    expect(node.wires).toEqual([[]]);
  });

  it('uses provided x and y values', () => {
    const node = buildNewNode('debug', 'flow-1', {}, 500, 300);

    expect(node.x).toBe(500);
    expect(node.y).toBe(300);
  });

  it('defaults x and y to 200 when passed as such', () => {
    const node = buildNewNode('debug', 'flow-1', {}, 200, 200);

    expect(node.x).toBe(200);
    expect(node.y).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// applyCreateNode
// ---------------------------------------------------------------------------

describe('applyCreateNode', () => {
  it('appends the new node to updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyCreateNode(rawResponse, 'debug', 'flow-1', {}, 200, 200);

    expect(updatedFlows).toHaveLength(rawResponse.flows.length + 1);
    const newNode = updatedFlows[updatedFlows.length - 1];
    expect(newNode.type).toBe('debug');
    expect(newNode.z).toBe('flow-1');
  });

  it('returns currentState with the full node object', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyCreateNode(rawResponse, 'function', 'flow-1', { name: 'My Fn' }, 100, 150);

    expect(currentState.type).toBe('function');
    expect(currentState.name).toBe('My Fn');
    expect(currentState.x).toBe(100);
    expect(currentState.y).toBe(150);
  });

  it('does not mutate existing nodes', () => {
    const rawResponse = makeFlows();
    const originalLength = rawResponse.flows.length;
    applyCreateNode(rawResponse, 'debug', 'flow-1', {}, 200, 200);

    expect(rawResponse.flows).toHaveLength(originalLength);
  });

  it('throws if flowId is not found', () => {
    const rawResponse = makeFlows();
    expect(() => applyCreateNode(rawResponse, 'debug', 'no-such-flow', {}, 200, 200))
      .toThrow("Flow 'no-such-flow' not found");
  });

  it('throws if the target flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyCreateNode(rawResponse, 'debug', 'flow-1', {}, 200, 200))
      .toThrow("Flow 'flow-1' is locked");
  });

  it('strips structural fields from properties', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyCreateNode(rawResponse, 'debug', 'flow-1', { id: 'bad', z: 'bad', wires: [['x']] }, 200, 200);

    expect(currentState.id).not.toBe('bad');
    expect(currentState.z).toBe('flow-1');
    expect(currentState.wires).toEqual([[]]);
  });
});

// ---------------------------------------------------------------------------
// handleCreateNode
// ---------------------------------------------------------------------------

describe('handleCreateNode', () => {
  it('GETs /flows, POSTs updated flows, returns nodeId and currentState', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleCreateNode(client, {
      type: 'debug',
      flowId: 'flow-1',
    });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();

    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-abc');
    // New node should be appended
    const newNode = putPayload.flows[putPayload.flows.length - 1];
    expect(newNode.type).toBe('debug');
    expect(newNode.z).toBe('flow-1');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.nodeId).toBeTruthy();
    expect(parsed.currentState.type).toBe('debug');
  });

  it('defaults x and y to 200 when omitted', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleCreateNode(client, { type: 'debug', flowId: 'flow-1' });

    const [putPayload] = client.putFlows.mock.calls[0];
    const newNode = putPayload.flows[putPayload.flows.length - 1];
    expect(newNode.x).toBe(200);
    expect(newNode.y).toBe(200);
  });

  it('uses custom x and y when provided', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleCreateNode(client, { type: 'debug', flowId: 'flow-1', x: 500, y: 300 });

    const [putPayload] = client.putFlows.mock.calls[0];
    const newNode = putPayload.flows[putPayload.flows.length - 1];
    expect(newNode.x).toBe(500);
    expect(newNode.y).toBe(300);
  });

  it('round-trips the rev field in the POST body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'specific-rev-999' };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleCreateNode(client, { type: 'debug', flowId: 'flow-1' });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('specific-rev-999');
  });

  it('throws if flowId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleCreateNode(client, { type: 'debug', flowId: 'ghost-flow' }))
      .rejects.toThrow("Flow 'ghost-flow' not found");
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('throws if the target flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleCreateNode(client, { type: 'debug', flowId: 'flow-1' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });
});
