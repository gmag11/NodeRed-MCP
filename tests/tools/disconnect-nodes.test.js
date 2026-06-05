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

  // --- Clear-port mode ---

  it('clear-port: clears all targets from an output port', () => {
    // n1 has wires: [['n2'], ['n3']] — two ports
    const rawResponse = makeFlows();
    const { previousWires, currentWires } = applyDisconnect(rawResponse, 'n1', 0, null, true);

    expect(previousWires[0]).toContain('n2');
    expect(previousWires[1]).toContain('n3');
    expect(currentWires[0]).toEqual([]);
    expect(currentWires[1]).toContain('n3'); // other port unaffected
  });

  it('clear-port: no-op on already empty port returns unchanged wires', () => {
    // n1 wires: [['n2'], ['n3']] — port 5 doesn't exist
    const rawResponse = makeFlows();
    const { previousWires, currentWires } = applyDisconnect(rawResponse, 'n1', 5, null, true);

    // Port 5 was already undefined/empty — wires should be structurally identical
    expect(currentWires[0]).toContain('n2');
    expect(currentWires[1]).toContain('n3');
    // Port 0 and 1 unchanged
    expect(JSON.stringify(previousWires)).toBe(JSON.stringify(currentWires));
  });

  it('clear-port: other ports unaffected', () => {
    const rawResponse = makeFlows();
    const { currentWires } = applyDisconnect(rawResponse, 'n1', 1, null, true);

    expect(currentWires[0]).toContain('n2');
    expect(currentWires[1]).toEqual([]);
  });

  // --- Batch mode ---

  it('batch: removes multiple wires across ports', () => {
    // n1 wires: [['n2'], ['n3']]
    const rawResponse = makeFlows();
    const connections = [
      { outputPort: 0, toNodeId: 'n2' },
      { outputPort: 1, toNodeId: 'n3' },
    ];
    const { previousWires, currentWires } = applyDisconnect(rawResponse, 'n1', 0, null, false, connections);

    expect(previousWires[0]).toContain('n2');
    expect(previousWires[1]).toContain('n3');
    expect(currentWires[0]).toEqual([]);
    expect(currentWires[1]).toEqual([]);
  });

  it('batch: missing wire throws before any removal', () => {
    const rawResponse = makeFlows();
    const connections = [
      { outputPort: 0, toNodeId: 'n2' },   // valid — exists
      { outputPort: 1, toNodeId: 'n2' },   // invalid — n2 not on port 1
    ];
    expect(() => applyDisconnect(rawResponse, 'n1', 0, null, false, connections))
      .toThrow("Wire from 'n1'[1] to 'n2' does not exist");

    // Verify port 0 is unchanged (atomic — no partial removal)
    const n1 = rawResponse.flows[1];
    expect(n1.wires[0]).toContain('n2');
    expect(n1.wires[1]).toContain('n3');
  });

  it('batch: other ports unaffected after partial removal', () => {
    const rawResponse = makeFlows();
    const connections = [
      { outputPort: 0, toNodeId: 'n2' },
    ];
    const { currentWires } = applyDisconnect(rawResponse, 'n1', 0, null, false, connections);

    expect(currentWires[0]).toEqual([]);
    expect(currentWires[1]).toContain('n3');
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

  // --- Clear-port mode handler ---

  it('clear-port: response shape includes outputPort and clearPort:true', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn().mockResolvedValueOnce(rawResponse),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 1, clearPort: true });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.outputPort).toBe(1);
    expect(parsed.clearPort).toBe(true);
    expect(parsed.previousWires).toBeDefined();
    expect(parsed.currentWires).toBeDefined();
    // Clear-port response must NOT include toNodeId
    expect(parsed.toNodeId).toBeUndefined();
    expect(client.putFlows).toHaveBeenCalledOnce();
  });

it('clear-port: always deploys (empty port is a safe no-op deploy)', async () => {
  // n1 already has empty port 1? No, n1 has [['n2'], ['n3']] — port 1 has n3.
  // Use a fixture where port 1 is empty
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false };
  const n1 = { id: 'n1', type: 'inject', z: 'flow-1', name: 'Inject', wires: [['n2'], []] };
  const n2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  const rawResponse = { rev: 'rev-cp', flows: [tab, n1, n2] };
  const client = {
    request: vi.fn().mockResolvedValueOnce(rawResponse),
    putFlows: vi.fn().mockResolvedValueOnce({}),
  };

  await handleDisconnectNodes(client, { fromNodeId: 'n1', outputPort: 1, clearPort: true });

  // withRetry always deploys
  expect(client.putFlows).toHaveBeenCalled();
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
      { outputPort: 1, toNodeId: 'n3' },
    ];

    const result = await handleDisconnectNodes(client, { fromNodeId: 'n1', connections });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.connections).toEqual(connections);
    expect(parsed.previousWires).toBeDefined();
    expect(parsed.currentWires).toBeDefined();
    // Batch response must NOT include outputPort, toNodeId, or clearPort
    expect(parsed.outputPort).toBeUndefined();
    expect(parsed.toNodeId).toBeUndefined();
    expect(parsed.clearPort).toBeUndefined();
    expect(client.putFlows).toHaveBeenCalledOnce();
  });
});
