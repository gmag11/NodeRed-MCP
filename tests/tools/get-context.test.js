import { describe, it, expect, vi } from 'vitest';
import {
  buildGetContextPath,
  transformGetContextResponse,
  handleGetContext,
} from '../../src/tools/get-context.js';

// ---------------------------------------------------------------------------
// buildGetContextPath
// ---------------------------------------------------------------------------

describe('buildGetContextPath', () => {
  it('builds global context path with no id or key', () => {
    expect(buildGetContextPath('global', undefined, undefined)).toBe('/context/global');
  });

  it('builds global context path with a key', () => {
    expect(buildGetContextPath('global', undefined, 'counter')).toBe('/context/global?key=counter');
  });

  it('builds flow context path with id and key', () => {
    expect(buildGetContextPath('flow', 'flow-123', 'cache')).toBe('/context/flow/flow-123?key=cache');
  });

  it('builds node context path with id and no key', () => {
    expect(buildGetContextPath('node', 'node-abc', undefined)).toBe('/context/node/node-abc');
  });

  it('URL-encodes the key', () => {
    expect(buildGetContextPath('global', undefined, 'my key')).toBe('/context/global?key=my%20key');
  });
});

// ---------------------------------------------------------------------------
// transformGetContextResponse
// ---------------------------------------------------------------------------

describe('transformGetContextResponse', () => {
  it('returns { scope, key, value } for a single-key global query', () => {
    const result = transformGetContextResponse('global', undefined, 'counter', 42);
    expect(result).toEqual({ scope: 'global', key: 'counter', value: 42 });
  });

  it('includes id when scope is flow', () => {
    const result = transformGetContextResponse('flow', 'flow-1', 'state', 'running');
    expect(result).toEqual({ scope: 'flow', id: 'flow-1', key: 'state', value: 'running' });
  });

  it('returns { value: null } when the key does not exist (rawResponse is null)', () => {
    const result = transformGetContextResponse('global', undefined, 'missing', null);
    expect(result).toEqual({ scope: 'global', key: 'missing', value: null });
  });

  it('returns { value: null } when the key does not exist (rawResponse is undefined)', () => {
    const result = transformGetContextResponse('global', undefined, 'missing', undefined);
    expect(result).toEqual({ scope: 'global', key: 'missing', value: null });
  });

  it('returns { scope, values } for an all-keys query (no key)', () => {
    const allValues = { a: 1, b: 'hello' };
    const result = transformGetContextResponse('global', undefined, undefined, allValues);
    expect(result).toEqual({ scope: 'global', values: allValues });
  });

  it('includes id in all-keys result for flow scope', () => {
    const allValues = { x: 10 };
    const result = transformGetContextResponse('flow', 'flow-2', undefined, allValues);
    expect(result).toEqual({ scope: 'flow', id: 'flow-2', values: allValues });
  });
});

// ---------------------------------------------------------------------------
// handleGetContext
// ---------------------------------------------------------------------------

describe('handleGetContext', () => {
  it('reads a specific key from global context', async () => {
    const client = { request: vi.fn().mockResolvedValue(99) };

    const result = await handleGetContext(client, { scope: 'global', key: 'counter' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('GET', '/context/global?key=counter');
    expect(parsed).toEqual({ scope: 'global', key: 'counter', value: 99 });
  });

  it('reads all keys from flow context (no key param)', async () => {
    const allValues = { cache: {}, lastRun: 1234 };
    const client = { request: vi.fn().mockResolvedValue(allValues) };

    const result = await handleGetContext(client, { scope: 'flow', id: 'flow-abc' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('GET', '/context/flow/flow-abc');
    expect(parsed).toEqual({ scope: 'flow', id: 'flow-abc', values: allValues });
  });

  it('returns { value: null } when key does not exist', async () => {
    const client = { request: vi.fn().mockResolvedValue(null) };

    const result = await handleGetContext(client, { scope: 'global', key: 'missing' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.value).toBeNull();
  });

  it('returns error when id is missing for node scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleGetContext(client, { scope: 'node', key: 'state' })
    ).rejects.toThrow('id is required for scope "node"');
    expect(client.request).not.toHaveBeenCalled();
  });

  it('returns error when id is missing for flow scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleGetContext(client, { scope: 'flow', key: 'counter' })
    ).rejects.toThrow('id is required for scope "flow"');
    expect(client.request).not.toHaveBeenCalled();
  });
});
