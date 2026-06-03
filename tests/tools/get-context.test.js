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
    expect(buildGetContextPath('global', undefined, 'counter')).toBe('/context/global/counter');
  });

  it('builds flow context path with id and key', () => {
    expect(buildGetContextPath('flow', 'flow-123', 'cache')).toBe('/context/flow/flow-123/cache');
  });

  it('builds node context path with id and no key', () => {
    expect(buildGetContextPath('node', 'node-abc', undefined)).toBe('/context/node/node-abc');
  });

  it('URL-encodes the key', () => {
    expect(buildGetContextPath('global', undefined, 'my key')).toBe('/context/global/my%20key');
  });
});

// ---------------------------------------------------------------------------
// transformGetContextResponse
// ---------------------------------------------------------------------------

describe('transformGetContextResponse', () => {
  it('returns { [key]: value } for a single-key query', () => {
    const result = transformGetContextResponse('counter', 42);
    expect(result).toEqual({ counter: 42 });
  });

  it('returns { [key]: value } for string value', () => {
    const result = transformGetContextResponse('state', 'running');
    expect(result).toEqual({ state: 'running' });
  });

  it('returns { [key]: null } when the key does not exist (rawResponse is null)', () => {
    const result = transformGetContextResponse('missing', null);
    expect(result).toEqual({ missing: null });
  });

  it('returns { [key]: null } when the key does not exist (rawResponse is undefined)', () => {
    const result = transformGetContextResponse('missing', undefined);
    expect(result).toEqual({ missing: null });
  });

  it('returns the raw key-value object for an all-keys query (no key)', () => {
    const result = transformGetContextResponse(undefined, { a: 1, b: 'hello' });
    expect(result).toEqual({ a: 1, b: 'hello' });
  });

  it('returns empty object when scope has no keys', () => {
    const result = transformGetContextResponse(undefined, {});
    expect(result).toEqual({});
  });

  it('returns empty object when rawResponse is null (all-keys query)', () => {
    const result = transformGetContextResponse(undefined, null);
    expect(result).toEqual({});
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

    expect(client.request).toHaveBeenCalledWith('GET', '/context/global/counter');
    expect(parsed).toEqual({ counter: 99 });
  });

  it('reads all keys from flow context (no key param)', async () => {
    const client = { request: vi.fn().mockResolvedValue({ cache: {}, lastRun: 1234 }) };

    const result = await handleGetContext(client, { scope: 'flow', id: 'flow-abc' });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('GET', '/context/flow/flow-abc');
    expect(parsed).toEqual({ cache: {}, lastRun: 1234 });
  });

  it('returns { [key]: null } when key does not exist', async () => {
    const client = { request: vi.fn().mockResolvedValue(null) };

    const result = await handleGetContext(client, { scope: 'global', key: 'missing' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toEqual({ missing: null });
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
