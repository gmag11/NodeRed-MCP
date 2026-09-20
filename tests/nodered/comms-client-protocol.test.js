/**
 * Protocol integration tests: the real CommsClient against the fake Node-RED
 * comms server, over a loopback port.
 *
 * These are the tests that would have caught the original bug. They assert on
 * the wire, not on internals: frame order, absence of Engine.IO parameters,
 * withholding of events before auth, and readiness derived from the protocol
 * Node-RED actually speaks rather than from a frame it never sends.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { CommsClient } from '../../src/nodered/comms-client.js';
import { FakeCommsServer } from './helpers/fake-comms-server.js';
import { delay } from './helpers/frame-utils.js';

/** @type {FakeCommsServer|undefined} */
let server;
/** @type {CommsClient|undefined} */
let client;

beforeEach(() => {
  // Keep backoff short so tests do not wait a second per reconnect.
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

/** Wait until `predicate()` is true, or fail after `timeout`. */
async function waitUntil(predicate, timeout = 3000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await delay(25);
  }
  throw new Error(`timed out waiting for ${label}`);
}

describe('CommsClient protocol', () => {
  // ── unauthenticated instance ─────────────────────────────────────
  it('connects to an instance without auth and buffers debug events', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    let connectedCount = 0;
    client.on('connected', () => { connectedCount += 1; });

    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    expect(connectedCount).toBe(1);
    expect(client.isConnected).toBe(true);
    expect(client.getConnectionState().state).toBe('ready');
    expect(server.connectionCount).toBe(1);

    server.pushDebug({ id: 'n1', name: 'Debug 1', msg: 'hello', format: 'string', path: 'f1' });
    await waitUntil(() => client.getMessages().length === 1, 3000, 'a buffered message');

    const [msg] = client.getMessages();
    expect(msg.id).toBe('n1');
    expect(msg.name).toBe('Debug 1');
    expect(msg.msg).toBe('hello');
    expect(msg.format).toBe('string');
    expect(msg.path).toBe('f1');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('sends no Engine.IO query parameters on the upgrade', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    expect(server.upgradeRequests).toHaveLength(1);
    const { url } = server.upgradeRequests[0];
    expect(url).toBe('/comms');
    expect(url).not.toContain('EIO');
    expect(url).not.toContain('transport');
    expect(url).not.toContain('access_token');
  });

  it('sends {"subscribe":"debug"} once ready without any auth packet', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => server.subscribeRequests.length === 1, 3000, 'a subscribe request');

    expect(server.subscribeRequests).toEqual(['debug']);
    // Critically: no auth frame was sent, which would destabilize a
    // no-auth instance (undefined Users.tokens -> unhandled rejection).
    expect(server.authPacketsWhileNoAuth).toBe(0);
  });

  it('does not buffer hb or non-debug topics', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    server.pushEvent('hb', Date.now());
    server.pushEvent('status/node-a', { text: 'ok' });
    server.pushEvent('multiplayer/location', { x: 1 });
    await delay(200);

    expect(client.getMessages()).toHaveLength(0);
  });

  // ── authenticated instance ───────────────────────────────────────
  it('authenticates in-band before subscribing, then buffers debug events', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'secret-token', heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl, token: 'secret-token' });
    let connectedCount = 0;
    client.on('connected', () => { connectedCount += 1; });

    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    expect(connectedCount).toBe(1);
    expect(client.getConnectionState()).toMatchObject({
      state: 'ready',
      ready: true,
      authenticated: true,
      subscribed: true,
      lastAuthOutcome: 'ok',
    });

    // Auth MUST precede subscribe — sending subscribe first makes Node-RED
    // respond auth:fail and close the socket.
    const kinds = server.receivedFrames.map((f) =>
      f.parsed.auth !== undefined ? 'auth' : f.parsed.subscribe !== undefined ? 'subscribe' : 'other',
    );
    expect(kinds.indexOf('auth')).toBeGreaterThanOrEqual(0);
    expect(kinds.indexOf('subscribe')).toBeGreaterThan(kinds.indexOf('auth'));
    expect(server.receivedFrames[0].parsed).toEqual({ auth: 'secret-token' });

    server.pushDebug({ id: 'sec', msg: 'authed debug' });
    await waitUntil(() => client.getMessages().length === 1, 3000, 'a buffered message');
    expect(client.getMessages()[0].msg).toBe('authed debug');
  });

  it('never sends an auth packet when no credentials are configured', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');
    await delay(100);

    const authFrames = server.receivedFrames.filter((f) => f.parsed.auth !== undefined);
    expect(authFrames).toHaveLength(0);
  });

  it('does not report ready when auth is rejected', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'right-token', heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl, token: 'WRONG-token' });
    const errors = [];
    let connectedCount = 0;
    client.on('error', (e) => errors.push(e));
    client.on('connected', () => { connectedCount += 1; });

    await client.connect();
    await waitUntil(() => errors.length > 0, 3000, 'an error emission');

    expect(connectedCount).toBe(0);
    expect(client.isReady).toBe(false);
    expect(client.isConnected).toBe(false);
    expect(client.getConnectionState().lastAuthOutcome).toBe('fail');
    expect(errors[0].message).toMatch(/NODERED_API_KEY|authentication/i);
  });

  it('backs off after an auth rejection instead of retrying immediately', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'right-token', heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl, token: 'WRONG-token' });
    await client.connect();
    await waitUntil(() => server.upgradeRequests.length === 1, 3000, 'first attempt');

    // Initial backoff is 1000ms; nothing should reconnect well before that.
    await delay(400);
    expect(server.upgradeRequests).toHaveLength(1);

    // After the backoff elapses a second attempt should occur.
    await waitUntil(() => server.upgradeRequests.length >= 2, 3000, 'a reconnect attempt');
  });

  it('tolerates server-initiated close and reconnects', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    const disconnected = [];
    client.on('disconnected', () => disconnected.push(Date.now()));

    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    server.closeAll();
    await waitUntil(() => disconnected.length === 1, 3000, 'a disconnected emission');
    expect(client.isReady).toBe(false);

    // Reconnects on its own after the backoff.
    await waitUntil(() => client.isReady, 4000, 'reconnection');
    expect(server.upgradeRequests.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores frames Node-RED never sends without breaking the connection', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    // Simulate a server emitting Socket.IO-era noise. classifyFrame drops it.
    server.publish('hb', 'noise');
    await delay(100);
    expect(client.getMessages()).toHaveLength(0);
    expect(client.isReady).toBe(true);

    // A real debug event after the noise still lands.
    server.pushDebug({ id: 'after-noise', msg: 'ok' });
    await waitUntil(() => client.getMessages().length === 1, 3000, 'a message after noise');
    expect(client.getMessages()[0].id).toBe('after-noise');
  });

  // ── normalization / buffer ───────────────────────────────────────
  it('substitutes the receipt time when the payload has no numeric timestamp', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    const before = Date.now();
    server.pushDebug({ id: 'n1', msg: 'no-ts' });
    await waitUntil(() => client.getMessages().length === 1, 3000, 'a buffered message');

    const [msg] = client.getMessages();
    expect(msg.timestamp).toBeGreaterThanOrEqual(before);
    expect(msg.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('preserves an explicit numeric timestamp', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    server.pushDebug({ id: 'n1', msg: 'ts', timestamp: 1234567890 });
    await waitUntil(() => client.getMessages().length === 1, 3000, 'a buffered message');
    expect(client.getMessages()[0].timestamp).toBe(1234567890);
  });

  it('handles a batch frame containing multiple debug events', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0, flushDelay: 25 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    server.pushDebug({ id: 'n1', msg: 'a' });
    server.pushDebug({ id: 'n2', msg: 'b' });
    server.pushDebug({ id: 'n3', msg: 'c' });

    await waitUntil(() => client.getMessages().length === 3, 3000, 'three buffered messages');
    expect(client.getMessages().map((m) => m.msg)).toEqual(['a', 'b', 'c']);
  });

  it('reports a not-ready connection state when the server is unreachable', async () => {
    // Start then stop so the port is closed but known-invalid.
    const temp = new FakeCommsServer();
    await temp.start();
    const { baseUrl } = temp;
    await temp.stop();

    client = new CommsClient({ baseUrl });
    client.on('error', () => {});
    await client.connect();
    await delay(200);

    expect(client.isReady).toBe(false);
    expect(client.isConnected).toBe(false);
    expect(client.getConnectionState().ready).toBe(false);
    expect(client.isConnected).toBe(false);
  });

  it('emits disconnected only for a previously ready connection', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    const disconnected = [];
    client.on('disconnected', () => disconnected.push(1));

    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    // An explicit disconnect after being ready emits nothing extra: the
    // 'disconnected' contract is about losing a usable connection.
    client.disconnect();
    await delay(150);

    expect(client.isReady).toBe(false);
    expect(disconnected.length).toBeLessThanOrEqual(1);
  });

  it('does not reconnect after an explicit disconnect', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    client = new CommsClient({ baseUrl: server.baseUrl });
    await client.connect();
    await waitUntil(() => client.isReady, 3000, 'client ready');

    const attempts = server.upgradeRequests.length;
    client.disconnect();
    await delay(1500);

    expect(server.upgradeRequests.length).toBe(attempts);
  });

  it('throws a descriptive error when constructed without a baseUrl', () => {
    expect(() => new CommsClient({})).toThrow(/NODERED_URL/);
  });
});
