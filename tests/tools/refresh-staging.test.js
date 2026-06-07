import { describe, it, expect, vi } from 'vitest';
import { handleRefreshStaging } from '../../src/tools/refresh-staging.js';

describe('handleRefreshStaging', () => {
  function makeStaging({ pendingChanges = 0, dirtyNodeIds = [], dirtyFlowIds = [] } = {}) {
    return {
      invalidate: vi.fn(),
      ensureLoaded: vi.fn().mockResolvedValue(undefined),
      getStagingSummary: vi
        .fn()
        // First call: return the "before" state (dirty)
        .mockReturnValueOnce({
          pendingChanges,
          dirtyNodeIds,
          dirtyFlowIds,
          deployed: pendingChanges === 0,
        })
        // Second call: return the "after" state (clean, re-synced)
        .mockReturnValueOnce({
          pendingChanges: 0,
          dirtyNodeIds: [],
          dirtyFlowIds: [],
          deployed: true,
        }),
    };
  }

  it('discards pending changes and reports what was lost', async () => {
    const staging = makeStaging({
      pendingChanges: 3,
      dirtyNodeIds: ['n1', 'n2', 'n3'],
      dirtyFlowIds: ['flow-1'],
    });

    const handler = handleRefreshStaging(staging);
    const result = await handler();
    const parsed = JSON.parse(result.content[0].text);

    // Verify success and warning
    expect(parsed.success).toBe(true);
    expect(parsed.warning).toContain('discarded');
    expect(parsed.warning).toContain('Node-RED backend');

    // Verify previous state captured correctly
    expect(parsed.previousPendingChanges).toBe(3);
    expect(parsed.previousDirtyNodeIds).toEqual(['n1', 'n2', 'n3']);
    expect(parsed.previousDirtyFlowIds).toEqual(['flow-1']);

    // Verify new state is clean
    expect(parsed.staging.pendingChanges).toBe(0);
    expect(parsed.staging.dirtyNodeIds).toEqual([]);
    expect(parsed.staging.dirtyFlowIds).toEqual([]);
    expect(parsed.staging.deployed).toBe(true);
  });

  it('succeeds with no pending changes', async () => {
    const staging = makeStaging({ pendingChanges: 0 });

    const handler = handleRefreshStaging(staging);
    const result = await handler();
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.success).toBe(true);
    expect(parsed.previousPendingChanges).toBe(0);
    expect(parsed.previousDirtyNodeIds).toEqual([]);
    expect(parsed.previousDirtyFlowIds).toEqual([]);
    expect(parsed.staging.deployed).toBe(true);
    // Warning still present as a reminder
    expect(parsed.warning).toBeTruthy();
  });

  it('calls invalidate before ensureLoaded', async () => {
    const staging = makeStaging({ pendingChanges: 1, dirtyNodeIds: ['n1'] });

    const handler = handleRefreshStaging(staging);
    await handler();

    // invalidate must be called before ensureLoaded
    expect(staging.invalidate).toHaveBeenCalled();
    const invalidateOrder = staging.invalidate.mock.invocationCallOrder[0];
    const ensureLoadedOrder = staging.ensureLoaded.mock.invocationCallOrder[0];
    expect(invalidateOrder).toBeLessThan(ensureLoadedOrder);
  });

  it('calls getStagingSummary twice (before and after)', async () => {
    const staging = makeStaging({ pendingChanges: 2, dirtyNodeIds: ['a', 'b'] });

    const handler = handleRefreshStaging(staging);
    await handler();

    expect(staging.getStagingSummary).toHaveBeenCalledTimes(2);
  });

  it('propagates errors from ensureLoaded', async () => {
    const staging = {
      invalidate: vi.fn(),
      ensureLoaded: vi.fn().mockRejectedValue(new Error('Connection refused')),
      getStagingSummary: vi.fn().mockReturnValue({
        pendingChanges: 5,
        dirtyNodeIds: ['x'],
        dirtyFlowIds: [],
        deployed: false,
      }),
    };

    const handler = handleRefreshStaging(staging);
    await expect(handler()).rejects.toThrow('Connection refused');
  });
});
