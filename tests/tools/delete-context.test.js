import { describe, it, expect, vi } from 'vitest';
import {
  buildDeleteContextPath,
  handleDeleteContext,
} from '../../src/tools/delete-context.js';

// ---------------------------------------------------------------------------
// buildDeleteContextPath
// ---------------------------------------------------------------------------

describe('buildDeleteContextPath', () => {
  it('builds global context path with key', () => {
    expect(buildDeleteContextPath('global', undefined, 'counter')).toBe('/context/global/counter');
  });

  it('builds flow context path with id and key', () => {
    expect(buildDeleteContextPath('flow', 'flow-123', 'cache')).toBe('/context/flow/flow-123/cache');
  });

  it('builds node context path with id and key', () => {
    expect(buildDeleteContextPath('node', 'node-abc', 'state')).toBe('/context/node/node-abc/state');
  });

  it('URL-encodes the key', () => {
    expect(buildDeleteContextPath('global', undefined, 'my key')).toBe('/context/global/my%20key');
  });
});

// ---------------------------------------------------------------------------
// handleDeleteContext
// ---------------------------------------------------------------------------

describe('handleDeleteContext', () => {
  it('deletes a key from global context', async () => {
    const client = { request: vi.fn().mockResolvedValue(null) };

    const result = await handleDeleteContext(client, { scope: 'global', key: 'counter' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('DELETE', '/context/global/counter');
    expect(parsed).toEqual({ scope: 'global', key: 'counter', deleted: true });
  });

  it('deletes a key from flow context', async () => {
    const client = { request: vi.fn().mockResolvedValue(null) };

    const result = await handleDeleteContext(client, { scope: 'flow', id: 'flow-1', key: 'cache' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('DELETE', '/context/flow/flow-1/cache');
    expect(parsed).toEqual({ scope: 'flow', id: 'flow-1', key: 'cache', deleted: true });
  });

  it('deletes a key from node context', async () => {
    const client = { request: vi.fn().mockResolvedValue(null) };

    const result = await handleDeleteContext(client, { scope: 'node', id: 'node-xyz', key: 'state' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('DELETE', '/context/node/node-xyz/state');
    expect(parsed).toEqual({ scope: 'node', id: 'node-xyz', key: 'state', deleted: true });
  });

  it('returns error when id is missing for node scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleDeleteContext(client, { scope: 'node', key: 'state' }),
    ).rejects.toThrow('id is required for scope "node"');
  });

  it('returns error when id is missing for flow scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleDeleteContext(client, { scope: 'flow', key: 'cache' }),
    ).rejects.toThrow('id is required for scope "flow"');
  });
});
