/**
 * Smoke tests for the fake Node-RED comms server itself.
 *
 * These validate that the fake faithfully reproduces Node-RED's behaviour
 * BEFORE it is used to judge the client. If the fake is wrong, every protocol
 * test built on it is worthless.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { FakeCommsServer } from './helpers/fake-comms-server.js';
import { openSocket, recordFrames, delay, debugEvents, authOutcomes } from './helpers/frame-utils.js';

/** @type {FakeCommsServer|undefined} */
let server;

afterEach(async () => {
  if (server) {
    await server.stop();
    server = undefined;
  }
});

describe('FakeCommsServer', () => {
  // ── 1.1 file exists, importable, no side effects ──────────────────
  it('can be constructed without opening a socket or timer', () => {
    const s = new FakeCommsServer();
    expect(s.port).toBeNull();
    expect(s.connectionCount).toBe(0);
    expect(s.upgradeRequests).toEqual([]);
    expect(s.receivedFrames).toEqual([]);
  });

  it('starts on a loopback port and exposes a ws url', async () => {
    server = new FakeCommsServer();
    const baseUrl = await server.start();
    expect(baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(server.wsUrl).toBe(`ws://127.0.0.1:${server.port}/comms`);
  });

  // ── 1.2 records upgrade URL and received frames ───────────────────
  it('records the upgrade request URL and received frames', async () => {
    server = new FakeCommsServer();
    await server.start();

    const ws = await openSocket(server.wsUrl);
    ws.send(JSON.stringify({ subscribe: 'debug' }));
    await delay(150);

    expect(server.upgradeRequests).toHaveLength(1);
    expect(server.upgradeRequests[0].url).toBe('/comms');
    expect(server.upgradeRequests[0].headers).toHaveProperty('sec-websocket-key');

    expect(server.receivedFrames).toHaveLength(1);
    expect(server.receivedFrames[0].parsed).toEqual({ subscribe: 'debug' });
    expect(server.subscribeRequests).toEqual(['debug']);

    ws.close();
  });

  it('ignores upgrades on paths other than the comms path', async () => {
    server = new FakeCommsServer({ path: '/comms' });
    await server.start();

    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/other`);
    await new Promise((resolve) => {
      ws.on('error', resolve);
      ws.on('close', resolve);
      ws.on('open', resolve);
      setTimeout(resolve, 800);
    });
    // The upgrade for a non-comms path is never handed to the ws server.
    // Node-RED deliberately leaves the socket untouched rather than
    // destroying it, so no upgrade record and no HTTP response are produced.
    expect(server.upgradeRequests).toHaveLength(0);
    ws.terminate();
  });

  it('records malformed frames instead of throwing', async () => {
    server = new FakeCommsServer();
    await server.start();

    const ws = await openSocket(server.wsUrl);
    ws.send('42["subscribe","debug"]'); // Socket.IO framing — not JSON
    await delay(150);

    expect(server.malformedFrames).toEqual(['42["subscribe","debug"]']);
    expect(server.receivedFrames).toHaveLength(0);

    ws.close();
  });

  // ── 1.3 auth gate matches Node-RED semantics ──────────────────────
  it('withholds all events before auth when auth is required', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'good-token' });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    await delay(150);

    // Not registered yet — publish() iterates connections[], which is empty.
    expect(server.connectionCount).toBe(0);

    server.pushDebug({ id: 'n1', msg: 'before-auth' });
    await delay(250);

    expect(rec.frames).toEqual([]);
    ws.close();
  });

  it('delivers events after a valid auth packet', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'good-token' });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);

    ws.send(JSON.stringify({ auth: 'good-token' }));
    await rec.waitFor((ev) => authOutcomes(ev).includes('ok'));
    expect(server.connectionCount).toBe(1);

    server.pushDebug({ id: 'n1', msg: 'after-auth' });
    await rec.waitFor((ev) => debugEvents(ev).length > 0);

    expect(debugEvents(rec.events)[0].data.msg).toBe('after-auth');
    ws.close();
  });

  it('answers a valid auth packet with {"auth":"ok"}', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'good-token' });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    ws.send(JSON.stringify({ auth: 'good-token' }));

    await rec.waitFor((ev) => authOutcomes(ev).includes('ok'));
    expect(authOutcomes(rec.events)).toContain('ok');
    ws.close();
  });

  it('rejects a bad auth packet with {"auth":"fail"} and closes the socket', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'good-token' });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    ws.send(JSON.stringify({ auth: 'WRONG' }));

    await rec.waitFor((ev) => authOutcomes(ev).includes('fail'));
    expect(authOutcomes(rec.events)).toContain('fail');
    expect(server.connectionCount).toBe(0);
  });

  it('closes the socket when a non-auth message arrives while pending auth', async () => {
    server = new FakeCommsServer({ requireAuth: true, acceptToken: 'good-token' });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);

    // Mirrors comms.js: subscribe before auth falls through to the
    // anonymous path, which ends in auth fail + close.
    ws.send(JSON.stringify({ subscribe: 'debug' }));

    await rec.waitFor((ev) => authOutcomes(ev).includes('fail'));
    expect(authOutcomes(rec.events)).toContain('fail');
  });

  it('records auth packets received while auth is NOT required', async () => {
    server = new FakeCommsServer({ requireAuth: false });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    ws.send(JSON.stringify({ auth: 'unexpected-token' }));
    await delay(150);

    // Real Node-RED would hit an undefined Users.tokens here and die.
    expect(server.authPacketsWhileNoAuth).toBe(1);
    ws.close();
  });

  it('registers the connection immediately when auth is not required', async () => {
    server = new FakeCommsServer({ requireAuth: false });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    await delay(150);
    expect(server.connectionCount).toBe(1);
    ws.close();
  });

  // ── 1.4 heartbeat emitter ─────────────────────────────────────────
  it('emits hb topic events on the heartbeat interval', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 60 });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    await rec.waitFor((ev) => ev.some((e) => e.topic === 'hb'), 1500);

    expect(rec.events.some((e) => e.topic === 'hb')).toBe(true);
    ws.close();
  });

  it('does not emit heartbeats when the interval is 0', async () => {
    server = new FakeCommsServer({ requireAuth: false, heartbeatInterval: 0 });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    await delay(300);
    expect(rec.events.some((e) => e.topic === 'hb')).toBe(false);
    ws.close();
  });

  // ── retained topics / subscribe semantics ─────────────────────────
  it('replays retained topics on subscribe but does not gate live events', async () => {
    server = new FakeCommsServer({ requireAuth: false });
    await server.start();

    server.publish('status/node-a', { text: 'ok' }, true);

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);
    await delay(100);

    // Live event delivered WITHOUT any subscribe request, proving that
    // subscribe is not what enables event delivery.
    server.pushEvent('live', { value: 1 });
    await rec.waitFor((ev) => ev.some((e) => e.topic === 'live'));

    // Retained topic only replays after an explicit subscribe.
    ws.send(JSON.stringify({ subscribe: 'status/#' }));
    await rec.waitFor((ev) => ev.some((e) => e.topic === 'status/node-a'));

    expect(rec.events.some((e) => e.topic === 'status/node-a')).toBe(true);
    ws.close();
  });

  it('batches multiple events into a single JSON array frame', async () => {
    server = new FakeCommsServer({ requireAuth: false, flushDelay: 30 });
    await server.start();

    const ws = await openSocket(server.wsUrl);
    const rec = recordFrames(ws);

    server.pushDebug({ id: 'n1', msg: 'a' });
    server.pushDebug({ id: 'n1', msg: 'b' });
    server.pushDebug({ id: 'n1', msg: 'c' });

    await rec.waitFor((ev) => debugEvents(ev).length >= 3);

    // At least one frame must be an array carrying more than one envelope.
    expect(rec.frames.some((f) => Array.isArray(f) && f.length > 1)).toBe(true);
    ws.close();
  });

  it('stops cleanly and releases resources', async () => {
    server = new FakeCommsServer();
    await server.start();
    expect(server.port).toBeGreaterThan(0);
    await server.stop();
    server = undefined;

    // A second server must start without port conflicts.
    const second = new FakeCommsServer();
    await second.start();
    expect(second.port).toBeGreaterThan(0);
    await second.stop();
  });
});
