import { describe, it, expect } from 'vitest';
import { paginateNodes } from '../../src/tools/get-palette-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNodeSet = (overrides) => ({
  id: 'node-red/default',
  name: 'default',
  module: 'node-red',
  version: '4.0.0',
  enabled: true,
  types: [],
  ...overrides,
});

const ALL_MODS = [
  makeNodeSet({ id: '@node-red/nodes/core', module: '@node-red/nodes', types: ['inject', 'debug', 'complete'] }),
  makeNodeSet({ id: 'node-red-node-http/http', module: 'node-red-node-http', version: '1.2.0', types: ['http in', 'http out'] }),
  makeNodeSet({ id: 'some-disabled-module/set', module: 'some-disabled-module', version: '0.1.0', enabled: false, types: ['zzz-disabled'] }),
];

// ---------------------------------------------------------------------------
// paginateNodes
// ---------------------------------------------------------------------------

const makeNodes = (count) =>
  Array.from({ length: count }, (_, i) => ({ id: `mod/type-${String(i).padStart(3, '0')}` }));

describe('paginateNodes', () => {
  it('returns correct first page with defaults', () => {
    const nodes = makeNodes(120);
    const result = paginateNodes(nodes);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(50);
    expect(result.total).toBe(120);
    expect(result.totalPages).toBe(3);
    expect(result.nodes).toHaveLength(50);
    expect(result.nodes[0].id).toBe('mod/type-000');
  });

  it('pagination returns correct slice, total, and totalPages', () => {
    const nodes = makeNodes(120);
    const result = paginateNodes(nodes, 2, 50);
    expect(result.page).toBe(2);
    expect(result.total).toBe(120);
    expect(result.totalPages).toBe(3);
    expect(result.nodes).toHaveLength(50);
    expect(result.nodes[0].id).toBe('mod/type-050');
  });

  it('last page returns the remaining items', () => {
    const nodes = makeNodes(120);
    const result = paginateNodes(nodes, 3, 50);
    expect(result.nodes).toHaveLength(20);
    expect(result.nodes[0].id).toBe('mod/type-100');
  });

  it('clamps pageSize to 200 when exceeded', () => {
    const nodes = makeNodes(10);
    const result = paginateNodes(nodes, 1, 500);
    expect(result.pageSize).toBe(200);
    expect(result.nodes).toHaveLength(10);
  });

  it('out-of-range page returns empty nodes with correct totals', () => {
    const nodes = makeNodes(50);
    const result = paginateNodes(nodes, 99, 50);
    expect(result.nodes).toHaveLength(0);
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(1);
  });

  it('returns raw node set objects unchanged', () => {
    const result = paginateNodes(ALL_MODS, 1, 10);
    expect(result.nodes[0]).toBe(ALL_MODS[0]);
  });

  it('disabled node sets are included in results', () => {
    const result = paginateNodes(ALL_MODS, 1, 10);
    const disabled = result.nodes.find((n) => n.module === 'some-disabled-module');
    expect(disabled).toBeDefined();
    expect(disabled.enabled).toBe(false);
  });
});
