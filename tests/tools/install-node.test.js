import { describe, it, expect, vi } from 'vitest';
import { handleInstallNode } from '../../src/tools/install-node.js';

// ---------------------------------------------------------------------------
// handleInstallNode
// ---------------------------------------------------------------------------

describe('handleInstallNode', () => {
  it('calls POST /nodes with the module name and returns the Node Module object', async () => {
    const nodeModule = {
      name: 'node-red-node-suncalc',
      version: '0.0.6',
      nodes: [
        {
          id: 'node-red-node-suncalc/suncalc',
          name: 'suncalc',
          types: ['sunrise'],
          enabled: true,
          loaded: true,
          module: 'node-red-node-suncalc',
        },
      ],
    };

    const client = {
      request: vi.fn().mockResolvedValueOnce(nodeModule),
    };

    const result = await handleInstallNode(client, { module: 'node-red-node-suncalc' });

    expect(client.request).toHaveBeenCalledWith('POST', '/nodes', {
      module: 'node-red-node-suncalc',
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual(nodeModule);
    expect(parsed.name).toBe('node-red-node-suncalc');
    expect(parsed.version).toBe('0.0.6');
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.nodes[0].types).toEqual(['sunrise']);
  });

  it('propagates 404 error from Node-RED API for unknown package', async () => {
    const client = {
      request: vi.fn().mockRejectedValueOnce(
        new Error('Node-RED API error: POST /nodes returned 404 — Module not found'),
      ),
    };

    await expect(
      handleInstallNode(client, { module: 'non-existent-package' }),
    ).rejects.toThrow('Node-RED API error: POST /nodes returned 404');
  });

  it('propagates 400 error from Node-RED API for bad request', async () => {
    const client = {
      request: vi.fn().mockRejectedValueOnce(
        new Error('Node-RED API error: POST /nodes returned 400 — Invalid module specifier'),
      ),
    };

    await expect(
      handleInstallNode(client, { module: 'package@1.0.0' }),
    ).rejects.toThrow('Node-RED API error: POST /nodes returned 400');
  });

  it('passes the module name exactly as provided to the API', async () => {
    const nodeModule = {
      name: 'node-red-contrib-telegrambot',
      version: '1.0.0',
      nodes: [{ id: 'tg/1', name: 'telegram', types: ['telegrambot'], enabled: true, loaded: true, module: 'node-red-contrib-telegrambot' }],
    };

    const client = {
      request: vi.fn().mockResolvedValueOnce(nodeModule),
    };

    await handleInstallNode(client, { module: 'node-red-contrib-telegrambot' });

    expect(client.request).toHaveBeenCalledWith('POST', '/nodes', {
      module: 'node-red-contrib-telegrambot',
    });
  });
});
