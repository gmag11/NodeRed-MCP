import { describe, it, expect, vi } from 'vitest';
import {
  buildSetContextPath,
  buildSetContextBody,
  handleSetContext,
} from '../../src/tools/set-context.js';

// ---------------------------------------------------------------------------
// buildSetContextPath
// ---------------------------------------------------------------------------

describe('buildSetContextPath', () => {
  it('builds global context path', () => {
    expect(buildSetContextPath('global', undefined)).toBe('/context/global');
  });

  it('builds flow context path with id', () => {
    expect(buildSetContextPath('flow', 'flow-123')).toBe('/context/flow/flow-123');
  });

  it('builds node context path with id', () => {
    expect(buildSetContextPath('node', 'node-abc')).toBe('/context/node/node-abc');
  });
});

// ---------------------------------------------------------------------------
// buildSetContextBody
// ---------------------------------------------------------------------------

describe('buildSetContextBody', () => {
  it('builds single key-value body object', () => {
    expect(buildSetContextBody('counter', 12)).toEqual({ counter: 12 });
  });

  it('builds body with complex values', () => {
    const val = { nested: [1, 2, 3] };
    expect(buildSetContextBody('myKey', val)).toEqual({ myKey: val });
  });
});

// ---------------------------------------------------------------------------
// handleSetContext
// ---------------------------------------------------------------------------

describe('handleSetContext', () => {
  it('sets a global context key', async () => {
    const client = { request: vi.fn().mockResolvedValue({}) };

    const result = await handleSetContext(client, {
      scope: 'global',
      key: 'counter',
      value: 42,
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('PUT', '/context/global', { counter: 42 });
    expect(parsed).toEqual({
      scope: 'global',
      key: 'counter',
      value: 42,
      success: true,
    });
  });

  it('sets a flow context key', async () => {
    const client = { request: vi.fn().mockResolvedValue({}) };

    const result = await handleSetContext(client, {
      scope: 'flow',
      id: 'flow-1',
      key: 'cache',
      value: { data: 'test' },
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('PUT', '/context/flow/flow-1', {
      cache: { data: 'test' },
    });
    expect(parsed).toEqual({
      scope: 'flow',
      id: 'flow-1',
      key: 'cache',
      value: { data: 'test' },
      success: true,
    });
  });

  it('sets a node context key', async () => {
    const client = { request: vi.fn().mockResolvedValue({}) };

    const result = await handleSetContext(client, {
      scope: 'node',
      id: 'node-abc',
      key: 'state',
      value: 'active',
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(client.request).toHaveBeenCalledWith('PUT', '/context/node/node-abc', {
      state: 'active',
    });
    expect(parsed).toEqual({
      scope: 'node',
      id: 'node-abc',
      key: 'state',
      value: 'active',
      success: true,
    });
  });

  it('returns error when id is missing for node scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleSetContext(client, { scope: 'node', key: 'state', value: 1 })
    ).rejects.toThrow('id is required for scope "node"');
    expect(client.request).not.toHaveBeenCalled();
  });

  it('returns error when id is missing for flow scope', async () => {
    const client = { request: vi.fn() };

    await expect(
      handleSetContext(client, { scope: 'flow', key: 'counter', value: 2 })
    ).rejects.toThrow('id is required for scope "flow"');
    expect(client.request).not.toHaveBeenCalled();
  });
});
