/**
 * Test utilities for driving Node-RED's `/comms` protocol in tests.
 *
 * Node-RED sends two distinct frame shapes, so every helper here normalizes
 * both:
 *   - a JSON array of `{ topic, data }` event envelopes (the normal case)
 *   - a JSON object control frame, e.g. `{"auth":"ok"}` / `{"auth":"fail"}`
 */

import { WebSocket } from 'ws';

/** Sleep for `ms` milliseconds. */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Open a WebSocket and resolve once it is open.
 *
 * @param {string} url
 * @param {object} [options] - passed to the WebSocket constructor
 * @returns {Promise<WebSocket>}
 */
export function openSocket(url, options) {
  const ws = new WebSocket(url, options);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`socket did not open: ${url}`)), 4000);
    ws.on('open', () => { clearTimeout(timer); resolve(ws); });
    ws.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Normalize a raw frame into a list of event envelopes.
 *
 * @param {any} frame - parsed frame (array or object)
 * @returns {Array<{topic?: string, data?: any, auth?: string}>}
 */
export function frameToEvents(frame) {
  if (Array.isArray(frame)) {
    return frame.filter((e) => e !== null && typeof e === 'object');
  }
  if (frame !== null && typeof frame === 'object') {
    return [frame];
  }
  return [];
}

/**
 * Flatten a list of raw frames into a single list of event envelopes.
 *
 * @param {any[]} frames
 * @returns {Array<{topic?: string, data?: any, auth?: string}>}
 */
export function flattenEvents(frames) {
  return frames.flatMap(frameToEvents);
}

/**
 * Attach a recorder to a socket. Records raw frames, exposes the flattened
 * events, and exposes auth control outcomes.
 *
 * @param {WebSocket} ws
 */
export function recordFrames(ws) {
  const recorder = {
    frames: [],
    errors: [],
    closeCode: null,
    closeReason: null,
    closed: false,
    /**
     * Resolves when new events arrive and the predicate returns true.
     * @param {(events: any[]) => boolean} predicate
     * @param {number} [timeout]
     */
    waitFor(predicate, timeout = 3000) {
      const check = () => predicate(recorder.events);
      if (check()) return Promise.resolve(recorder.events);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          ws.off('message', onMessage);
          reject(new Error(
            `timed out waiting for events. observed: ${JSON.stringify(recorder.events).slice(0, 400)}`,
          ));
        }, timeout);
        const onMessage = () => {
          if (check()) {
            clearTimeout(timer);
            ws.off('message', onMessage);
            resolve(recorder.events);
          }
        };
        ws.on('message', onMessage);
        ws.on('close', () => {
          // Let the timeout decide; closed sockets simply stop producing.
        });
      });
    },
    /** Resolves when the socket closes. */
    waitForClose(timeout = 3000) {
      if (recorder.closed) return Promise.resolve(recorder.closeCode);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('socket did not close in time')), timeout);
        ws.on('close', (code) => { clearTimeout(timer); resolve(code); });
      });
    },
  };

  Object.defineProperty(recorder, 'events', {
    get() { return flattenEvents(recorder.frames); },
  });

  ws.on('message', (d) => {
    const raw = d.toString();
    try {
      recorder.frames.push(JSON.parse(raw));
    } catch {
      recorder.errors.push(new Error(`unparseable frame: ${raw}`));
    }
  });
  ws.on('error', (err) => recorder.errors.push(err));
  ws.on('close', (code, reason) => {
    recorder.closed = true;
    recorder.closeCode = code;
    recorder.closeReason = reason?.toString() ?? '';
  });

  return recorder;
}

/** All `debug` envelopes from a flat event list. */
export function debugEvents(events) {
  return events.filter((e) => e.topic === 'debug');
}

/** The `auth` control outcomes observed, e.g. `['ok']` or `['fail']`. */
export function authOutcomes(events) {
  return events.filter((e) => typeof e.auth === 'string').map((e) => e.auth);
}
