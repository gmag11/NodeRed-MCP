/**
 * Node-RED Comms WebSocket client.
 *
 * Maintains a persistent WebSocket connection to Node-RED's `/comms` endpoint
 * and buffers incoming debug messages in a fixed-size ring buffer.
 *
 * ── Protocol ────────────────────────────────────────────────────────────
 *
 * Node-RED's editor API runs a bare `ws` server over the HTTP upgrade event
 * and exchanges **plain JSON text frames**. There is no Socket.IO and no
 * Engine.IO layer — no `EIO`/`transport` query parameters, no `40`/`42[...]`
 * packet prefixes, and no Engine.IO ping/pong.
 *
 * Source: `@node-red/editor-api/lib/editor/comms.js`
 *
 * Two server → client frame shapes exist:
 *
 *   1. Events — a JSON array of `{ topic, data }` envelopes, flushed at most
 *      every 50ms with up to 50 envelopes per frame:
 *        [{"topic":"debug","data":{"id":"...","msg":"..."}}]
 *
 *   2. Control — a JSON object whose relevant key is `auth`:
 *        {"auth":"ok"} / {"auth":"fail"}
 *
 * Client → server frames are plain JSON objects. The keys Node-RED acts on:
 *   - `{"auth": <token>}`           authenticate (required when adminAuth is set)
 *   - `{"subscribe": <topic>}`      replay retained topics
 *   - `{"topic": ..., "data": ...}` publish
 *
 * ── Authentication ──────────────────────────────────────────────────────
 *
 * When Node-RED has `adminAuth` configured, `CommsConnection` sets
 * `pendingAuth = true`, and a connection is NOT added to the runtime's
 * `connections[]` until auth completes. `publish()` iterates `connections[]`,
 * so an unauthenticated connection receives **nothing at all, silently**.
 *
 * The token is never read from the query string; it must arrive either as an
 * HTTP header on the upgrade (proxy setups) or as an in-band `{"auth":...}`
 * packet. This client uses the in-band packet.
 *
 * IMPORTANT: the auth packet is sent ONLY when credentials are configured.
 * Sending it to an instance without `adminAuth` walks into `handleAuthPacket`,
 * which calls `Users.tokens()` — a function that is `undefined` unless the
 * instance defines `config.tokens`. That throws inside a promise chain, i.e. an
 * unhandled rejection that terminates the Node process on Node >= 15.
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

/** Event topic whose payloads are buffered as debug messages. */
const DEBUG_TOPIC = 'debug';

/** Topic subscription requested once the connection is usable. */
const SUBSCRIBE_TOPIC = 'debug';

/**
 * Connection lifecycle states.
 *
 * idle → connecting → open → (authenticating) → ready → closed
 *
 * `ready` means the connection is registered with Node-RED and can receive
 * events. On an instance without auth, `open` transitions straight to `ready`.
 */
export const CommsState = Object.freeze({
  IDLE: 'idle',
  CONNECTING: 'connecting',
  OPEN: 'open',
  AUTHENTICATING: 'authenticating',
  READY: 'ready',
  CLOSED: 'closed',
});

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
 * Build the WebSocket URL from an HTTP base URL.
 *
 * Node-RED expects no Engine.IO query parameters and does not read tokens from
 * the query string, so the URL is simply the base with the scheme swapped.
 *
 * @param {string} baseUrl - e.g. "http://localhost:1880"
 * @returns {string} e.g. "ws://localhost:1880/comms"
 */
export function buildWsUrl(baseUrl) {
  const wsBase = baseUrl.replace(/^http/, 'ws').replace(/\/+$/, '');
  return `${wsBase}/comms`;
}

/**
 * Classify a raw text frame from Node-RED's `/comms` endpoint.
 *
 * Returns one of:
 *  - `{ type: 'events', events: Array<{topic, data}> }` for a JSON array
 *  - `{ type: 'auth', status: 'ok' | 'fail' }` for a control frame
 *  - `null` for anything else (ignored without closing the socket)
 *
 * Only a top-level JSON array is treated as events, and only an object with an
 * `auth` key is treated as a control frame — matching what Node-RED actually
 * sends. Anything else is unrecognized and MUST NOT break the connection.
 *
 * @param {string} frame
 * @returns {{ type: 'events', events: Array<{topic: string, data: any}> } | { type: 'auth', status: 'ok'|'fail' } | null}
 */
export function classifyFrame(frame) {
  if (typeof frame !== 'string' || frame.length === 0) {
    return null;
  }

  // Cheap guard: Node-RED frames always begin with a JSON array or object.
  const first = frame.trimStart()[0];
  if (first !== '[' && first !== '{') {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(frame);
  } catch {
    return null;
  }

  if (Array.isArray(parsed)) {
    const events = [];
    for (const item of parsed) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) continue;
      if (typeof item.topic !== 'string') continue;
      events.push({ topic: item.topic, data: item.data });
    }
    return { type: 'events', events };
  }

  if (parsed !== null && typeof parsed === 'object') {
    if (typeof parsed.auth === 'string') {
      return { type: 'auth', status: parsed.auth === 'ok' ? 'ok' : 'fail' };
    }
    return null;
  }

  return null;
}

/**
 * Comms WebSocket client for a single Node-RED instance.
 *
 * Emits the following events:
 *  - 'debug' ({ id, name, msg, format, path, timestamp }) — debug message received
 *  - 'connected' () — connection is usable and subscribed to debug events
 *  - 'disconnected' () — a previously usable connection was lost
 *  - 'error' (Error) — non-fatal error
 */
export class CommsClient extends EventEmitter {
  #baseUrl;
  #username;
  #password;
  #apiToken;
  #token = null;
  #wsUrl;
  #ws = null;
  #buffer = [];
  #maxSize;
  #reconnectDelay = INITIAL_RECONNECT_DELAY;
  #reconnectTimer = null;
  #subscribed = false;
  #intentionalClose = false;

  /** @type {string} One of CommsState. */
  #state = CommsState.IDLE;
  /** @type {'ok'|'fail'|null} Outcome of the last authentication attempt. */
  #lastAuthOutcome = null;
  /** Whether the socket is open AND registered (able to receive events). */
  #ready = false;

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
    this.#apiToken = token || null;
    this.#token = token || null;
    this.#wsUrl = buildWsUrl(baseUrl);
    this.#maxSize = parseBufferSize();
  }

  /**
   * Whether credentials are configured that warrant an in-band auth packet.
   *
   * @returns {boolean}
   */
  get #hasCredentials() {
    return Boolean(this.#token) || Boolean(this.#username && this.#password);
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
    this.#subscribed = false;
    this.#setState(CommsState.CONNECTING);

    // If no pre-obtained token but credentials are provided, fetch one
    if (!this.#token && this.#username && this.#password) {
      try {
        this.#token = await getToken(this.#baseUrl, this.#username, this.#password);
      } catch (err) {
        console.error(`[CommsClient] Auth token fetch failed: ${err.message}`);
        this.#setState(CommsState.CLOSED);
        this.emit('error', err);
        this.#scheduleReconnect();
        return;
      }
    }

    try {
      this.#ws = new WebSocket(this.#wsUrl);
    } catch (err) {
      console.error(`[CommsClient] WebSocket constructor error: ${err.message}`);
      this.#setState(CommsState.CLOSED);
      this.#scheduleReconnect();
      return;
    }

    this.#ws.on('open', () => {
      this.#setState(CommsState.OPEN);
      // Auth first, when credentials exist. On an instance without adminAuth
      // the connection is already registered, so `ready` is immediate and NO
      // auth packet is sent (see the module header for why that matters).
      if (this.#hasCredentials) {
        this.#setState(CommsState.AUTHENTICATING);
        this.#sendJson({ auth: this.#token });
      } else {
        this.#becomeReady();
      }
    });

    this.#ws.on('message', (data) => {
      const raw = typeof data === 'string' ? data : data.toString();
      const parsed = classifyFrame(raw);
      if (!parsed) {
        return;
      }

      switch (parsed.type) {
        case 'auth':
          this.#lastAuthOutcome = parsed.status;
          if (parsed.status === 'ok') {
            this.#becomeReady();
          } else {
            // Node-RED answers {"auth":"fail"} and closes the socket. Report it
            // and let the backoff timer (not an immediate retry) drive the next
            // attempt, so a bad token cannot produce a reconnect storm.
            this.#ready = false;
            this.#setState(CommsState.AUTHENTICATING);
            console.error(
              '[CommsClient] ❌ Node-RED rejected the WebSocket authentication. ' +
              'Check NODERED_API_KEY (or NODERED_USERNAME/NODERED_PASSWORD) against the target instance.',
            );
            this.emit('error', new Error(
              'Node-RED rejected the /comms WebSocket authentication. ' +
              'Verify NODERED_API_KEY (or NODERED_USERNAME/NODERED_PASSWORD) is valid for this instance.',
            ));
          }
          break;

        case 'events':
          for (const event of parsed.events) {
            this.#processEvent(event);
          }
          break;
      }
    });

    this.#ws.on('close', () => {
      this.#ws = null;
      const wasReady = this.#ready;
      this.#ready = false;
      this.#subscribed = false;
      this.#setState(CommsState.CLOSED);

      if (wasReady) {
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
    this.#ready = false;
    this.#subscribed = false;
    this.#setState(CommsState.CLOSED);
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
   * Whether the socket is open and able to receive events.
   *
   * @returns {boolean}
   */
  get isConnected() {
    return this.#ready;
  }

  /**
   * Whether the connection is usable for receiving events.
   *
   * @returns {boolean}
   */
  get isReady() {
    return this.#ready;
  }

  /**
   * A snapshot of the connection state, for tool responses.
   *
   * @returns {{ state: string, ready: boolean, authenticated: boolean, subscribed: boolean, lastAuthOutcome: 'ok'|'fail'|null }}
   */
  getConnectionState() {
    return {
      state: this.#state,
      ready: this.#ready,
      authenticated: this.#lastAuthOutcome === 'ok',
      subscribed: this.#subscribed,
      lastAuthOutcome: this.#lastAuthOutcome,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Transition to `ready`, subscribe, and announce the connection once.
   */
  #becomeReady() {
    const wasReady = this.#ready;
    this.#ready = true;
    this.#setState(CommsState.READY);
    this.#reconnectDelay = INITIAL_RECONNECT_DELAY;

    if (!this.#subscribed) {
      this.#subscribed = true;
      // `subscribe` does not gate live delivery (Node-RED broadcasts to every
      // registered connection) but it does replay retained topics.
      this.#sendJson({ subscribe: SUBSCRIBE_TOPIC });
    }

    if (!wasReady) {
      this.emit('connected');
    }
  }

  /**
   * Set the lifecycle state.
   * @param {string} next
   */
  #setState(next) {
    this.#state = next;
  }

  /**
   * Process a single event envelope.
   * Routes debug events to the ring buffer; ignores every other topic.
   *
   * @param {{ topic: string, data: any }} event
   */
  #processEvent(event) {
    // `hb` heartbeats and all other topics are deliberately not buffered.
    if (event.topic === DEBUG_TOPIC) {
      const msg = this.#normalizeDebugMessage(event.data);
      this.#appendToBuffer(msg);
      this.emit('debug', msg);
    }
  }

  /**
   * Serialize and send a JSON frame over the WebSocket.
   * Silently no-ops if the socket is not open.
   *
   * @param {object} obj
   */
  #sendJson(obj) {
    if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify(obj));
    }
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   *
   * On reconnect, a token previously obtained through the credentials flow is
   * invalidated so a fresh one is acquired. A statically configured API key is
   * kept, since the next attempt should reuse it.
   */
  #scheduleReconnect() {
    if (this.#intentionalClose) {
      return;
    }

    // Invalidate a credentials-derived token so a fresh one is fetched.
    if (!this.#apiToken && this.#username && this.#password) {
      this.#token = null;
    }

    // Avoid stacking timers when several failures land together.
    if (this.#reconnectTimer) {
      return;
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
   *   { id, z, path, name, topic, msg, format }
   *
   * We ensure timestamp is a number (ms) and add `_receivedAt` for
   * ordering guarantees within the buffer. Node-RED does not include a
   * timestamp in debug publishes, so the receipt time is normally used.
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
