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

  // --- Batch mode ---

  it('batch: wires multiple output ports in a single call', () => {
    // n3 has wires: [[], []] — two ports initially empty
    const rawResponse = makeFlows();
    const connections = [
      { outputPort: 0, toNodeId: 'n1' },
      { outputPort: 1, toNodeId: 'n2' },
    ];
    const { previousWires, currentWires } = applyConnect(rawResponse, 'n3', 0, null, connections);

    expect(previousWires).toEqual([[], []]);
    expect(currentWires[0]).toContain('n1');
    expect(currentWires[1]).toContain('n2');
  });

  it('batch: is idempotent — does not duplicate existing wires', () => {
    // n3 starts with n1 already on port 0
    const rawResponse = makeFlows();
    rawResponse.flows[3] = { ...rawResponse.flows[3], wires: [['n1'], []] };
    const connections = [
      { outputPort: 0, toNodeId: 'n1' }, // already exists
      { outputPort: 1, toNodeId: 'n2' }, // new
    ];
    const { currentWires } = applyConnect(rawResponse, 'n3', 0, null, connections);

    const n1Entries = currentWires[0].filter((id) => id === 'n1');
    expect(n1Entries).toHaveLength(1);
    expect(currentWires[1]).toContain('n2');
  });

  it('batch: target-not-found aborts before any change', () => {
    const rawResponse = makeFlows();
    // n3 wires: [[], []] initially (index 3 in flows)
    const connections = [
      { outputPort: 0, toNodeId: 'n1' },   // valid
      { outputPort: 1, toNodeId: 'ghost' }, // does not exist
    ];
    expect(() => applyConnect(rawResponse, 'n3', 0, null, connections))
      .toThrow("Node 'ghost' not found");

    // Verify no changes to the original flows — n3 wires unchanged
    const n3 = rawResponse.flows[3];
    expect(n3.wires).toEqual([[], []]);
  });

  it('batch: pads wires array for output ports beyond current length', () => {
    // n1 starts with wires: [[]]
    const rawResponse = makeFlows();
    const connections = [
      { outputPort: 2, toNodeId: 'n3' },
      { outputPort: 0, toNodeId: 'n2' },
    ];
    const { currentWires } = applyConnect(rawResponse, 'n1', 0, null, connections);

    expect(currentWires[0]).toContain('n2');
    expect(currentWires[1]).toEqual([]);
    expect(currentWires[2]).toContain('n3');
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

it('always deploys (idempotent — wire already exists is a no-op deploy)', async () => {
  const rawResponse = makeFlows();
  // Pre-connect n1 → n2
  rawResponse.flows[1] = { ...rawResponse.flows[1], wires: [['n2']] };

  const client = {
    request: vi.fn().mockResolvedValueOnce(rawResponse),
    putFlows: vi.fn().mockResolvedValueOnce({}),
  };

  await handleConnectNodes(client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

  // withRetry always deploys — even if idempotent, it's a safe no-op
  expect(client.putFlows).toHaveBeenCalled();
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

  // --- Batch mode handler ---

  it('batch: response shape includes connections, excludes outputPort/toNodeId', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };
    const connections = [
      { outputPort: 0, toNodeId: 'n2' },
      { outputPort: 1, toNodeId: 'n1' },
    ];

    const result = await handleConnectNodes(client, { fromNodeId: 'n3', connections });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n3');
    expect(parsed.connections).toEqual(connections);
    expect(parsed.previousWires).toBeDefined();
    expect(parsed.currentWires).toBeDefined();
    // Batch response must NOT include outputPort or toNodeId
    expect(parsed.outputPort).toBeUndefined();
    expect(parsed.toNodeId).toBeUndefined();
    expect(client.putFlows).toHaveBeenCalledOnce();
  });

  it('batch: always deploys (idempotent wires are safe no-op deploys)', async () => {
    // n3 already has n2 on port 0
    const rawResponse = makeFlows();
    rawResponse.flows[3] = { ...rawResponse.flows[3], wires: [['n2'], []] };
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };
    const connections = [
      { outputPort: 0, toNodeId: 'n2' }, // already wired
    ];

    await handleConnectNodes(client, { fromNodeId: 'n3', connections });

    // withRetry always deploys
    expect(client.putFlows).toHaveBeenCalled();
  });
});
