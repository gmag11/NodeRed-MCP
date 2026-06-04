import { describe, it, expect, vi } from 'vitest';
import { transformNodeDetail, handleGetNodeDetail } from '../../src/tools/get-node-detail.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'My Flow', disabled: false });

const FUNC_NODE = makeNode({
  id: 'n1', type: 'function', z: 'tab1', name: 'Transform',
  func: 'return msg;', outputs: 2, wires: [['n2'], ['n3']],
});
const TMPL_NODE = makeNode({
  id: 'n2', type: 'template', z: 'tab1', name: 'Render',
  template: '<h1>{{payload}}</h1>', field: 'payload', syntax: 'mustache', wires: [],
});
const DEBUG_NODE = makeNode({
  id: 'n3', type: 'debug', z: 'tab1', active: true, tosidebar: true, console: false, wires: [],
});

const ALL_NODES = [TAB1, FUNC_NODE, TMPL_NODE, DEBUG_NODE];
const RAW = { flows: ALL_NODES };

// ---------------------------------------------------------------------------
// transformNodeDetail
// ---------------------------------------------------------------------------

describe('transformNodeDetail', () => {
  it('returns full node detail including func for a function node', () => {
    const result = transformNodeDetail(RAW, 'n1');
    expect(result.id).toBe('n1');
    expect(result.type).toBe('function');
    expect(result.func).toBe('return msg;');
    expect(result.outputs).toBe(2);
    expect(result.name).toBe('Transform');
  });

  it('returns full node detail including template for a template node', () => {
    const result = transformNodeDetail(RAW, 'n2');
    expect(result.id).toBe('n2');
    expect(result.type).toBe('template');
    expect(result.template).toBe('<h1>{{payload}}</h1>');
    expect(result.field).toBe('payload');
    expect(result.syntax).toBe('mustache');
  });

  it('returns full node detail for a standard node with all config fields', () => {
    const result = transformNodeDetail(RAW, 'n3');
    expect(result.id).toBe('n3');
    expect(result.type).toBe('debug');
    expect(result.active).toBe(true);
    expect(result.tosidebar).toBe(true);
    expect(result.console).toBe(false);
  });

  it('throws when nodeId is not found', () => {
    expect(() => transformNodeDetail(RAW, 'does-not-exist')).toThrow("Node 'does-not-exist' not found");
  });
});

// ---------------------------------------------------------------------------
// handleGetNodeDetail — credential metadata
// ---------------------------------------------------------------------------

describe('handleGetNodeDetail credential metadata', () => {
  /** Build a flow with an MQTT broker config node */
  const makeFlowsWithBroker = () => {
    const mqttNode = {
      id: 'mqtt-1',
      type: 'mqtt-broker',
      name: 'My MQTT',
      broker: 'localhost',
      port: '1883',
    };
    return { rev: 'rev-1', flows: [mqttNode] };
  };

  it('includes _credentials metadata when the credentials endpoint returns data', async () => {
    const rawResponse = makeFlowsWithBroker();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)                          // GET /flows
        .mockResolvedValueOnce({ user: 'test67', has_password: true }), // GET /credentials
    };

    const result = await handleGetNodeDetail(client, { nodeId: 'mqtt-1' });
    const parsed = JSON.parse(result.content[0].text);

    // Node fields should be present
    expect(parsed.id).toBe('mqtt-1');
    expect(parsed.type).toBe('mqtt-broker');
    expect(parsed.broker).toBe('localhost');

    // Credential metadata should be present under _credentials
    expect(parsed._credentials).toEqual({
      user: 'test67',
      has_password: true,
    });
    // Password value should NEVER be exposed
    expect(parsed._credentials.password).toBeUndefined();
  });

  it('does not include _credentials when the endpoint returns empty object', async () => {
    const rawResponse = makeFlowsWithBroker();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)   // GET /flows
        .mockResolvedValueOnce({}),            // GET /credentials (empty)
    };

    const result = await handleGetNodeDetail(client, { nodeId: 'mqtt-1' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.id).toBe('mqtt-1');
    expect(parsed._credentials).toBeUndefined();
  });

  it('does not include _credentials when the endpoint fails', async () => {
    const rawResponse = makeFlowsWithBroker();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)                       // GET /flows
        .mockRejectedValueOnce(new Error('Not Found')),           // GET /credentials fails
    };

    const result = await handleGetNodeDetail(client, { nodeId: 'mqtt-1' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.id).toBe('mqtt-1');
    expect(parsed._credentials).toBeUndefined();
  });
});
