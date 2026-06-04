import { describe, it, expect, vi } from 'vitest';
import { handleUninstallNode } from '../../src/tools/uninstall-node.js';

// ---------------------------------------------------------------------------
// handleUninstallNode
// ---------------------------------------------------------------------------

describe('handleUninstallNode', () => {
  it('calls DELETE /nodes/:module and returns confirmation on 204', async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(null),
    };

    const result = await handleUninstallNode(client, { module: 'node-red-node-suncalc' });

    expect(client.request).toHaveBeenCalledWith('DELETE', '/nodes/node-red-node-suncalc');
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ uninstalled: true, module: 'node-red-node-suncalc' });
  });

  it('propagates 404 error for unknown module', async () => {
    const client = {
      request: vi.fn().mockRejectedValueOnce(
        new Error('Node-RED API error: DELETE /nodes/non-existent returned 404 — Module not found'),
      ),
    };

    await expect(
      handleUninstallNode(client, { module: 'non-existent' }),
    ).rejects.toThrow('Node-RED API error: DELETE /nodes/non-existent returned 404');
  });

  it('encodes special characters in module identifier', async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(null),
    };

    await handleUninstallNode(client, { module: '@scope/my-module' });

    expect(client.request).toHaveBeenCalledWith('DELETE', '/nodes/%40scope%2Fmy-module');
  });

  it('returns correct confirmation structure', async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(null),
    };

    const result = await handleUninstallNode(client, { module: 'node-red-contrib-example' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toHaveProperty('uninstalled', true);
    expect(parsed).toHaveProperty('module', 'node-red-contrib-example');
    expect(Object.keys(parsed)).toEqual(['uninstalled', 'module']);
  });
});
