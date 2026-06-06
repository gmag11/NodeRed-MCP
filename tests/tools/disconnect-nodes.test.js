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
  function makeStaging(flowsArray) {
    return {
      applyMutation: vi.fn().mockImplementation(async (fn) => {
        const result = fn({ flows: [...flowsArray] });
        const { updatedFlows, ...output } = result;
        return output;
      }),
      getStagingSummary: vi.fn().mockReturnValue({
        pendingChanges: 0, dirtyNodeIds: [], dirtyFlowIds: [], deployed: true,
      }),
    };
  }

  it('stages the disconnect and returns wire state', async () => {
    const flows = [...makeFlows().flows];
    const staging = makeStaging(flows);
    const client = {};

    const result = await handleDisconnectNodes(staging, client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });

    expect(staging.applyMutation).toHaveBeenCalledOnce();

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.previousWires[0]).toContain('n2');
    expect(parsed.currentWires[0]).not.toContain('n2');
    expect(parsed.staging).toBeDefined();
  });

  it('throws if fromNodeId is not found', async () => {
    const staging = makeStaging(makeFlows().flows);

    await expect(handleDisconnectNodes(staging, {}, { fromNodeId: 'ghost', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if the wire does not exist', async () => {
    const staging = makeStaging(makeFlows().flows);

    await expect(handleDisconnectNodes(staging, {}, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n3' }))
      .rejects.toThrow(/does not exist/);
  });

  it('throws if the parent flow is locked', async () => {
    const lockedFlows = makeLockedFlows().flows;
    const staging = makeStaging(lockedFlows);

    await expect(handleDisconnectNodes(staging, {}, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });

  it('leaves other ports untouched after staging', async () => {
    const flows = [...makeFlows().flows];
    const staging = makeStaging(flows);
    const client = {};

    const result = await handleDisconnectNodes(staging, client, { fromNodeId: 'n1', outputPort: 0, toNodeId: 'n2' });
    const parsed = JSON.parse(result.content[0].text);
    // Port 1 should still contain n3
    expect(parsed.currentWires[1]).toContain('n3');
  });

  // --- Clear-port mode ---

  it('clear-port: stages and returns correct response shape', async () => {
    const flows = [...makeFlows().flows];
    const staging = makeStaging(flows);
    const client = {};

    const result = await handleDisconnectNodes(staging, client, { fromNodeId: 'n1', outputPort: 1, clearPort: true });

    expect(staging.applyMutation).toHaveBeenCalledOnce();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.staging).toBeDefined();
  });

  // --- Batch mode ---

  it('batch: stages and returns correct response shape', async () => {
    const flows = [...makeFlows().flows];
    const staging = makeStaging(flows);
    const client = {};
    const connections = [
      { outputPort: 0, toNodeId: 'n2' },
      { outputPort: 1, toNodeId: 'n3' },
    ];

    const result = await handleDisconnectNodes(staging, client, { fromNodeId: 'n1', connections });

    expect(staging.applyMutation).toHaveBeenCalledOnce();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.fromNodeId).toBe('n1');
    expect(parsed.staging).toBeDefined();
  });
});
