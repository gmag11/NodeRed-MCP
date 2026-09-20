/**
 * Tests for the credentials-based auth path of the comms client.
 *
 * When credentials (rather than a static API key) are configured, the client
 * must fetch a token via the auth module and must discard it after a failure so
 * a stale token is not retried indefinitely.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

// Mock the auth module BEFORE importing the client, so the client picks up the
// mocked getToken.
const getTokenMock = vi.fn();
vi.mock('../../src/nodered/auth.js', () => ({
  getToken: (...args) => getTokenMock(...args),
}));

const { CommsClient } = await import('../../src/nodered/comms-client.js');
const { FakeCommsServer } = await import('./helpers/fake-comms-server.js');
const { delay } = await import('./helpers/frame-utils.js');

/** @type {FakeCommsServer|undefined} */
let server;
/** @type {CommsClient|undefined} */
let client;

beforeEach(() => {
  getTokenMock.mockReset();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(async () => {
  if (client) {
    client.disconnect();
    client = undefined;
  }
  if (server) {
    await server.stop();
    server = undefined;
  }
  vi.useRealTimers();
});

async function waitUntil(predicate, timeout = 3000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await delay(25);
  }
  throw new Error(`timed out waiting for ${label}`);
}

describe('CommsClient credentials auth', () => {
  it('fetches a token before opening the socket, then authenticates in-band', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'fetched-token', heartbeatInterval: 0 });
    await server.start();
    getTokenMock.mockResolvedValue('fetched-token');

    client = new CommsClient({
      baseUrl: server.baseUrl,
      username: 'admin',
      password: 'secret',
    });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    expect(getTokenMock).toHaveBeenCalledWith(server.baseUrl, 'admin', 'secret');
    // The fetched token must be what the socket presents.
    expect(server.receivedFrames[0].parsed).toEqual({ auth: 'fetched-token' });
    expect(client.getConnectionState().lastAuthOutcome).toBe('ok');
  });

  it('does not open a socket when the token fetch fails, and schedules a retry', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'token', heartbeatInterval: 0 });
    await server.start();
    getTokenMock.mockRejectedValue(new Error('bad credentials'));

    client = new CommsClient({
      baseUrl: server.baseUrl,
      username: 'admin',
      password: 'wrong',
    });
    const errors = [];
    client.on('error', (e) => errors.push(e));

    await client.connect();
    await waitUntil(() => errors.length === 1, 3000, 'an error emission');

    expect(errors[0].message).toBe('bad credentials');
    expect(server.upgradeRequests).toHaveLength(0);
    expect(client.isReady).toBe(false);
    expect(client.getConnectionState().state).toBe('closed');
  });

  it('discards a credentials-derived token after an auth failure and refetches', async () => {
    // The server accepts only the SECOND token, proving the client refetched
    // rather than reusing the rejected one.
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'fresh-token', heartbeatInterval: 0 });
    await server.start();

    getTokenMock
      .mockResolvedValueOnce('stale-token')
      .mockResolvedValueOnce('fresh-token');

    client = new CommsClient({
      baseUrl: server.baseUrl,
      username: 'admin',
      password: 'secret',
    });
    client.on('error', () => {});

    await client.connect();

    // First attempt presents the stale token, which the fake rejects.
    await waitUntil(() => server.receivedFrames.length >= 1, 3000, 'the first auth frame');
    expect(server.receivedFrames[0].parsed).toEqual({ auth: 'stale-token' });
    expect(client.isReady).toBe(false);

    // After the backoff, the client must fetch a NEW token and succeed.
    await waitUntil(() => client.isReady, 5000, 'readiness after refetch');

    expect(getTokenMock).toHaveBeenCalledTimes(2);
    const authFrames = server.receivedFrames
      .filter((f) => f.parsed.auth !== undefined)
      .map((f) => f.parsed.auth);
    expect(authFrames).toContain('stale-token');
    expect(authFrames).toContain('fresh-token');
  });

  it('does not refetch a static API key (it is reused across attempts)', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'never-matches', heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl, token: 'static-key' });
    client.on('error', () => {});

    await client.connect();
    await waitUntil(() => server.receivedFrames.length >= 1, 3000, 'the first auth frame');
    await waitUntil(() => server.receivedFrames.length >= 2, 4000, 'a second attempt');

    // The static key must be presented again unchanged, and getToken never called.
    const keys = server.receivedFrames.filter((f) => f.parsed.auth !== undefined).map((f) => f.parsed.auth);
    expect(keys.every((k) => k === 'static-key')).toBe(true);
    expect(getTokenMock).not.toHaveBeenCalled();
  });
});
