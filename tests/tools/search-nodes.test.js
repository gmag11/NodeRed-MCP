import { describe, it, expect, vi } from 'vitest';
import { searchNodes, handleSearchNodes } from '../../src/tools/search-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'My Flow' });
const TAB2 = makeNode({ id: 'tab2', type: 'tab', label: 'Empty Flow' });

const FUNC_NODE = makeNode({
  id: 'n1', type: 'function', z: 'tab1', name: 'Transform',
  func: 'var test = msg.payload;\nreturn msg;',
  outputs: 2, wires: [['n2'], ['n3']],
});

const TMPL_NODE = makeNode({
  id: 'n2', type: 'template', z: 'tab1', name: '',
  template: '<h1>{{payload}}</h1>', field: 'payload', syntax: 'mustache', wires: [],
});

const DEBUG_NODE = makeNode({
  id: 'n3', type: 'debug', z: 'tab1', name: 'debug',
  active: true, tosidebar: true, console: false, wires: [],
});

const DISABLED_NODE = makeNode({
  id: 'n4', type: 'inject', z: 'tab1', name: 'Timer', d: true, wires: [['n1']],
});

const SUBFLOW_DEF = makeNode({
  id: 'sub1', type: 'subflow', z: '', name: 'My Subflow',
  in: [], out: [],
});

const MQTT_NODE = makeNode({
  id: 'n5', type: 'mqtt in', z: 'tab1', name: 'MQTT Input',
  topic: 'test/+/data', broker: 'broker1', wires: [],
});

const SENSOR_NODE_1 = makeNode({
  id: 'n6', type: 'inject', z: 'tab2', name: 'sensor1',
  payload: 'sensor_reading', wires: [],
});

const SENSOR_NODE_2 = makeNode({
  id: 'n7', type: 'inject', z: 'tab2', name: 'temperature_sensor',
  payload: 'temp_42', wires: [],
});

const ALL_NODES = [
  TAB1, TAB2,
  FUNC_NODE, TMPL_NODE, DEBUG_NODE, DISABLED_NODE, MQTT_NODE,
  SENSOR_NODE_1, SENSOR_NODE_2,
  SUBFLOW_DEF,
];

// ---------------------------------------------------------------------------
// searchNodes (pure function)
// ---------------------------------------------------------------------------

describe('searchNodes', () => {
  // 3.2 — plain text, name substring
  it('finds node by name substring (case-insensitive, plain text mode)', () => {
    const result = searchNodes(ALL_NODES, { query: 'sensor' });
    expect(result.total).toBe(2);
    const ids = result.results.map((r) => r.nodeId).sort();
    expect(ids).toEqual(['n6', 'n7']);
    // Verify result shape
    const r = result.results.find((x) => x.nodeId === 'n6');
    expect(r).toMatchObject({
      flowId: 'tab2',
      flowLabel: 'Empty Flow',
      nodeId: 'n6',
      type: 'inject',
      name: 'sensor1',
    });
  });

  // 3.3 — deep field match (func body)
  it('finds node by content in a deep field (func body)', () => {
    const result = searchNodes(ALL_NODES, { query: 'var test' });
    expect(result.total).toBe(1);
    expect(result.results[0].nodeId).toBe('n1');
  });

  // 3.4 — property value match (topic)
  it('finds node by a property value (topic contains the query)', () => {
    const result = searchNodes(ALL_NODES, { query: 'test/+/data' });
    expect(result.total).toBe(1);
    expect(result.results[0].nodeId).toBe('n5');
  });

  // 3.5 — regex match
  it('matches by regex pattern across all fields', () => {
    // temp_\d+ matches "temp_42" inside the payload of SENSOR_NODE_2
    const result = searchNodes(ALL_NODES, { query: 'temp_\\d+', regex: true });
    expect(result.total).toBe(1);
    expect(result.results[0].nodeId).toBe('n7');
  });

  // 3.6 — invalid regex
  it('returns error for invalid regex pattern', () => {
    expect(() => searchNodes(ALL_NODES, { query: '[invalid', regex: true }))
      .toThrow(/Invalid regex pattern/);
  });

  // 3.7 — excludes tab and subflow-definition nodes
  it('excludes tab and subflow-definition nodes from results', () => {
    // Search for a term that would match a tab label — should not return tabs
    const result = searchNodes(ALL_NODES, { query: 'flow' });
    // The tab "My Flow" and "Empty Flow" contain "flow", but tabs should not be in results
    const types = result.results.map((r) => r.type);
    expect(types).not.toContain('tab');
    expect(types).not.toContain('subflow');
    // The subflow def named "My Subflow" also should not appear
    const ids = result.results.map((r) => r.nodeId);
    expect(ids).not.toContain('tab1');
    expect(ids).not.toContain('sub1');
  });

  // 3.8 — flowLabel in results
  it('includes flowLabel from the flow index', () => {
    const result = searchNodes(ALL_NODES, { query: 'Transform' });
    expect(result.total).toBe(1);
    expect(result.results[0].flowLabel).toBe('My Flow');
  });

  // 3.9 — limit and truncated
  it('respects limit and sets truncated: true when results are cut', () => {
    // Search for something that matches many nodes (e.g., all nodes have "node" in their serialized form — but let's search for something more targeted)
    // Actually, let's use a term that appears in many nodes. All inject nodes have "inject" in their type.
    // But we only have 2 inject nodes. Let me think of a broader match...
    // "msg" appears in the func body of n1. Let's instead search for common JSON keys like "wires" which appears in every node.
    const result = searchNodes(ALL_NODES, { query: 'wires', limit: 2 });
    expect(result.results).toHaveLength(2);
    expect(result.total).toBeGreaterThan(2);
    expect(result.truncated).toBe(true);
  });

  it('sets truncated: false when results do not exceed limit', () => {
    const result = searchNodes(ALL_NODES, { query: 'Transform', limit: 50 });
    expect(result.truncated).toBe(false);
  });

  // 3.11 — empty results
  it('returns empty results when no match is found', () => {
    const result = searchNodes(ALL_NODES, { query: 'zzzz_nonexistent_query_zzzz' });
    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.truncated).toBe(false);
  });

  // 3.12 — flowId scoping
  it('scoped to a flowId only returns nodes from that flow', () => {
    // Search for "sensor" across all flows first
    const fullResult = searchNodes(ALL_NODES, { query: 'sensor' });
    expect(fullResult.total).toBe(2);

    // Now scope to tab2 only
    const scoped = searchNodes(ALL_NODES, { query: 'sensor', flowId: 'tab2' });
    expect(scoped.total).toBe(2); // both sensor nodes are in tab2
    for (const r of scoped.results) {
      expect(r.flowId).toBe('tab2');
    }

    // Scope to tab1 — should get 0
    const tab1Scoped = searchNodes(ALL_NODES, { query: 'sensor', flowId: 'tab1' });
    expect(tab1Scoped.total).toBe(0);
    expect(tab1Scoped.results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// handleSearchNodes (handler)
// ---------------------------------------------------------------------------

describe('handleSearchNodes', () => {
  // 3.10 — query empty or missing
  it('returns error when query is missing', async () => {
    const mockClient = { request: vi.fn() };
    await expect(handleSearchNodes(mockClient, { query: '' }))
      .rejects.toThrow(/required and must be non-empty/);
  });

  it('returns error when query is empty string', async () => {
    const mockClient = { request: vi.fn() };
    await expect(handleSearchNodes(mockClient, { query: '  ' }))
      .rejects.toThrow(/required and must be non-empty/);
  });

  // 3.13 — invalid flowId
  it('returns error when flowId is provided but does not exist', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue({ flows: ALL_NODES }),
    };
    await expect(handleSearchNodes(mockClient, { query: 'test', flowId: 'nonexistent' }))
      .rejects.toThrow(/Flow not found/);
  });

  // Happy path test
  it('returns search results for a valid query', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue({ flows: ALL_NODES }),
    };
    const response = await handleSearchNodes(mockClient, { query: 'Transform' });
    const result = JSON.parse(response.content[0].text);
    expect(result.total).toBe(1);
    expect(result.results[0].nodeId).toBe('n1');
    expect(result.truncated).toBe(false);
  });

  it('works with valid flowId scoping', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue({ flows: ALL_NODES }),
    };
    const response = await handleSearchNodes(mockClient, { query: 'sensor', flowId: 'tab2' });
    const result = JSON.parse(response.content[0].text);
    expect(result.total).toBe(2);
    for (const r of result.results) {
      expect(r.flowId).toBe('tab2');
    }
  });

  it('passes regex and limit options through', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue({ flows: ALL_NODES }),
    };
    const response = await handleSearchNodes(mockClient, {
      query: '"type"',
      regex: true,
      limit: 1,
    });
    const result = JSON.parse(response.content[0].text);
    expect(result.results).toHaveLength(1);
    expect(result.truncated).toBe(true);
  });
});
