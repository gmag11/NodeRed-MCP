/**
 * Tests for the read-debug-messages handler's connection-state reporting.
 *
 * The original incident lasted hours because `{ messages: [], total: 0 }` was
 * identical for "connected and idle" and "not receiving anything at all".
 * These tests pin down that the two states are now distinguishable.
 */

import { describe, it, expect, vi } from 'vitest';
import { handleReadDebugMessages, buildDiagnostic } from '../../src/tools/read-debug-messages.js';
import { DebugMessagesResponseSchema, CommsConnectionStateSchema } from '../../src/schemas/responses.js';

/** Minimal fake comms client with a controllable connection state. */
function makeClient({ messages = [], state = 'ready', bufferSize = 500, ready = true } = {}) {
  const connection = {
    state,
    ready,
    authenticated: ready && state === 'ready',
    subscribed: ready && state === 'ready',
    lastAuthOutcome: state === 'ready' ? 'ok' : null,
  };
  return {
    getMessages: () => messages,
    get bufferSize() { return bufferSize; },
    getConnectionState: () => connection,
  };
}

/** Extract the parsed payload from a formatSuccess response. */
function payload(response) {
  return JSON.parse(response.content[0].text);
}

describe('buildDiagnostic', () => {
  it('returns undefined for a ready connection (idle is a valid state)', () => {
    expect(buildDiagnostic({ state: 'ready', ready: true, lastAuthOutcome: 'ok' })).toBeUndefined();
  });

  it('explains an auth rejection with the env vars to check', () => {
    const note = buildDiagnostic({ state: 'authenticating', ready: false, lastAuthOutcome: 'fail' });
    expect(note).toMatch(/rejected authentication/);
    expect(note).toMatch(/NODERED_API_KEY/);
  });

  it('explains an in-progress connection', () => {
    expect(buildDiagnostic({ state: 'connecting', ready: false, lastAuthOutcome: null }))
      .toMatch(/still connecting/);
  });

  it('explains a closed connection', () => {
    expect(buildDiagnostic({ state: 'closed', ready: false, lastAuthOutcome: null }))
      .toMatch(/closed/);
  });

  it('explains an idle client', () => {
    expect(buildDiagnostic({ state: 'idle', ready: false, lastAuthOutcome: null }))
      .toMatch(/has not been connected/);
  });

  it('handles a pending authentication without a recorded failure', () => {
    expect(buildDiagnostic({ state: 'authenticating', ready: false, lastAuthOutcome: null }))
      .toMatch(/authenticating/);
  });

  it('prioritises the auth-failure explanation over the closed state', () => {
    // This is the state actually observed against a live instance with a bad
    // key: Node-RED closes the socket, so state is 'closed' but the real cause
    // is the rejected token. The auth message must win.
    const note = buildDiagnostic({ state: 'closed', ready: false, lastAuthOutcome: 'fail' });
    expect(note).toMatch(/rejected authentication/);
    expect(note).not.toMatch(/is closed/);
  });

  it('handles a missing connection object defensively', () => {
    expect(buildDiagnostic(undefined)).toBeUndefined();
  });
});

describe('handleReadDebugMessages connection reporting', () => {
  it('includes a ready connection state for a ready client', async () => {
    const client = makeClient({ messages: [{ id: 'n1', msg: 'hi', timestamp: 1 }] });
    const result = await handleReadDebugMessages(client)({});
    const data = payload(result);

    expect(data.connection).toEqual({
      state: 'ready',
      ready: true,
      authenticated: true,
      subscribed: true,
      lastAuthOutcome: 'ok',
    });
    expect(data.total).toBe(1);
    expect(data.bufferSize).toBe(500);
    expect(data.diagnostic).toBeUndefined();
  });

  it('returns an empty list WITHOUT a diagnostic for a ready idle client', async () => {
    const client = makeClient({ messages: [] });
    const data = payload(await handleReadDebugMessages(client)({}));

    expect(data.messages).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.connection.ready).toBe(true);
    expect(data.diagnostic).toBeUndefined();
  });

  it('returns an empty list WITH a diagnostic for a disconnected client', async () => {
    const client = makeClient({ messages: [], state: 'closed', ready: false });
    const data = payload(await handleReadDebugMessages(client)({}));

    expect(data.messages).toEqual([]);
    expect(data.connection.ready).toBe(false);
    expect(data.diagnostic).toBeDefined();
    expect(data.diagnostic).toMatch(/closed/);
  });

  it('reports an auth failure distinctly', async () => {
    const client = makeClient({ messages: [], state: 'authenticating', ready: false });
    client.getConnectionState = () => ({
      state: 'authenticating',
      ready: false,
      authenticated: false,
      subscribed: false,
      lastAuthOutcome: 'fail',
    });

    const data = payload(await handleReadDebugMessages(client)({}));
    expect(data.diagnostic).toMatch(/rejected authentication/);
    expect(data.connection.lastAuthOutcome).toBe('fail');
  });

  it('still applies filters for a ready client', async () => {
    const messages = [
      { id: 'a', name: 'A', msg: { v: 1 }, timestamp: 100 },
      { id: 'b', name: 'B', msg: { v: 2 }, timestamp: 200 },
    ];
    const client = makeClient({ messages });
    const data = payload(await handleReadDebugMessages(client)({ nodeId: 'b' }));

    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].id).toBe('b');
    expect(data.connection.ready).toBe(true);
  });

  it('includes connection state alongside a filter error', async () => {
    const client = makeClient({ messages: [] });
    const data = payload(await handleReadDebugMessages(client)({ last: 1, limit: 1 }));

    expect(data.error).toMatch(/mutually exclusive/);
    expect(data.connection.state).toBe('ready');
  });

  it('does not crash when the client lacks getConnectionState', async () => {
    const stub = {
      getMessages: () => [],
      get bufferSize() { return 10; },
    };
    const data = payload(await handleReadDebugMessages(stub)({}));
    expect(data.messages).toEqual([]);
    expect(data.connection).toBeDefined();
  });
});

describe('DebugMessagesResponseSchema', () => {
  it('validates a ready response with connection state', () => {
    const result = DebugMessagesResponseSchema.safeParse({
      messages: [{ id: 'n1', msg: 'x' }],
      total: 1,
      bufferSize: 500,
      connection: { state: 'ready', ready: true, authenticated: true, subscribed: true, lastAuthOutcome: 'ok' },
    });
    expect(result.success).toBe(true);
  });

  it('validates a disconnected response with a diagnostic', () => {
    const result = DebugMessagesResponseSchema.safeParse({
      messages: [],
      total: 0,
      bufferSize: 500,
      connection: { state: 'closed', ready: false, authenticated: false, subscribed: false, lastAuthOutcome: null },
      diagnostic: 'socket closed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown connection state', () => {
    const result = CommsConnectionStateSchema.safeParse({
      state: 'bogus', ready: false, authenticated: false, subscribed: false, lastAuthOutcome: null,
    });
    expect(result.success).toBe(false);
  });

  it('requires the connection field', () => {
    const result = DebugMessagesResponseSchema.safeParse({
      messages: [], total: 0, bufferSize: 500,
    });
    expect(result.success).toBe(false);
  });
});
