import { describe, it, expect, vi } from 'vitest';
import { handleDeploy } from '../../src/tools/deploy.js';

describe('handleDeploy', () => {
  function makeStaging({ hasPending = false, pendingChanges = 0 } = {}) {
    return {
      deploy: vi.fn(),
      hasPendingChanges: vi.fn().mockReturnValue(hasPending),
      getStagingSummary: vi.fn().mockReturnValue({
        pendingChanges,
        dirtyNodeIds: hasPending ? ['n1'] : [],
        dirtyFlowIds: hasPending ? ['flow-1'] : [],
        deployed: !hasPending,
      }),
    };
  }

  it('deploys with default type "nodes"', async () => {
    const staging = makeStaging({ hasPending: true, pendingChanges: 1 });
    staging.deploy.mockResolvedValueOnce();

    const handler = handleDeploy(staging);
    const result = await handler({});

    expect(staging.deploy).toHaveBeenCalledWith('nodes');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.deployType).toBe('nodes');
    expect(parsed.previousPendingChanges).toBe(1);
  });

  it('deploys with specified deploy type', async () => {
    const staging = makeStaging({ hasPending: true, pendingChanges: 3 });
    staging.deploy.mockResolvedValueOnce();

    const handler = handleDeploy(staging);
    const result = await handler({ deployType: 'full' });

    expect(staging.deploy).toHaveBeenCalledWith('full');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.deployType).toBe('full');
  });

  it('returns success without deploying when no pending changes', async () => {
    const staging = makeStaging({ hasPending: false });

    const handler = handleDeploy(staging);
    const result = await handler({});

    expect(staging.deploy).not.toHaveBeenCalled();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toContain('No pending changes');
  });

  it('throws on invalid deploy type', async () => {
    const staging = makeStaging();

    const handler = handleDeploy(staging);
    await expect(handler({ deployType: 'invalid' })).rejects.toThrow('Invalid deploy type');
  });

  it('throws on version_mismatch with guidance', async () => {
    const staging = makeStaging({ hasPending: true, pendingChanges: 2 });
    staging.deploy.mockRejectedValueOnce(new Error('version_mismatch (409)'));

    const handler = handleDeploy(staging);
    await expect(handler({})).rejects.toThrow('version mismatch');
  });

  it('propagates non-409 errors', async () => {
    const staging = makeStaging({ hasPending: true });
    staging.deploy.mockRejectedValueOnce(new Error('Network error'));

    const handler = handleDeploy(staging);
    await expect(handler({})).rejects.toThrow('Network error');
  });
});
