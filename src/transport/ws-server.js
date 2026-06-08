/**
 * Lightweight WebSocket Server
 *
 * Implements a minimal WebSocket server using Node.js built-in `http` module —
 * no external dependencies (no `ws`, no Socket.IO). Handles RFC 6455
 * handshake, message framing, and broadcasting to connected clients.
 *
 * Used by the staging visualization HTML page to receive live updates
 * whenever the StagingStore mutates.
 *
 * @module transport/ws-server
 */

import { createHash } from 'crypto';

/**
 * WebSocket magic GUID per RFC 6455.
 */
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/**
 * Opcodes per RFC 6455.
 */
const OP_TEXT = 0x1;
const OP_CLOSE = 0x8;
const OP_PING = 0x9;
const OP_PONG = 0xA;

/**
 * Minimal WebSocket server attached to an existing Node.js HTTP server.
 */
export class WSServer {
  /** @type {Set<import('http').IncomingMessage>} */
  #clients = new Set();

  /** @type {import('http').Server | null} */
  #httpServer = null;

  /** @type {ReturnType<typeof setInterval> | null} */
  #coalesceTimer = null;

  /** @type {object | null} */
  #pendingMessage = null;

  /** @type {() => Promise<object> | null} */
  #getCurrentState = null;

  /**
   * Attach to an existing HTTP server and start listening for upgrades.
   *
   * @param {import('http').Server} httpServer - Existing HTTP server
   * @param {() => Promise<object>} getCurrentState - Async function returning current staging state { flows, dirtyNodeIds, dirtyFlowIds }
   */
  attach(httpServer, getCurrentState) {
    this.#httpServer = httpServer;
    this.#getCurrentState = getCurrentState;

    httpServer.on('upgrade', (req, socket, head) => {
      if (req.url === '/staging-ws') {
        this.#handleUpgrade(req, socket, head);
      } else {
        socket.destroy();
      }
    });
  }

  /**
   * Broadcast a staging update to all connected clients.
   * Coalesces rapid updates within a 100ms window into a single message.
   *
   * @param {object} data - { flows, dirtyNodeIds, dirtyFlowIds }
   */
  broadcast(data) {
    const message = JSON.stringify({
      type: 'staging-update',
      flows: data.flows,
      dirtyNodeIds: [...(data.dirtyNodeIds || [])],
      dirtyFlowIds: [...(data.dirtyFlowIds || [])],
    });

    // Coalesce: if a message was sent recently, wait
    if (this.#coalesceTimer) {
      this.#pendingMessage = message;
      return;
    }

    this.#sendToAll(message);

    // Arm coalescing timer
    this.#coalesceTimer = setTimeout(() => {
      this.#coalesceTimer = null;
      if (this.#pendingMessage) {
        const pending = this.#pendingMessage;
        this.#pendingMessage = null;
        this.#sendToAll(pending);
      }
    }, 100);
  }

  /**
   * Send data to all connected clients. Removes dead sockets.
   *
   * @param {string} data - String message to send
   */
  #sendToAll(data) {
    for (const socket of this.#clients) {
      try {
        this.#sendFrame(socket, data);
      } catch {
        this.#clients.delete(socket);
        try { socket.destroy(); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Handle HTTP upgrade request — perform WebSocket handshake.
   */
  #handleUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    // Compute accept key per RFC 6455
    const acceptKey = createHash('sha1')
      .update(key + WS_GUID)
      .digest('base64');

    // Send handshake response
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      'Sec-WebSocket-Accept: ' + acceptKey + '\r\n' +
      '\r\n'
    );

    this.#clients.add(socket);

    // Send initial state to the new client
    if (this.#getCurrentState) {
      this.#getCurrentState().then((state) => {
        const initMsg = JSON.stringify({
          type: 'staging-update',
          flows: state.flows,
          dirtyNodeIds: [...(state.dirtyNodeIds || [])],
          dirtyFlowIds: [...(state.dirtyFlowIds || [])],
        });
        try {
          this.#sendFrame(socket, initMsg);
        } catch { /* socket may have closed */ }
      }).catch(() => { /* ignore */ });
    }

    // Handle incoming data (currently we just consume ping/pong/close)
    socket.on('data', (buffer) => {
      try {
        const opcode = buffer[0] & 0x0f;
        if (opcode === OP_CLOSE) {
          this.#clients.delete(socket);
          try { socket.destroy(); } catch { /* ignore */ }
        } else if (opcode === OP_PING) {
          // Respond with pong
          const pongFrame = Buffer.alloc(2 + (buffer.length - 2));
          pongFrame[0] = 0x8a; // FIN + PONG opcode
          pongFrame[1] = buffer.length - 2; // payload length
          buffer.copy(pongFrame, 2, 2);
          try { socket.write(pongFrame); } catch { /* ignore */ }
        }
        // TEXT frames from client are ignored (read-only visualization)
      } catch { /* malformed frame — ignore */ }
    });

    socket.on('close', () => {
      this.#clients.delete(socket);
    });

    socket.on('error', () => {
      this.#clients.delete(socket);
      try { socket.destroy(); } catch { /* ignore */ }
    });
  }

  /**
   * Send a text frame per RFC 6455.
   *
   * @param {import('net').Socket} socket
   * @param {string} data - Payload string
   */
  #sendFrame(socket, data) {
    const payload = Buffer.from(data, 'utf8');
    const length = payload.length;

    let frame;
    let offset;

    if (length < 126) {
      frame = Buffer.alloc(2 + length);
      frame[0] = 0x81; // FIN + TEXT opcode
      frame[1] = length;
      offset = 2;
    } else if (length < 65536) {
      frame = Buffer.alloc(4 + length);
      frame[0] = 0x81;
      frame[1] = 126;
      frame[2] = (length >> 8) & 0xff;
      frame[3] = length & 0xff;
      offset = 4;
    } else {
      frame = Buffer.alloc(10 + length);
      frame[0] = 0x81;
      frame[1] = 127;
      // 64-bit length in network byte order
      frame.writeBigUInt64BE(BigInt(length), 2);
      offset = 10;
    }

    payload.copy(frame, offset);
    socket.write(frame);
  }
}
