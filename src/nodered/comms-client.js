/**
 * Node-RED Comms WebSocket client.
 *
 * Maintains a persistent WebSocket connection to Node-RED's /comms endpoint
 * using the Socket.IO v4 / Engine.IO v4 protocol. Buffers incoming debug
 * messages in a fixed-size ring buffer and supports optional authentication.
 *
 * After connecting, the client subscribes to the "debug" event topic so
 * that Node-RED pushes debug node output to this client.
 *
 * The WebSocket URL is derived from the HTTP baseUrl (replacing http(s)://
 * with ws(s)://) and includes the required Engine.IO query parameters
 * (EIO=4, transport=websocket). If an access token is provided, it is
 * also appended as a query parameter.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
import { getToken } from './auth.js';

/** Default ring buffer capacity. */
const DEFAULT_BUFFER_SIZE = 500;

/** Minimum allowed buffer size. */
const MIN_BUFFER_SIZE = 10;

/** Maximum allowed buffer size. */
const MAX_BUFFER_SIZE = 10000;

/** Initial reconnect delay in ms. */
const INITIAL_RECONNECT_DELAY = 1000;

/** Maximum reconnect delay in ms. */
const MAX_RECONNECT_DELAY = 30000;

/** Reconnect delay multiplier (exponential backoff). */
const RECONNECT_MULTIPLIER = 2;

/**
 * Parse the buffer size from the NODE_RED_DEBUG_BUFFER_SIZE env var.
 * Falls back to DEFAULT_BUFFER_SIZE if unset or invalid; clamps to
 * MIN_BUFFER_SIZE / MAX_BUFFER_SIZE.
 *
 * @returns {number}
 */
function parseBufferSize() {
  const raw = process.env.NODE_RED_DEBUG_BUFFER_SIZE;
  if (raw === undefined || raw === '') {
    return DEFAULT_BUFFER_SIZE;
  }
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    console.error(
      `[CommsClient] Invalid NODE_RED_DEBUG_BUFFER_SIZE="${raw}", using default ${DEFAULT_BUFFER_SIZE}`,
    );
    return DEFAULT_BUFFER_SIZE;
  }
  if (parsed < MIN_BUFFER_SIZE) {
    console.error(
      `[CommsClient] NODE_RED_DEBUG_BUFFER_SIZE=${parsed} below minimum ${MIN_BUFFER_SIZE}, clamping`,
    );
    return MIN_BUFFER_SIZE;
  }
  if (parsed > MAX_BUFFER_SIZE) {
    console.error(
      `[CommsClient] NODE_RED_DEBUG_BUFFER_SIZE=${parsed} above maximum ${MAX_BUFFER_SIZE}, clamping`,
    );
    return MAX_BUFFER_SIZE;
  }
  return parsed;
}

/**
 * Build the WebSocket URL from an HTTP base URL and optional token.
 *
 * Adds the required Engine.IO v4 / Socket.IO query parameters so the
 * server recognises the connection as a Socket.IO WebSocket transport.
 *
 * @param {string} baseUrl - e.g. "http://localhost:1880"
 * @param {string} [token] - Bearer access token
 * @returns {string} e.g. "ws://localhost:1880/comms?EIO=4&transport=websocket&access_token=xxx"
 */
function buildWsUrl(baseUrl, token) {
  // Replace http(s):// with ws(s)://
  const wsBase = baseUrl.replace(/^http/, 'ws');
  const params = new URLSearchParams();
  // Engine.IO v4 + WebSocket transport — required for Socket.IO to
  // recognise this as a valid WebSocket upgrade
  params.set('EIO', '4');
  params.set('transport', 'websocket');
  if (token) {
    params.set('access_token', token);
  }
  return `${wsBase}/comms?${params.toString()}`;
}

/**
 * Parse a single Engine.IO v4 / Socket.IO v4 text frame.
 *
 * Engine.IO v4 packet types:
 *  0 — open    (server → client, contains SID + ping config)
 *  1 — close
 *  2 — ping    (bidirectional; responder replies with 3)
 *  3 — pong
 *  4 — message (wraps a Socket.IO packet)
 *
 * Socket.IO v4 packet types (inside Engine.IO message 4):
 *  0 — connect
 *  1 — disconnect
 *  2 — event    (e.g. 42["debug", {...}])
 *  3 — ack
 *  4 — connect_error
 *
 * Returns an object with shape:
 *  - { type: 'pong' } when the caller should reply with `3`
 *  - { type: 'connected' } on Socket.IO connect ack (`40`)
 *  - { type: 'event', topic: string, payload: any } on `42[...]`
 *  - { type: 'open', sid: string } on Engine.IO open (`0{...}`)
 *  - null when the frame should be silently dropped
 *
 * @param {string} frame - Raw text frame from WebSocket
 * @returns {{ type: 'pong' } | { type: 'connected' } | { type: 'event', topic: string, payload: any } | { type: 'open', sid: string } | null}
 */
function parseSocketIOFrame(frame) {
  // Engine.IO open packet (server sends first)
  if (frame.startsWith('0') && frame.length > 1) {
    try {
      const openData = JSON.parse(frame.substring(1));
      return { type: 'open', sid: openData.sid || 'unknown' };
    } catch {
      // Malformed open packet — ignore
    }
  }

  // Engine.IO ping → respond with pong
  if (frame === '2') {
    return { type: 'pong' };
  }

  // Engine.IO message wrapping Socket.IO connect ack
  if (frame === '40') {
    return { type: 'connected' };
  }

  // Engine.IO message wrapping Socket.IO event: 42["topic", data]
  if (frame.startsWith('42')) {
    try {
      const parsed = JSON.parse(frame.substring(2));
      if (Array.isArray(parsed) && parsed.length >= 1) {
        return {
          type: 'event',
          topic: parsed[0],
          payload: parsed.length >= 2 ? parsed[1] : null,
        };
      }
    } catch {
      // Malformed JSON — ignore
    }
  }

  // Plain JSON array of events (Socket.IO v2 raw format):
  //   [{"topic":"debug","data":{...}}, ...]
  // Used by some Node-RED configurations where Engine.IO framing
  // is stripped after the initial handshake.
  if (frame.startsWith('[')) {
    try {
      const parsed = JSON.parse(frame);
      if (Array.isArray(parsed)) {
        const events = [];
        for (const item of parsed) {
          if (item && typeof item === 'object' && item.topic) {
            events.push({
              type: 'event',
              topic: item.topic,
              // Node-RED wraps the debug payload inside a `data` property
              payload: item.data !== undefined ? item.data : item,
            });
          }
        }
        if (events.length > 0) {
          // Return first event inline; caller processes the rest via
          // the returned `_batch` property.
          const [first, ...rest] = events;
          first._batch = rest;
          return first;
        }
      }
    } catch {
      // Malformed JSON — ignore
    }
  }

  // Unknown or unhandled Engine.IO frame type
  return null;
}

/**
 * Socket.IO v4 / Engine.IO v4 comms client for a single Node-RED instance.
 *
 * Emits the following events:
 *  - 'debug' ({ id, name, msg, format, path, timestamp }) — debug message received
 *  - 'connected' () — WebSocket connection established, handshake complete, and subscribed to debug events
 *  - 'disconnected' () — WebSocket connection lost
 *  - 'error' (Error) — non-fatal error
 */
export class CommsClient extends EventEmitter {
  #baseUrl;
  #username;
  #password;
  #token = null;
  #wsUrl;
  #ws = null;
  #buffer = [];
  #maxSize;
  #reconnectDelay = INITIAL_RECONNECT_DELAY;
  #reconnectTimer = null;
  #intentionalClose = false;
  #connected = false;

  /**
   * @param {object} config
   * @param {string} config.baseUrl - Node-RED instance URL (e.g. "http://localhost:1880")
   * @param {string} [config.username] - Username for credentials auth
   * @param {string} [config.password] - Password for credentials auth
   * @param {string} [config.token] - Pre-obtained bearer access token (takes precedence)
   */
  constructor({ baseUrl, username, password, token } = {}) {
    super();
    // Default no-op error listener prevents Node.js from crashing on
    // unhandled 'error' events when no consumer registers a listener.
    // WebSocket errors (ECONNREFUSED, etc.) are transient — the 'close'
    // handler already schedules reconnection.
    this.on('error', () => {});
    if (!baseUrl) {
      throw new Error('CommsClient requires a baseUrl. Set the NODERED_URL environment variable or provide baseUrl in the server configuration.');
    }
    this.#baseUrl = baseUrl;
    this.#username = username || null;
    this.#password = password || null;
    // Pre-obtained token takes precedence; otherwise will be fetched in connect()
    this.#token = token || null;
    this.#wsUrl = buildWsUrl(baseUrl, this.#token);
    this.#maxSize = parseBufferSize();
  }

  /**
   * Open the WebSocket connection and begin buffering messages.
   *
   * If username/password are configured and no pre-obtained token was
   * provided, this method will first fetch a session token from the
   * Node-RED HTTP auth flow before opening the WebSocket.
   *
   * Safe to call multiple times — subsequent calls are no-ops if already
   * connected or connecting.
   *
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.#ws && (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.#intentionalClose = false;

    // If no pre-obtained token but credentials are provided, fetch one
    if (!this.#token && this.#username && this.#password) {
      try {
        this.#token = await getToken(this.#baseUrl, this.#username, this.#password);
        this.#wsUrl = buildWsUrl(this.#baseUrl, this.#token);
      } catch (err) {
        console.error(`[CommsClient] Auth token fetch failed: ${err.message}`);
        this.emit('error', err);
        this.#scheduleReconnect();
        return;
      }
    }

    try {
      this.#ws = new WebSocket(this.#wsUrl);
    } catch (err) {
      console.error(`[CommsClient] WebSocket constructor error: ${err.message}`);
      this.#scheduleReconnect();
      return;
    }

    this.#ws.on('open', () => {
      this.#send('40');
    });

    this.#ws.on('message', (data) => {
      const raw = typeof data === 'string' ? data : data.toString();

      const parsed = parseSocketIOFrame(raw);

      if (!parsed) {
        return;
      }

      switch (parsed.type) {
        case 'open':
          break;

        case 'pong':
          this.#send('3');
          break;

        case 'connected':
          this.#connected = true;
          this.#reconnectDelay = INITIAL_RECONNECT_DELAY;
          this.#send('42["subscribe","debug"]');
          this.emit('connected');
          break;

        case 'event':
          // Process the primary event
          this.#processEvent(parsed);
          // Process any batched events (plain JSON array format)
          if (parsed._batch && Array.isArray(parsed._batch)) {
            for (const batched of parsed._batch) {
              this.#processEvent(batched);
            }
          }
          break;
      }
    });

    this.#ws.on('close', (code, reason) => {
      this.#ws = null;
      const wasConnected = this.#connected;
      this.#connected = false;

      if (wasConnected) {
        this.emit('disconnected');
      }

      if (!this.#intentionalClose) {
        this.#scheduleReconnect();
      }
    });

    this.#ws.on('error', (err) => {
      console.error(`[CommsClient] ❌ WebSocket ERROR: ${err.message}  (stack: ${err.stack ? err.stack.substring(0, 200) : 'n/a'})`);
      this.emit('error', err);
      // The 'close' event will fire after 'error', triggering reconnect
    });

    this.#ws.on('unexpected-response', (req, res) => {
      console.error(
        `[CommsClient] ❌ Unexpected HTTP response: ${res.statusCode} ${res.statusMessage}  ` +
        `headers=${JSON.stringify(res.headers)}`,
      );
    });
  }

  /**
   * Gracefully close the WebSocket connection.
   * No auto-reconnect will be attempted after this.
   */
  disconnect() {
    this.#intentionalClose = true;
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer);
      this.#reconnectTimer = null;
    }
    if (this.#ws) {
      this.#ws.close(1000, 'Client disconnect');
      this.#ws = null;
    }
    this.#connected = false;
  }

  /**
   * Returns a shallow copy of the current ring buffer.
   *
   * @returns {object[]}
   */
  getMessages() {
    return [...this.#buffer];
  }

  /**
   * Returns the current buffer capacity.
   *
   * @returns {number}
   */
  get bufferSize() {
    return this.#maxSize;
  }

  /**
   * Whether the WebSocket is currently connected and handshake is complete.
   *
   * @returns {boolean}
   */
  get isConnected() {
    return this.#connected;
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Process a single parsed event.
   * Routes debug events to the ring buffer; logs non-debug events.
   *
   * @param {{ type: 'event', topic: string, payload: any }} parsed
   */
  #processEvent(parsed) {
    if (parsed.topic === 'debug') {
      const msg = this.#normalizeDebugMessage(parsed.payload);
      this.#appendToBuffer(msg);
      this.emit('debug', msg);
    }
  }

  /**
   * Send a raw text frame over the WebSocket.
   * Silently no-ops if the socket is not open.
   *
   * @param {string} data
   */
  #send(data) {
    if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
      this.#ws.send(data);
    }
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   *
   * On reconnect, the previously-obtained token (if fetched via
   * credentials flow) is invalidated so a fresh one is acquired.
   */
  #scheduleReconnect() {
    if (this.#intentionalClose) {
      return;
    }

    // Invalidate token obtained via credentials flow so a fresh one is fetched
    if (this.#username && this.#password) {
      this.#token = null;
    }

    const delay = this.#reconnectDelay;

    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      this.#reconnectDelay = Math.min(
        this.#reconnectDelay * RECONNECT_MULTIPLIER,
        MAX_RECONNECT_DELAY,
      );
      this.connect().catch((err) => {
        console.error(`[CommsClient] Reconnect failed: ${err.message}`);
      });
    }, delay);
  }

  /**
   * Normalize a raw debug payload into a consistent message object.
   *
   * Node-RED emits:
   *   { id, name, msg, format, path, timestamp }
   *
   * We ensure timestamp is a number (ms) and add `_receivedAt` for
   * ordering guarantees within the buffer.
   *
   * @param {any} raw
   * @returns {object}
   */
  #normalizeDebugMessage(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    return {
      id: data.id || null,
      name: data.name || null,
      msg: data.msg !== undefined ? data.msg : null,
      format: data.format || null,
      path: data.path || null,
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      _receivedAt: Date.now(),
    };
  }

  /**
   * Append a message to the ring buffer, evicting oldest if full.
   *
   * @param {object} message
   */
  #appendToBuffer(message) {
    const wasFull = this.#buffer.length >= this.#maxSize;
    this.#buffer.push(message);
    if (wasFull) {
      this.#buffer.shift();
    }
  }

  /**
   * TEST ONLY: Add a message directly to the ring buffer without
   * going through the WebSocket path. Used by unit tests to verify
   * buffer eviction behavior.
   *
   * @param {object} message
   */
  _testAddMessage(message) {
    this.#appendToBuffer(this.#normalizeDebugMessage(message));
  }
}
