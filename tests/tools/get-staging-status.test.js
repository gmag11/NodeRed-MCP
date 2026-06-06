import { describe, it, expect } from 'vitest';
import { handleGetStagingStatus } from '../../src/tools/get-staging-status.js';

describe('handleGetStagingStatus', () => {
  it('returns staging summary with deployed:true when clean', () => {
    const staging = {
      getStagingSummary: () => ({
        pendingChanges: 0,
        dirtyNodeIds: [],
        dirtyFlowIds: [],
        deployed: true,
      }),
    };

    const handler = handleGetStagingStatus(staging);
    const result = handler();
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.pendingChanges).toBe(0);
    expect(parsed.dirtyNodeIds).toEqual([]);
    expect(parsed.dirtyFlowIds).toEqual([]);
    expect(parsed.deployed).toBe(true);
  });

  it('returns staging summary with deployed:false when dirty', () => {
    const staging = {
      getStagingSummary: () => ({
        pendingChanges: 3,
        dirtyNodeIds: ['n1', 'n2', 'n3'],
        dirtyFlowIds: ['flow-1'],
        deployed: false,
      }),
    };

    const handler = handleGetStagingStatus(staging);
    const result = handler();
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.pendingChanges).toBe(3);
    expect(parsed.dirtyNodeIds).toEqual(['n1', 'n2', 'n3']);
    expect(parsed.dirtyFlowIds).toEqual(['flow-1']);
    expect(parsed.deployed).toBe(false);
  });
});
