import { describe, it, expect, vi } from 'vitest';
import { applyNodeUpdate, handleUpdateNode } from '../../src/tools/update-node.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build a minimal flows array with one tab and two nodes */
const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false };
  const node1 = { id: 'n1', type: 'function', z: 'flow-1', name: 'Old Name', func: 'return msg;', wires: [['n2']] };
  const node2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  return { rev: 'rev-abc', flows: [{ ...tab, ...overrides.tab }, node1, node2] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked Flow', locked: true };
  const node = { id: 'n1', type: 'function', z: 'flow-1', name: 'Old', wires: [] };
  return { rev: 'rev-locked', flows: [tab, node] };
};

// ---------------------------------------------------------------------------
// applyNodeUpdate
// ---------------------------------------------------------------------------

describe('applyNodeUpdate', () => {
  it('updates a single field and returns correct previousState / currentState', () => {
    const rawResponse = makeFlows();
    const { previousState, currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'New Name' });

    expect(previousState.name).toBe('Old Name');
    expect(currentState.name).toBe('New Name');
  });

  it('preserves unmentioned fields (shallow merge)', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'Changed' });

    expect(currentState.func).toBe('return msg;');
    expect(currentState.type).toBe('function');
    expect(currentState.z).toBe('flow-1');
  });

  it('updates multiple properties at once', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'Multi', func: 'return null;' });

    expect(currentState.name).toBe('Multi');
    expect(currentState.func).toBe('return null;');
  });

  it('returns updatedFlows with the node replaced', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyNodeUpdate(rawResponse, 'n1', { name: 'Updated' });

    const updatedNode = updatedFlows.find((n) => n.id === 'n1');
    expect(updatedNode.name).toBe('Updated');
  });

  it('leaves other nodes unchanged in updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyNodeUpdate(rawResponse, 'n1', { name: 'Updated' });

    const otherNode = updatedFlows.find((n) => n.id === 'n2');
    expect(otherNode.name).toBe('Debug');
  });

  it('throws if wires is present in properties', () => {
    const rawResponse = makeFlows();
    expect(() => applyNodeUpdate(rawResponse, 'n1', { wires: [] }))
      .toThrow(/wires/i);
  });

  it('throws Node not found when nodeId does not exist', () => {
    const rawResponse = makeFlows();
    expect(() => applyNodeUpdate(rawResponse, 'missing-id', { name: 'X' }))
      .toThrow("Node 'missing-id' not found");
  });

  it('throws a locked error when the parent flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyNodeUpdate(rawResponse, 'n1', { name: 'X' }))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleUpdateNode
// ---------------------------------------------------------------------------

describe('handleUpdateNode', () => {
  it('GETs /flows then PUTs with updated node', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'New' } });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();
    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-abc');
    const updatedNode = putPayload.flows.find((n) => n.id === 'n1');
    expect(updatedNode.name).toBe('New');
  });

  it('round-trips the rev field in the PUT body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'my-revision-123' };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'X' } });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('my-revision-123');
  });

  it('returns previousState and currentState in MCP content', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'New' } });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nodeId).toBe('n1');
    expect(parsed.previousState.name).toBe('Old Name');
    expect(parsed.currentState.name).toBe('New');
  });

  it('throws if wires is in properties', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'n1', properties: { wires: [] } }))
      .rejects.toThrow(/wires/i);
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('throws if nodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'ghost', properties: { name: 'X' } }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if parent flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'X' } }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });
});
