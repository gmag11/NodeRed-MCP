import { describe, it, expect, vi } from 'vitest';
import { applyConnect, handleConnectNodes } from '../../src/tools/connect-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false, ...overrides.tab };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [[]] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  const n3 = { id: 'n3', type: 'function', z: 'flow-1', name: 'Fn', wires: [[], []] };
  return { rev: 'rev-xyz', flows: [tab, n1, n2, n3] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked', locked: true };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [[]] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  return { rev: 'rev-locked', flows: [tab, n1, n2] };
};

// ---------------------------------------------------------------------------
// applyConnect
// ---------------------------------------------------------------------------

describe('applyConnect', () => {
  it('adds a wire from port 0 and returns correct previousWires / currentWires', () => {
    const rawResponse = makeFlows();
    const { previousWires, currentWires } = applyConnect(rawResponse, 'n1', 0, 'n2');

    expect(previousWires[0]).toEqual([]);
    expect(currentWires[0]).toContain('n2');
  });

  it('is idempotent when the wire already exists', () => {
    const rawResponse = makeFlows();
    // First connect
    const { updatedFlows } = applyConnect(rawResponse, 'n1', 0, 'n2');
    const secondResponse = { rev: rawResponse.rev, flows: updatedFlows };
    // Second connect — should not duplicate
    const { currentWires } = applyConnect(secondResponse, 'n1', 0, 'n2');

    const n2Entries = currentWires[0].filter((id) => id === 'n2');
    expect(n2Entries).toHaveLength(1);
  });

  it('pads wires array when outputPort exceeds current length', () => {
    // n1 starts with wires: [[]]
    const rawResponse = makeFlows();
    const { currentWires } = applyConnect(rawResponse, 'n1', 2, 'n2');

    // Port 0 and 1 should be empty, port 2 should contain n2
    expect(currentWires[0]).toEqual([]);
    expect(currentWires[1]).toEqual([]);
    expect(currentWires[2]).toContain('n2');
  });

  it('adds a wire to a specific non-zero output port', () => {
    // n3 has wires: [[], []] — two existing ports
    const rawResponse = makeFlows();
    const { currentWires } = applyConnect(rawResponse, 'n3', 1, 'n2');

    expect(currentWires[0]).toEqual([]);
    expect(currentWires[1]).toContain('n2');
  });

  it('leaves other nodes unchanged in updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyConnect(rawResponse, 'n1', 0, 'n2');

    const n2 = updatedFlows.find((n) => n.id === 'n2');
    expect(n2.wires).toEqual([]);
    const n3 = updatedFlows.find((n) => n.id === 'n3');
    expect(n3.wires).toEqual([[], []]);
  });

  it('throws if fromNodeId is not found', () => {
    const rawResponse = makeFlows();
    expect(() => applyConnect(rawResponse, 'ghost', 0, 'n2'))
      .toThrow("Node 'ghost' not found");
  });

  it('throws if toNodeId is not found', () => {
    const rawResponse = makeFlows();
    expect(() => applyConnect(rawResponse, 'n1', 0, 'ghost'))
      .toThrow("Node 'ghost' not found");
  });

  it('throws if the source node parent flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyConnect(rawResponse, 'n1', 0, 'n2'))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// handleConnectNodes
// ---------------------------------------------------------------------------

describe('handleConnectNodes', () => {
  it('GETs /flows, PUTs updated flows, returns wire state', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();
    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-xyz');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.toNodeId).toBe('n2');
    expect(parsed.currentWires[0]).toContain('n2');
  });

  it('does not call putFlows when the wire already exists', async () => {
    const rawResponse = makeFlows();
    // Pre-connect n1 → n2
    rawResponse.flows[1] = { ...rawResponse.flows[1], wires: [['n2']] };

    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('round-trips the rev field in PUT body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'specific-rev' };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('specific-rev');
  });

  it('throws if fromNodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleConnectNodes(client, { fromNodeId: 'ghost', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if toNodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'ghost' }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if source node parent flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn(),
    };

    await expect(handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });
});
