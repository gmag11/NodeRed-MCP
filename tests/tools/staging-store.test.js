import { describe, it, expect, vi } from 'vitest';
import { StagingStore } from '../../src/staging-store.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeFlowsResponse() {
  return {
    rev: 'rev-001',
    flows: [
      { id: 'tab1', type: 'tab', label: 'Flow 1' },
      { id: 'n1', type: 'inject', z: 'tab1', name: 'Inject', wires: [[]] },
      { id: 'n2', type: 'debug', z: 'tab1', name: 'Debug', wires: [] },
      { id: 'sub1', type: 'subflow', name: 'My Subflow' },
    ],
  };
}

function makeClient() {
  return {
    request: vi.fn(),
    putFlows: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// StagingStore
// ---------------------------------------------------------------------------

describe('StagingStore', () => {
  describe('constructor', () => {
    it('starts unloaded', () => {
      const client = makeClient();
      const staging = new StagingStore(client);
      const summary = staging.getStagingSummary();
      expect(summary.deployed).toBe(true);
      expect(summary.pendingChanges).toBe(0);
      expect(staging.hasPendingChanges()).toBe(false);
    });
  });

  describe('ensureLoaded / getFlows', () => {
    it('lazy-loads flows on first getFlows call', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);
      const flows = await staging.getFlows();

      expect(client.request).toHaveBeenCalledWith('GET', '/flows');
      expect(flows).toHaveLength(4); // tab1, n1, n2, sub1
    });

    it('does not re-fetch on subsequent getFlows calls', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);
      await staging.getFlows();
      await staging.getFlows();

      expect(client.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyMutation', () => {
    it('applies a mutation and tracks dirty nodes', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);

      const result = await staging.applyMutation((rawResponse) => {
        const flows = rawResponse.flows;
        // Add a new node
        const newNode = { id: 'n3', type: 'function', z: 'tab1', name: 'New fn' };
        return { updatedFlows: [...flows, newNode], newId: 'n3' };
      });

      expect(result.newId).toBe('n3');
      expect(staging.hasPendingChanges()).toBe(true);

      const summary = staging.getStagingSummary();
      expect(summary.pendingChanges).toBe(1);
      expect(summary.dirtyNodeIds).toContain('n3');
      expect(summary.dirtyFlowIds).toContain('tab1');
      expect(summary.deployed).toBe(false);
    });

    it('tracks removed nodes as dirty', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);

      await staging.applyMutation((rawResponse) => {
        const flows = rawResponse.flows;
        return { updatedFlows: flows.filter((n) => n.id !== 'n1') };
      });

      const summary = staging.getStagingSummary();
      expect(summary.dirtyNodeIds).toContain('n1');
      expect(summary.dirtyFlowIds).toContain('tab1');
    });

    it('tracks modified nodes as dirty', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);

      await staging.applyMutation((rawResponse) => {
        const flows = rawResponse.flows.map((n) =>
          n.id === 'n1' ? { ...n, name: 'Renamed' } : n
        );
        return { updatedFlows: flows };
      });

      const summary = staging.getStagingSummary();
      expect(summary.dirtyNodeIds).toContain('n1');
    });
  });

  describe('deploy', () => {
    it('sends staged flows and re-fetches on success', async () => {
      const client = makeClient();
      // First call: load
      client.request.mockResolvedValueOnce(makeFlowsResponse());
      // Second call: deploy (putFlows)
      client.putFlows.mockResolvedValueOnce({});
      // Third call: re-fetch after deploy
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);

      // Apply a mutation
      await staging.applyMutation((rawResponse) => {
        const flows = rawResponse.flows;
        const newNode = { id: 'n3', type: 'function', z: 'tab1', name: 'New fn' };
        return { updatedFlows: [...flows, newNode] };
      });

      expect(staging.hasPendingChanges()).toBe(true);

      // Deploy with 'nodes' type (default)
      await staging.deploy('nodes');

      expect(client.putFlows).toHaveBeenCalledOnce();
      const [payload, deployType] = client.putFlows.mock.calls[0];
      expect(deployType).toBe('nodes');
      expect(payload.rev).toBe('rev-001');
      expect(payload.flows).toHaveLength(5); // original 4 + new n3

      // After deploy, dirty should be cleared
      expect(staging.hasPendingChanges()).toBe(false);
    });

    it('throws on version_mismatch', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());
      client.putFlows.mockRejectedValueOnce(
        new Error('version_mismatch: expected rev 002, got 001 (409)'),
      );

      const staging = new StagingStore(client);

      await expect(staging.deploy('full')).rejects.toThrow('version_mismatch');
    });
  });

  describe('invalidate', () => {
    it('clears cache and dirty tracking', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);

      await staging.applyMutation((rawResponse) => {
        const flows = rawResponse.flows;
        const newNode = { id: 'n3', type: 'function', z: 'tab1' };
        return { updatedFlows: [...flows, newNode] };
      });

      await staging.invalidate();

      expect(staging.hasPendingChanges()).toBe(false);
      expect(staging.getStagingSummary().pendingChanges).toBe(0);
    });

    it('forces re-fetch on next access', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);
      await staging.getFlows();
      expect(client.request).toHaveBeenCalledTimes(1);

      await staging.invalidate();

      client.request.mockResolvedValueOnce(makeFlowsResponse());
      await staging.getFlows();
      expect(client.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStagingSummary', () => {
    it('returns deployed:true when clean', async () => {
      const client = makeClient();
      client.request.mockResolvedValueOnce(makeFlowsResponse());

      const staging = new StagingStore(client);
      await staging.getFlows();

      const summary = staging.getStagingSummary();
      expect(summary.pendingChanges).toBe(0);
      expect(summary.dirtyNodeIds).toEqual([]);
      expect(summary.dirtyFlowIds).toEqual([]);
      expect(summary.deployed).toBe(true);
    });
  });
});
