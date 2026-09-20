/**
 * Unit tests for the pure protocol layer of the comms client.
 *
 * These pin down Node-RED's frame shapes so the integration tests can focus on
 * sequencing and state. The critical property here is that unrecognized frames
 * are ignored rather than fatal — the previous implementation's Socket.IO
 * branches silently swallowed everything Node-RED actually sends.
 */

import { describe, it, expect } from 'vitest';
import { classifyFrame, buildWsUrl, CommsState } from '../../src/nodered/comms-client.js';

describe('buildWsUrl', () => {
  it('swaps the scheme and appends /comms', () => {
    expect(buildWsUrl('http://localhost:1880')).toBe('ws://localhost:1880/comms');
  });

  it('uses wss for https base URLs', () => {
    expect(buildWsUrl('https://nodered.example.com')).toBe('wss://nodered.example.com/comms');
  });

  it('tolerates a trailing slash', () => {
    expect(buildWsUrl('http://localhost:1880/')).toBe('ws://localhost:1880/comms');
  });

  it('adds no Engine.IO query parameters', () => {
    const url = buildWsUrl('http://localhost:1880');
    expect(url).not.toContain('EIO');
    expect(url).not.toContain('transport');
    expect(url).not.toContain('?');
  });

  it('never embeds a token in the query string', () => {
    const url = buildWsUrl('https://nodered.example.com');
    expect(url).not.toContain('access_token');
  });
});

describe('classifyFrame', () => {
  // ── events ───────────────────────────────────────────────────────
  it('classifies a single-event array frame', () => {
    const result = classifyFrame('[{"topic":"debug","data":{"id":"n1","msg":"42"}}]');
    expect(result).toEqual({
      type: 'events',
      events: [{ topic: 'debug', data: { id: 'n1', msg: '42' } }],
    });
  });

  it('classifies a multi-event array frame preserving order', () => {
    const frame = '[{"topic":"debug","data":{"msg":"a"}},{"topic":"hb","data":1},{"topic":"status/x","data":{}}]';
    const result = classifyFrame(frame);
    expect(result.type).toBe('events');
    expect(result.events).toHaveLength(3);
    expect(result.events.map((e) => e.topic)).toEqual(['debug', 'hb', 'status/x']);
  });

  it('returns an empty events list for an empty array', () => {
    expect(classifyFrame('[]')).toEqual({ type: 'events', events: [] });
  });

  it('skips array items that are not event envelopes', () => {
    const frame = '[null, 42, "str", [], {"noTopic":true},{"topic":"debug","data":{"msg":"ok"}}]';
    const result = classifyFrame(frame);
    expect(result.events).toEqual([{ topic: 'debug', data: { msg: 'ok' } }]);
  });

  it('preserves a data payload that is falsy or absent', () => {
    expect(classifyFrame('[{"topic":"debug","data":0}]').events[0].data).toBe(0);
    expect(classifyFrame('[{"topic":"debug","data":false}]').events[0].data).toBe(false);
    expect(classifyFrame('[{"topic":"debug"}]').events[0]).toEqual({ topic: 'debug', data: undefined });
  });

  // ── auth control ─────────────────────────────────────────────────
  it('classifies {"auth":"ok"} as a successful auth control frame', () => {
    expect(classifyFrame('{"auth":"ok"}')).toEqual({ type: 'auth', status: 'ok' });
  });

  it('classifies {"auth":"fail"} as a failed auth control frame', () => {
    expect(classifyFrame('{"auth":"fail"}')).toEqual({ type: 'auth', status: 'fail' });
  });

  it('treats any non-"ok" auth value as a failure', () => {
    expect(classifyFrame('{"auth":"maybe"}')).toEqual({ type: 'auth', status: 'fail' });
  });

  // ── ignored frames ───────────────────────────────────────────────
  it('ignores a bare Socket.IO "40" frame', () => {
    expect(classifyFrame('40')).toBeNull();
  });

  it('ignores a Socket.IO 42[...] frame', () => {
    expect(classifyFrame('42["subscribe","debug"]')).toBeNull();
  });

  it('ignores an Engine.IO open packet', () => {
    expect(classifyFrame('0{"sid":"abc","upgrades":[]}')).toBeNull();
  });

  it('ignores malformed JSON that starts like a frame', () => {
    expect(classifyFrame('[{"topic":')).toBeNull();
    expect(classifyFrame('{"auth":')).toBeNull();
  });

  it('ignores an object without an auth key', () => {
    expect(classifyFrame('{"foo":"bar"}')).toBeNull();
  });

  it('ignores a JSON primitive', () => {
    expect(classifyFrame('123')).toBeNull();
    expect(classifyFrame('true')).toBeNull();
    expect(classifyFrame('"hello"')).toBeNull();
  });

  it('ignores empty and non-string input', () => {
    expect(classifyFrame('')).toBeNull();
    expect(classifyFrame(null)).toBeNull();
    expect(classifyFrame(undefined)).toBeNull();
    expect(classifyFrame(Buffer.from('[{"topic":"debug"}]'))).toBeNull();
  });

  it('tolerates leading whitespace', () => {
    expect(classifyFrame('  [{"topic":"debug","data":1}]').type).toBe('events');
    expect(classifyFrame('\n{"auth":"ok"}')).toEqual({ type: 'auth', status: 'ok' });
  });
});

describe('CommsState', () => {
  it('exposes the documented lifecycle states', () => {
    expect(Object.values(CommsState).sort()).toEqual(
      ['authenticating', 'closed', 'connecting', 'idle', 'open', 'ready'].sort(),
    );
  });
});
