/**
 * In-process fake of Node-RED's `/comms` WebSocket server.
 *
 * This is NOT a mock of our client — it is a faithful re-implementation of
 * Node-RED's server-side behaviour, derived from the Node-RED 5.0.7 source.
 * Every mirrored behaviour is annotated with the source it comes from, so the
 * contract stays auditable when Node-RED changes.
 *
 * Source of truth:
 *   @node-red/editor-api/lib/editor/comms.js          (CommsConnection)
 *   @node-red/runtime/lib/api/comms.js                (publish / subscribe)
 *
 * Key behaviours mirrored (each one broke or masked the original bug):
 *
 * 1. Raw `ws` server, no Socket.IO / Engine.IO framing.
 *    comms.js: `wsServer = new ws.Server({ noServer: true })` + `server.on('upgrade')`.
 *
 * 2. Server -> client frames are plain JSON **arrays** of `{ topic, data }`,
 *    flushed at most every 50ms, up to 50 envelopes per frame.
 *    comms.js: `_queueSend()` → `ws.send(JSON.stringify(self.stack.splice(0,50)))`.
 *
 * 3. Client -> server frames are plain JSON objects. Recognised keys:
 *    `auth`, `subscribe`, `topic`.
 *    comms.js: `ws.on('message')` → `if (msg.auth) ... else if (msg.subscribe) ...`.
 *
 * 4. THE AUTH GATE. `pendingAuth = !user && (settings.adminAuth != null)`.
 *    While pendingAuth is true, a connection is NOT added to `connections[]`,
 *    and `publish()` iterates `connections[]` — so an unauthenticated
 *    connection receives literally nothing, silently.
 *    comms.js: `var pendingAuth = !this.user && (settings.adminAuth != null);`
 *
 * 5. A non-auth message arriving while pendingAuth is true falls through to the
 *    anonymous-user path, which ends in `{"auth":"fail"}` + `ws.close()`.
 *    comms.js: `completeConnection(msg, null, null, false)`.
 *
 * 6. Successful auth answers `{"auth":"ok"}` and only then registers the
 *    connection.
 *    comms.js: `if (sendAck) ws.send(JSON.stringify({auth:"ok"}))`.
 *
 * 7. Heartbeats are a `hb` TOPIC event (not an Engine.IO ping).
 *    comms.js: `heartbeatTimer` → `connection.send("hb", lastSentTime)`.
 *
 * 8. `subscribe` does NOT gate live event delivery — all registered clients
 *    receive everything automatically; subscribe only replays `retained` topics.
 *    runtime/api/comms.js: "Currently, all clients get automatically subscribed
 *    to everything and cannot unsubscribe. Sending a subscribe request will
 *    trigger retained messages to be sent."
 */

import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

/** Node-RED default flush interval for the outgoing stack (ms). */
const DEFAULT_FLUSH_DELAY = 50;

/** Node-RED default keepalive interval (ms) — settings.webSocketKeepAliveTime || 15000. */
const DEFAULT_HEARTBEAT_INTERVAL = 15000;

/** Node-RED flushes at most 50 envelopes per frame. */
const MAX_ENVELOPES_PER_FRAME = 50;

/** Default comms path when httpAdminRoot is "/". */
const DEFAULT_COMMS_PATH = '/comms';

export class FakeCommsServer {
  /** @type {import('node:http').Server} */
  #httpServer;
  /** @type {import('ws').WebSocketServer} */
  #wsServer;
  #connections = [];
  #retained = {};
  #flushTimer = null;
  #heartbeatTimer = null;
  #openSockets = new Set();

  /** @type {Array<{url: string, headers: object}>} */
  upgradeRequests = [];
  /** @type {Array<{raw: string, parsed: any}>} */
  receivedFrames = [];
  /** @type {string[]} Frames whose JSON.parse failed (mirrors "comms received malformed message"). */
  malformedFrames = [];
  /**
   * Count of `{"auth":...}` packets received while auth was NOT required.
   *
   * Real Node-RED does not tolerate this: `handleAuthPacket` resolves a null
   * token then calls `Users.tokens(...)`, which is `undefined` unless the
   * instance defines `config.tokens` — a TypeError inside a promise chain, i.e.
   * an unhandled rejection that terminates the process on Node >= 15.
   * This fake records the event instead of crashing the test runner.
   */
  authPacketsWhileNoAuth = 0;
  /** Topics replayed in response to `subscribe` (retained only). */
  subscribeRequests = [];

  /** @type {string|null} */
  port = null;

  /** Raw TCP sockets, including connections that never completed an upgrade. */
  #rawSockets = new Set();

  #options;

  /**
   * @param {object} [options]
   * @param {boolean} [options.requireAuth=false] - Mirror `settings.adminAuth != null`.
   * @param {string} [options.acceptToken] - Token value that satisfies the auth gate.
   * @param {number} [options.flushDelay] - Outgoing stack flush interval (ms).
   * @param {number} [options.heartbeatInterval] - `hb` interval (ms). 0 disables.
   * @param {string} [options.path] - Comms path (mirrors httpAdminRoot + "/comms").
   */
  constructor(options = {}) {
    this.#options = {
      requireAuth: options.requireAuth ?? false,
      acceptToken: options.acceptToken ?? null,
      flushDelay: options.flushDelay ?? DEFAULT_FLUSH_DELAY,
      heartbeatInterval: options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      path: options.path ?? DEFAULT_COMMS_PATH,
    };
  }

  get requireAuth() {
    return this.#options.requireAuth;
  }

  get commsPath() {
    return this.#options.path;
  }

  /** Base URL for building client URLs, e.g. `http://127.0.0.1:PORT`. */
  get baseUrl() {
    return `http://127.0.0.1:${this.port}`;
  }

  /** WebSocket URL a client should connect to. */
  get wsUrl() {
    return `ws://127.0.0.1:${this.port}${this.#options.path}`;
  }

  /** Number of currently registered (i.e. able to receive events) connections. */
  get connectionCount() {
    return this.#connections.length;
  }

  /**
   * Start listening on a loopback port.
   * @returns {Promise<string>} base URL
   */
  async start() {
    this.#httpServer = createServer((req, res) => {
      res.writeHead(404).end();
    });
    this.#wsServer = new WebSocketServer({ noServer: true });

    // Track raw sockets. Node-RED deliberately does NOT destroy the socket for
    // an upgrade on a non-comms path, so such a connection stays open and would
    // otherwise hold httpServer.close() forever.
    this.#httpServer.on('connection', (socket) => {
      this.#rawSockets.add(socket);
      socket.on('close', () => this.#rawSockets.delete(socket));
    });

    // comms.js: server.on('upgrade', ...) — only the comms path is handled.
    this.#httpServer.on('upgrade', (request, socket, head) => {
      const { pathname } = new URL(request.url, 'http://localhost');
      if (pathname !== this.#options.path) {
        return; // Node-RED deliberately does not destroy the socket here.
      }
      this.upgradeRequests.push({ url: request.url, headers: { ...request.headers } });

      this.#wsServer.handleUpgrade(request, socket, head, (ws) => {
        this.#onConnection(ws);
      });
    });

    this.#wsServer.on('error', () => { /* mirrors wsServer.on('error') log.warn */ });

    await new Promise((resolve) => this.#httpServer.listen(0, '127.0.0.1', resolve));
    this.port = this.#httpServer.address().port;

    this.#startHeartbeat();
    return this.baseUrl;
  }

  /** Handle a new raw upgrade, mirroring `CommsConnection`. */
  #onConnection(ws) {
    this.#openSockets.add(ws);

    const connection = {
      ws,
      session: `fake-${Math.random().toString(36).slice(2)}`,
      stack: [],
      xmitTimer: null,
      lastSentTime: Date.now(),
      token: null,
    };

    // comms.js: var pendingAuth = !this.user && (settings.adminAuth != null);
    let pendingAuth = this.#options.requireAuth;
    const self = this;

    // comms.js: if (!pendingAuth) addActiveConnection(self);
    if (!pendingAuth) {
      this.#connections.push(connection);
    }

    // comms.js: completeConnection(msg, userScope, session, sendAck)
    const completeConnection = (msg, granted, session, sendAck) => {
      if (!granted) {
        // comms.js: ws.send({auth:"fail"}); ws.close();
        try {
          ws.send(JSON.stringify({ auth: 'fail' }));
          ws.close();
        } catch { /* socket may already be gone */ }
        return;
      }
      pendingAuth = false;
      self.#connections.push(connection);
      connection.token = msg.auth;
      if (sendAck) {
        ws.send(JSON.stringify({ auth: 'ok' }));
      }
    };

    // comms.js: handleAuthPacket
    const handleAuthPacket = (msg) => {
      const valid = this.#options.acceptToken !== null && msg.auth === this.#options.acceptToken;
      completeConnection(msg, valid, valid ? msg.auth : null, valid);
    };

    // comms.js: ws.on('message', ...)
    ws.on('message', (data) => {
      const raw = data.toString();
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        this.malformedFrames.push(raw);
        return; // log.trace("comms received malformed message"); return;
      }
      this.receivedFrames.push({ raw, parsed: msg });

      if (!pendingAuth) {
        if (msg.auth) {
          // Node-RED would call Users.tokens() here — undefined without
          // config.tokens → unhandled rejection. We record instead of crashing.
          this.authPacketsWhileNoAuth += 1;
        } else if (msg.subscribe) {
          this.subscribeRequests.push(msg.subscribe);
          this.#replayRetained(connection, msg.subscribe);
        }
        // msg.topic -> runtimeAPI.comms.receive() — not needed for debug capture.
      } else {
        if (msg.auth) {
          handleAuthPacket(msg);
        } else {
          // comms.js: no anonymousUser fallback configured → auth fail.
          completeConnection(msg, null, null, false);
        }
      }
    });

    ws.on('close', () => {
      this.#openSockets.delete(ws);
      this.#removeConnection(connection);
    });

    ws.on('error', () => { /* mirrors ws.on('error') → log.warn */ });
  }

  #removeConnection(connection) {
    const i = this.#connections.indexOf(connection);
    if (i !== -1) this.#connections.splice(i, 1);
    if (connection.xmitTimer) {
      clearTimeout(connection.xmitTimer);
      connection.xmitTimer = null;
    }
  }

  /**
   * Replay retained topics matching a subscription pattern.
   * runtime/api/comms.js: subscribe() converts the topic into a regex where
   * `+` matches one path segment and a trailing `/#` matches the subtree.
   */
  #replayRetained(connection, topic) {
    const pattern = new RegExp(
      '^' + topic
        .replace(/([[\]?()\\$^*.|])/g, '\\$1')
        .replace(/\+/g, '[^/]+')
        .replace(/\/#$/, '(/.*)?') + '$',
    );
    for (const [t, data] of Object.entries(this.#retained)) {
      if (pattern.test(t)) {
        connection.stack.push({ topic: t, data });
      }
    }
    this.#scheduleFlush(connection);
  }

  /**
   * Publish an event to every registered connection.
   * runtime/api/comms.js: publish() iterates `connections`.
   *
   * A connection that is still pending auth is NOT in `connections`, so it
   * receives nothing — this is the exact mechanism behind the original bug.
   *
   * @param {string} topic
   * @param {any} data
   * @param {boolean} [retain]
   */
  publish(topic, data, retain = false) {
    if (retain) {
      this.#retained[topic] = data;
    }
    for (const connection of this.#connections) {
      connection.stack.push({ topic, data });
      this.#scheduleFlush(connection);
    }
  }

  /**
   * Convenience wrapper used by tests to push a debug event.
   * @param {string} topic
   * @param {any} data
   */
  pushEvent(topic, data) {
    this.publish(topic, data);
  }

  /** Push a debug event shaped like a real `21-debug.js` publish. */
  pushDebug(msg) {
    this.publish('debug', msg);
  }

  /** comms.js: _queueSend() — flush the stack, max 50 envelopes per frame. */
  #scheduleFlush(connection) {
    if (connection.xmitTimer) return;
    connection.xmitTimer = setTimeout(() => {
      connection.xmitTimer = null;
      try {
        if (connection.ws.readyState === connection.ws.OPEN) {
          connection.ws.send(JSON.stringify(connection.stack.splice(0, MAX_ENVELOPES_PER_FRAME)));
          connection.lastSentTime = Date.now();
        }
      } catch {
        this.#removeConnection(connection);
      }
      if (connection.stack.length > 0) this.#scheduleFlush(connection);
    }, this.#options.flushDelay);
  }

  /** comms.js: heartbeatTimer — sends an `hb` topic event when idle. */
  #startHeartbeat() {
    const interval = this.#options.heartbeatInterval;
    if (!interval) return;
    this.#heartbeatTimer = setInterval(() => {
      for (const connection of [...this.#connections]) {
        connection.stack.push({ topic: 'hb', data: connection.lastSentTime });
        this.#scheduleFlush(connection);
      }
    }, interval);
    // Do not keep the event loop alive just for the heartbeat.
    if (typeof this.#heartbeatTimer.unref === 'function') this.#heartbeatTimer.unref();
  }

  /** Close every open socket without stopping the server. */
  closeAll() {
    for (const ws of [...this.#openSockets]) {
      try { ws.terminate(); } catch { /* already closed */ }
    }
    this.#openSockets.clear();
    this.#connections = [];
  }

  /** Stop the server and release all resources. */
  async stop() {
    if (this.#heartbeatTimer) {
      clearInterval(this.#heartbeatTimer);
      this.#heartbeatTimer = null;
    }
    this.closeAll();
    // Destroy any connection that was never upgraded (e.g. a request to a
    // non-comms path), otherwise close() would wait for it indefinitely.
    for (const socket of [...this.#rawSockets]) {
      try { socket.destroy(); } catch { /* already gone */ }
    }
    this.#rawSockets.clear();
    await new Promise((resolve) => {
      if (!this.#wsServer) return resolve();
      this.#wsServer.close(() => resolve());
    });
    await new Promise((resolve) => {
      if (!this.#httpServer) return resolve();
      this.#httpServer.close(() => resolve());
    });
  }
}
