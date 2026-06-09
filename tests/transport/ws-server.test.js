import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WSServer } from '../../src/transport/ws-server.js';
import http from 'node:http';
import { createHash } from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function makeWsKey() {
  // Generate a random base64 key like a browser would
  return Buffer.from(Math.random().toString()).toString('base64');
}

function createUpgradeRequest(key) {
  return {
    headers: {
      'upgrade': 'websocket',
      'connection': 'upgrade',
      'sec-websocket-key': key,
      'sec-websocket-version': '13',
    },
    url: '/staging-ws',
    method: 'GET',
  };
}

describe('WSServer', () => {
  let httpServer;
  let wsServer;
  let getCurrentState;

  beforeEach(() => {
    httpServer = http.createServer();
    wsServer = new WSServer();
    getCurrentState = vi.fn().mockResolvedValue({
      flows: [{ id: 'n1', type: 'inject' }],
      dirtyNodeIds: new Set(),
      dirtyFlowIds: new Set(),
    });
    wsServer.attach(httpServer, getCurrentState);
  });

  afterEach(() => {
    httpServer.close();
  });

  it('attaches to HTTP server upgrade event', () => {
    expect(httpServer.listeners('upgrade').length).toBeGreaterThan(0);
  });

  it('accepts WebSocket upgrade for /staging-ws path', (done) => {
    const key = makeWsKey();
    const req = createUpgradeRequest(key);

    // Create a mock socket
    const socket = new (require('node:net').Socket)();
    socket.write = vi.fn();
    socket.destroy = vi.fn();

    // Emit upgrade manually
    const upgradeHandler = httpServer.listeners('upgrade')[0];
    httpServer.listen(0, () => {
      upgradeHandler(req, socket, Buffer.alloc(0));

      // Check for 101 response
      const written = socket.write.mock.calls;
      const responseText = written.map(c => c[0].toString()).join('');
      expect(responseText).toContain('101 Switching Protocols');
      expect(responseText).toContain('Upgrade: websocket');

      done();
    });
  });

  it('rejects upgrade for non-staging-ws path', (done) => {
    const key = makeWsKey();
    const req = createUpgradeRequest(key);
    req.url = '/other-path';

    const socket = new (require('node:net').Socket)();
    socket.write = vi.fn();
    socket.destroy = vi.fn();

    const upgradeHandler = httpServer.listeners('upgrade')[0];
    httpServer.listen(0, () => {
      upgradeHandler(req, socket, Buffer.alloc(0));
      expect(socket.destroy).toHaveBeenCalled();
      done();
    });
  });

  it('broadcast sends staging-update message to connected clients', (done) => {
    const key = makeWsKey();
    const req = createUpgradeRequest(key);

    const socket = new (require('node:net').Socket)();
    socket.write = vi.fn();
    socket.destroy = vi.fn();

    const upgradeHandler = httpServer.listeners('upgrade')[0];
    httpServer.listen(0, () => {
      upgradeHandler(req, socket, Buffer.alloc(0));

      // After handshake, broadcast
      setTimeout(() => {
        wsServer.broadcast({
          flows: [{ id: 'n1', type: 'inject' }],
          dirtyNodeIds: new Set(['n1']),
          dirtyFlowIds: new Set(),
        });

        // Check that a message was framed and sent
        const frames = socket.write.mock.calls.filter(
          c => c[0].length > 2 && c[0].readUInt8(0) !== 0x48 // exclude HTTP response
        );
        expect(frames.length).toBeGreaterThan(0);

        done();
      }, 100);
    });
  });

  it('handles multiple client connections', (done) => {
    const key1 = makeWsKey();
    const key2 = makeWsKey();

    const socket1 = new (require('node:net').Socket)();
    socket1.write = vi.fn();
    socket1.destroy = vi.fn();

    const socket2 = new (require('node:net').Socket)();
    socket2.write = vi.fn();
    socket2.destroy = vi.fn();

    const upgradeHandler = httpServer.listeners('upgrade')[0];
    httpServer.listen(0, () => {
      upgradeHandler(createUpgradeRequest(key1), socket1, Buffer.alloc(0));
      upgradeHandler(createUpgradeRequest(key2), socket2, Buffer.alloc(0));

      expect(socket1.destroy).not.toHaveBeenCalled();
      expect(socket2.destroy).not.toHaveBeenCalled();

      done();
    });
  });
});
