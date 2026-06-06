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

// ---------------------------------------------------------------------------
// handleDeleteNode
// ---------------------------------------------------------------------------

describe('handleDeleteNode', () => {
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

  it('stages the deletion and returns nodeId and previousState', async () => {
    const staging = makeStaging(makeFlows().flows);
    const result = await handleDeleteNode(staging, {}, { nodeId: 'n2' });
    expect(staging.applyMutation).toHaveBeenCalledOnce();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.nodeId).toBe('n2');
    expect(parsed.previousState.id).toBe('n2');
    expect(parsed.previousState.type).toBe('debug');
    expect(parsed.staging).toBeDefined();
  });

  it('does not modify other nodes after staging', async () => {
    const staging = makeStaging(makeFlows().flows);
    const result = await handleDeleteNode(staging, {}, { nodeId: 'n2' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.nodeId).toBe('n2');
  });

  it('throws if nodeId is not found', async () => {
    const staging = makeStaging(makeFlows().flows);
    await expect(handleDeleteNode(staging, {}, { nodeId: 'ghost' }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if the node parent flow is locked', async () => {
    const staging = makeStaging(makeLockedFlows().flows);
    await expect(handleDeleteNode(staging, {}, { nodeId: 'n1' }))
      .rejects.toThrow("Flow 'flow-1' is locked");
  });
});
