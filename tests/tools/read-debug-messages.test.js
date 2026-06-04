import { describe, it, expect } from 'vitest';
import { filterMessages } from '../../src/tools/read-debug-messages.js';
import { CommsClient } from '../../src/nodered/comms-client.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default buffer size used in tests (must be >= MIN_BUFFER_SIZE=10). */
const TEST_BUFFER_SIZE = 10;

/**
 * Create a sample debug message object.
 *
 * @param {object} overrides
 * @returns {object}
 */
function makeMsg(overrides = {}) {
  return {
    id: overrides.id ?? 'node-1',
    name: overrides.name ?? 'Debug Node',
    msg: overrides.msg ?? { payload: 'hello' },
    format: overrides.format ?? 'string',
    path: overrides.path ?? 'flow-1',
    timestamp: overrides.timestamp ?? 1000,
    _receivedAt: overrides._receivedAt ?? 1000,
  };
}

/**
 * Generate an array of N sample debug messages with sequential timestamps.
 *
 * @param {number} count
 * @param {object} [baseOverrides]
 * @returns {object[]}
 */
function makeMessages(count, baseOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    makeMsg({
      id: `node-${i + 1}`,
      name: `Debug Node ${i + 1}`,
      msg: { payload: `message ${i + 1}` },
      timestamp: (baseOverrides.timestamp ?? 0) + i * 100,
      ...baseOverrides,
      // Let overrides override the auto-generated values above
      ...(baseOverrides.id !== undefined ? {} : { id: `node-${i + 1}` }),
      ...(baseOverrides.name !== undefined ? {} : { name: `Debug Node ${i + 1}` }),
      ...(baseOverrides.msg !== undefined ? {} : { msg: { payload: `message ${i + 1}` } }),
    }),
  );
}

// ---------------------------------------------------------------------------
// filterMessages
// ---------------------------------------------------------------------------

describe('filterMessages', () => {
  // --- 4.2: No filters returns first 50 messages in chronological order ---
  it('with no filters returns first 50 messages in chronological order', () => {
    const messages = makeMessages(100);
    const result = filterMessages(messages, {});
    expect(result.error).toBeUndefined();
    expect(result.messages).toHaveLength(50);
    expect(result.total).toBe(100);
    // Chronological order: first message first
    expect(result.messages[0].timestamp).toBe(0);
    expect(result.messages[49].timestamp).toBe(4900);
  });

  // --- 4.2 extension: fewer than limit returns all ---
  it('returns all messages when total is less than default limit', () => {
    const messages = makeMessages(10);
    const result = filterMessages(messages, {});
    expect(result.messages).toHaveLength(10);
    expect(result.total).toBe(10);
  });

  // --- 4.2 extension: empty array ---
  it('returns empty messages array for empty input', () => {
    const result = filterMessages([], {});
    expect(result.messages).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // --- 4.3: Filters by exact nodeId ---
  it('filters by exact nodeId', () => {
    const messages = makeMessages(10);
    // Set every other message to a specific nodeId
    messages[0].id = 'target-node';
    messages[3].id = 'target-node';
    messages[7].id = 'target-node';

    const result = filterMessages(messages, { nodeId: 'target-node' });
    expect(result.messages).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.messages.every((m) => m.id === 'target-node')).toBe(true);
  });

  it('filters by nodeId returns empty when no match', () => {
    const messages = makeMessages(5);
    const result = filterMessages(messages, { nodeId: 'non-existent' });
    expect(result.messages).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // --- 4.4: Filters by nodeName substring (case-insensitive) ---
  it('filters by nodeName substring (case-insensitive)', () => {
    const messages = [
      makeMsg({ name: 'Temperature Sensor' }),
      makeMsg({ name: 'Humidity Sensor', timestamp: 2000 }),
      makeMsg({ name: 'Pressure Gauge', timestamp: 3000 }),
      makeMsg({ name: 'Temp Monitor', timestamp: 4000 }),
      makeMsg({ name: 'Light Switch', timestamp: 5000 }),
    ];

    // Case-insensitive substring "sensor"
    const result = filterMessages(messages, { nodeName: 'sensor' });
    expect(result.messages).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.messages[0].name).toBe('Temperature Sensor');
    expect(result.messages[1].name).toBe('Humidity Sensor');
  });

  it('filters by nodeName is case-insensitive', () => {
    const messages = [
      makeMsg({ name: 'SENSOR Alpha' }),
      makeMsg({ name: 'sensor Beta', timestamp: 2000 }),
      makeMsg({ name: 'Sensor Gamma', timestamp: 3000 }),
    ];

    const result = filterMessages(messages, { nodeName: 'SENSOR' });
    expect(result.messages).toHaveLength(3);
  });

  it('filters by nodeName returns empty when no match', () => {
    const messages = makeMessages(5);
    const result = filterMessages(messages, { nodeName: 'zzz-not-found' });
    expect(result.messages).toHaveLength(0);
  });

  it('filters by nodeName handles nodes with null name', () => {
    const messages = [
      makeMsg({ name: null }),
      makeMsg({ name: 'Target Node', timestamp: 2000 }),
    ];
    const result = filterMessages(messages, { nodeName: 'target' });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].name).toBe('Target Node');
  });

  // --- 4.5: Filters by keyword in stringified message ---
  it('filters by keyword in stringified message', () => {
    const messages = [
      makeMsg({ msg: { payload: 'error: timeout' } }),
      makeMsg({ msg: { payload: 'success', status: 'error' }, timestamp: 2000 }),
      makeMsg({ msg: { payload: 'all good' }, timestamp: 3000 }),
      makeMsg({ msg: { error: 'something broke' }, timestamp: 4000 }),
    ];

    const result = filterMessages(messages, { keyword: 'error' });
    expect(result.messages).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('filters by keyword is case-insensitive', () => {
    const messages = [
      makeMsg({ msg: { payload: 'ERROR: critical' } }),
      makeMsg({ msg: { payload: 'Warning: Error' }, timestamp: 2000 }),
      makeMsg({ msg: { payload: 'ok' }, timestamp: 3000 }),
    ];

    const result = filterMessages(messages, { keyword: 'error' });
    expect(result.messages).toHaveLength(2);
  });

  it('filters by keyword handles null msg', () => {
    const messages = [
      makeMsg({ msg: null }),
      makeMsg({ msg: { payload: 'target' }, timestamp: 2000 }),
    ];
    const result = filterMessages(messages, { keyword: 'target' });
    expect(result.messages).toHaveLength(1);
  });

  // --- 4.6: Filters by after timestamp (inclusive lower bound) ---
  it('filters by after timestamp (inclusive lower bound)', () => {
    const messages = makeMessages(10); // timestamps 0, 100, ..., 900
    const result = filterMessages(messages, { after: 500 });
    expect(result.messages).toHaveLength(5);
    expect(result.total).toBe(5);
    // First message >= 500 should be timestamp 500
    expect(result.messages[0].timestamp).toBe(500);
    expect(result.messages[4].timestamp).toBe(900);
  });

  it('filters by after — inclusive means message at exact boundary is included', () => {
    const messages = makeMessages(5); // 0, 100, 200, 300, 400
    const result = filterMessages(messages, { after: 200 });
    expect(result.messages[0].timestamp).toBe(200);
    expect(result.total).toBe(3); // 200, 300, 400
  });

  // --- 4.7: Filters by before timestamp (inclusive upper bound) ---
  it('filters by before timestamp (inclusive upper bound)', () => {
    const messages = makeMessages(10); // timestamps 0, 100, ..., 900
    const result = filterMessages(messages, { before: 400 });
    expect(result.messages).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.messages[0].timestamp).toBe(0);
    expect(result.messages[4].timestamp).toBe(400);
  });

  it('filters by before — inclusive means message at exact boundary is included', () => {
    const messages = makeMessages(5); // 0, 100, 200, 300, 400
    const result = filterMessages(messages, { before: 200 });
    expect(result.messages[2].timestamp).toBe(200);
    expect(result.total).toBe(3); // 0, 100, 200
  });

  // --- 4.8: Filters by after + before together (time window) ---
  it('filters by after + before together (time window)', () => {
    const messages = makeMessages(20); // timestamps 0, 100, ..., 1900
    const result = filterMessages(messages, { after: 500, before: 1200 });
    expect(result.messages).toHaveLength(8); // 500, 600, ..., 1200
    expect(result.total).toBe(8);
    expect(result.messages[0].timestamp).toBe(500);
    expect(result.messages[7].timestamp).toBe(1200);
  });

  it('filters by after + before returns empty when window has no messages', () => {
    const messages = makeMessages(5); // 0, 100, 200, 300, 400
    const result = filterMessages(messages, { after: 1000, before: 2000 });
    expect(result.messages).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // --- 4.9: last: N returns the last N matching messages in chronological order ---
  it('with last: 5 returns the last 5 matching messages in chronological order', () => {
    const messages = makeMessages(20); // timestamps 0..1900
    const result = filterMessages(messages, { last: 5 });
    expect(result.messages).toHaveLength(5);
    expect(result.total).toBe(20);
    // Last 5 in chronological order means timestamps 1500, 1600, 1700, 1800, 1900
    expect(result.messages[0].timestamp).toBe(1500);
    expect(result.messages[4].timestamp).toBe(1900);
  });

  it('with last greater than total returns all messages in order', () => {
    const messages = makeMessages(5); // 0..400
    const result = filterMessages(messages, { last: 10 });
    expect(result.messages).toHaveLength(5);
    expect(result.messages[0].timestamp).toBe(0);
    expect(result.messages[4].timestamp).toBe(400);
  });

  it('last with additional filters returns last N of the filtered set', () => {
    const messages = makeMessages(20);
    // Give every other a specific nodeId
    for (let i = 0; i < messages.length; i += 2) {
      messages[i].id = 'target';
    }
    // So messages at indices 0,2,4,...,18 have id 'target' (10 messages total)
    // Timestamps: 0, 100, 200, 300, ..., 900 → for target: 0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800
    // Last 3: 1400, 1600, 1800
    const result = filterMessages(messages, { nodeId: 'target', last: 3 });
    expect(result.messages).toHaveLength(3);
    expect(result.total).toBe(10);
    expect(result.messages[0].timestamp).toBe(1400);
    expect(result.messages[2].timestamp).toBe(1800);
  });

  // --- 4.10: Error when both last and limit are provided ---
  it('returns error when both last and limit are provided', () => {
    const messages = makeMessages(10);
    const result = filterMessages(messages, { last: 5, limit: 10 });
    expect(result.messages).toBeUndefined();
    expect(result.error).toBe('last and limit are mutually exclusive — use one or the other');
  });

  // --- Additional: explicit limit works ---
  it('respects explicit limit parameter', () => {
    const messages = makeMessages(100);
    const result = filterMessages(messages, { limit: 10 });
    expect(result.messages).toHaveLength(10);
    expect(result.total).toBe(100);
    expect(result.messages[0].timestamp).toBe(0);
    expect(result.messages[9].timestamp).toBe(900);
  });

  // --- Additional: combined filters work together ---
  it('combines multiple filters (nodeId + keyword + time window)', () => {
    const messages = [
      makeMsg({ id: 'n1', msg: { text: 'alpha' }, timestamp: 100 }),
      makeMsg({ id: 'n1', msg: { text: 'beta' }, timestamp: 200 }),
      makeMsg({ id: 'n2', msg: { text: 'alpha' }, timestamp: 300 }),
      makeMsg({ id: 'n1', msg: { text: 'gamma' }, timestamp: 400 }),
      makeMsg({ id: 'n1', msg: { text: 'alpha beta' }, timestamp: 500 }),
      makeMsg({ id: 'n1', msg: { text: 'delta' }, timestamp: 600 }),
    ];

    const result = filterMessages(messages, {
      nodeId: 'n1',
      keyword: 'alpha',
      after: 100,
      before: 500,
    });

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].msg.text).toBe('alpha');
    expect(result.messages[1].msg.text).toBe('alpha beta');
  });
});

// ---------------------------------------------------------------------------
// CommsClient ring buffer
// ---------------------------------------------------------------------------

describe('CommsClient ring buffer', () => {
  // --- 4.11: Ring buffer evicts oldest when capacity exceeded ---
  it('evicts oldest when capacity exceeded', () => {
    // Set a small buffer size for the test (minimum is 10)
    process.env.NODE_RED_DEBUG_BUFFER_SIZE = '10';

    const client = new CommsClient({ baseUrl: 'http://localhost:1880' });
    expect(client.bufferSize).toBe(10);

    // Add more messages than the buffer can hold
    for (let i = 0; i < 15; i++) {
      const msg = makeMsg({ timestamp: i * 100, msg: { payload: `msg-${i}` } });
      client._testAddMessage(msg);
    }

    const result = client.getMessages();
    expect(result).toHaveLength(10);
    // Oldest 5 should be evicted; remaining should be indices 5-14
    expect(result[0].msg.payload).toBe('msg-5');
    expect(result[9].msg.payload).toBe('msg-14');

    // Clean up
    delete process.env.NODE_RED_DEBUG_BUFFER_SIZE;
  });

  it('getMessages returns a copy (not a reference to internal buffer)', () => {
    process.env.NODE_RED_DEBUG_BUFFER_SIZE = '10';
    const client = new CommsClient({ baseUrl: 'http://localhost:1880' });

    client._testAddMessage(makeMsg({ msg: { payload: 'original' } }));

    const copy1 = client.getMessages();
    // Modify the returned array — should not affect internal buffer
    copy1.length = 0;

    // Internal buffer should be unchanged
    const copy2 = client.getMessages();
    expect(copy2).toHaveLength(1);
    expect(copy2[0].msg.payload).toBe('original');

    delete process.env.NODE_RED_DEBUG_BUFFER_SIZE;
  });
});
