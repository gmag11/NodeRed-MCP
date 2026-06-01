import { describe, it, expect, vi } from 'vitest';
import { applyDisconnect, handleDisconnectNodes } from '../../src/tools/disconnect-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false, ...overrides.tab };
  // n1 connects to n2 on port 0, and to n3 on port 1
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [['n2'], ['n3']] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  const n3 = { id: 'n3', type: 'function', z: 'flow-1', name: 'Fn', wires: [] };
  return { rev: 'rev-abc', flows: [tab, n1, n2, n3] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked', locked: true };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [['n2']] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  return { rev: 'rev-locked', flows: [tab, n1, n2] };
};

// ---------------------------------------------------------------------------
// applyDisconnect
// ---------------------------------------------------------------------------

describe('applyDisconnect', () => {
  it('removes a wire and returns correct previousWires / currentWires', () => {
    const rawResponse = makeFlows();
    const { previousWires, currentWires } = applyDisconnect(rawResponse, 'n1', 0, 'n2');

    expect(previousWires[0]).toContain('n2');
    expect(currentWires[0]).not.toContain('n2');
  });

  it('leaves other ports untouched', () => {
    const rawResponse = makeFlows();
    const { currentWires } = applyDisconnect(rawResponse, 'n1', 0, 'n2');

    // Port 1 should still contain n3
    expect(currentWires[1]).toContain('n3');
  });

  it('removes the wire from a non-zero output port', () => {
    const rawResponse = makeFlows();
    const { currentWires } = applyDisconnect(rawResponse, 'n1', 1, 'n3');

    expect(currentWires[0]).toContain('n2');
    expect(currentWires[1]).not.toContain('n3');
  });

  it('does not modify any other nodes in updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyDisconnect(rawResponse, 'n1', 0, 'n2');

    const n2 = updatedFlows.find((n) => n.id === 'n2');
    expect(n2.wires).toEqual([]);
    const n3 = updatedFlows.find((n) => n.id === 'n3');
    expect(n3.wires).toEqual([]);
  });

  it('throws if fromNodeId is not found', () => {
    const rawResponse = makeFlows();
    expect(() => applyDisconnect(rawResponse, 'ghost', 0, 'n2'))
      .toThrow("Node 'ghost' not found");
  });

  it('throws if the wire does not exist in the specified port', () => {
    const rawResponse = makeFlows();
    expect(() => applyDisconnect(rawResponse, 'n1', 0, 'n3'))
      .toThrow("Wire from 'n1'[0] to 'n3' does not exist");
  });

  it('throws if outputPort is out of range (no wires on that port)', () => {
    const rawResponse = makeFlows();
    expect(() => applyDisconnect(rawResponse, 'n1', 5, 'n2'))
      .toThrow(/does not exist/);
  });

  it('throws if the parent flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyDisconnect(rawResponse, 'n1', 0, 'n2'))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleDisconnectNodes
// ---------------------------------------------------------------------------

describe('handleDisconnectNodes', () => {
  it('GETs /flows, PUTs updated flows, returns wire state', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();
    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-abc');

    const updatedN1 = putPayload.flows.find((n) => n.id === 'n1');
    expect(updatedN1.wires[0]).not.toContain('n2');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.toNodeId).toBe('n2');
    expect(parsed.previousWires[0]).toContain('n2');
    expect(parsed.currentWires[0]).not.toContain('n2');
  });

  it('round-trips the rev field in PUT body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'my-specific-rev' };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('my-specific-rev');
  });

  it('throws if fromNodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleDisconnectNodes(client, { fromNodeId: 'ghost', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if the wire does not exist', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n3' }))
      .rejects.toThrow(/does not exist/);
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('throws if the parent flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('leaves other ports untouched in the PUT body', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    const [putPayload] = client.putFlows.mock.calls[0];
    const updatedN1 = putPayload.flows.find((n) => n.id === 'n1');
    // Port 1 should still contain n3
    expect(updatedN1.wires[1]).toContain('n3');
  });
});
