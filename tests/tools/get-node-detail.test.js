import { describe, it, expect } from 'vitest';
import { transformNodeDetail } from '../../src/tools/get-node-detail.js';

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
