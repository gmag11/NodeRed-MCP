/**
 * MCP tool: read-debug-messages
 *
 * Reads buffered Node-RED debug messages from the CommsClient ring buffer
 * with optional filtering by node ID, node name, keyword, and time range.
 * Supports both head (first-N) and tail (last-N) retrieval modes.
 */

import { formatSuccess } from './response-utils.js';

import { ANN_READ_DEBUG } from './constants.js';
import { DebugMessagesResponseSchema } from '../schemas/responses.js';
/** Default limit when neither `last` nor `limit` is provided. */
const DEFAULT_LIMIT = 50;

/**
 * Apply filters to an array of debug messages.
 *
 * This is a pure function — it does not mutate the input array.
 *
 * Filters are applied in order:
 *  1. `after` / `before` — inclusive timestamp bounds
 *  2. `nodeId` — exact match on message.id
 *  3. `nodeName` — case-insensitive substring match on message.name
 *  4. `keyword` — case-insensitive substring match against stringified message.msg
 *
 * After filtering:
 *  - If `last` is set, return the last N matching messages (chronological order)
 *  - Otherwise, return the first `limit` matches (default: 50)
 *
 * @param {object[]} messages - Array of debug message objects
 * @param {object} filters
 * @param {string} [filters.nodeId] - Exact match on message.id
 * @param {string} [filters.nodeName] - Case-insensitive substring on message.name
 * @param {string} [filters.keyword] - Case-insensitive substring in stringified msg
 * @param {number} [filters.after] - Inclusive lower timestamp bound (ms)
 * @param {number} [filters.before] - Inclusive upper timestamp bound (ms)
 * @param {number} [filters.last] - Return last N (mutually exclusive with limit)
 * @param {number} [filters.limit] - Return first N (default 50; mutually exclusive with last)
 * @returns {{ messages: object[], total: number } | { error: string }}
 */
export function filterMessages(messages, {
  nodeId,
  nodeName,
  keyword,
  after,
  before,
  last,
  limit,
} = {}) {
  // Validate: last and limit are mutually exclusive
  if (last !== undefined && limit !== undefined) {
    return {
      error: 'last and limit are mutually exclusive — use one or the other. Use last to get the most recent N messages (tail mode), or limit to get the first N matches (head mode, default 50).',
    };
  }

  // Apply filters
  let result = messages;

  // Time range: after (inclusive lower bound)
  if (after !== undefined && after !== null) {
    result = result.filter((m) => m.timestamp >= after);
  }

  // Time range: before (inclusive upper bound)
  if (before !== undefined && before !== null) {
    result = result.filter((m) => m.timestamp <= before);
  }

  // Exact nodeId match
  if (nodeId !== undefined && nodeId !== null && nodeId !== '') {
    result = result.filter((m) => m.id === nodeId);
  }

  // nodeName substring (case-insensitive)
  if (nodeName !== undefined && nodeName !== null && nodeName !== '') {
    const lowerName = nodeName.toLowerCase();
    result = result.filter((m) => {
      if (!m.name) return false;
      return String(m.name).toLowerCase().includes(lowerName);
    });
  }

  // keyword substring in stringified msg (case-insensitive)
  if (keyword !== undefined && keyword !== null && keyword !== '') {
    const lowerKeyword = keyword.toLowerCase();
    result = result.filter((m) => {
      if (m.msg === null || m.msg === undefined) return false;
      return JSON.stringify(m.msg).toLowerCase().includes(lowerKeyword);
    });
  }

  const total = result.length;

  // Apply last-N or first-N slicing
  if (last !== undefined && last !== null) {
    // Return the last `last` messages in chronological order
    result = result.slice(Math.max(0, result.length - last));
  } else {
    // Return the first `limit` messages (default 50)
    const effectiveLimit = (limit !== undefined && limit !== null) ? limit : DEFAULT_LIMIT;
    result = result.slice(0, effectiveLimit);
  }

  return { messages: result, total };
}

/**
 * Build a human-readable diagnostic when the comms client cannot receive
 * events, so an empty result is not confused with an idle-but-connected client.
 *
 * @param {{ state: string, ready: boolean, authenticated: boolean, subscribed: boolean, lastAuthOutcome: 'ok'|'fail'|null }} connection
 * @returns {string|undefined}
 */
export function buildDiagnostic(connection) {
  if (!connection || connection.ready) {
    return undefined;
  }

  if (connection.lastAuthOutcome === 'fail') {
    return 'The Node-RED /comms WebSocket rejected authentication, so no debug events can be received. Verify NODERED_API_KEY (or NODERED_USERNAME/NODERED_PASSWORD) is valid for the target instance.';
  }

  switch (connection.state) {
    case 'authenticating':
      return 'The Node-RED /comms WebSocket is authenticating. If this persists, the configured credentials were not accepted.';
    case 'connecting':
    case 'open':
      return 'The Node-RED /comms WebSocket is still connecting, so no debug events have been received yet. Retry shortly.';
    case 'closed':
      return 'The Node-RED /comms WebSocket is closed, so no debug events can be received. The client is retrying with backoff; verify the instance is reachable and credentials are valid.';
    case 'idle':
      return 'The Node-RED /comms WebSocket has not been connected, so no debug events can be received.';
    default:
      return `The Node-RED /comms WebSocket is not ready to receive debug events (state: ${connection.state}).`;
  }
}

/**
 * Create a handler for the read-debug-messages MCP tool.
 *
 * @param {import('../nodered/comms-client.js').CommsClient} commsClient
 * @returns {(params: object) => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleReadDebugMessages(commsClient) {
  return async (params) => {
    const { nodeId, nodeName, keyword, after, before, last, limit } = params;

    // Read from the ring buffer
    const allMessages = commsClient.getMessages();

    // Apply filters
    const result = filterMessages(allMessages, {
      nodeId,
      nodeName,
      keyword,
      after,
      before,
      last,
      limit,
    });

    const connection = typeof commsClient.getConnectionState === 'function'
      ? commsClient.getConnectionState()
      : { state: 'unknown', ready: true, authenticated: true, subscribed: true, lastAuthOutcome: null };

    // Handle filter-level error (e.g. last + limit conflict)
    if (result.error) {
      return formatSuccess({
        error: result.error,
        connection,
      });
    }

    const data = {
      messages: result.messages,
      total: result.total,
      bufferSize: commsClient.bufferSize,
      connection,
    };

    const diagnostic = buildDiagnostic(connection);
    if (diagnostic) {
      data.diagnostic = diagnostic;
    }

    return formatSuccess(data);
  };
}

export const readDebugMessagesDefinition = {
  name: 'read-debug-messages',
  annotations: ANN_READ_DEBUG,
  outputSchema: DebugMessagesResponseSchema,
  handler: handleReadDebugMessages,
};
