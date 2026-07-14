import { describe, it, expect } from 'vitest';
import { buildIR } from '../../src/renderer/ir-builder.js';

// ---------------------------------------------------------------------------
// Junction test fixtures
// ---------------------------------------------------------------------------

/** node → junction → node */
const flowSimple = [
  { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
  { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b']] },
  { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, wires: [] },
];

/** junction split: 1 source → junction → 3 targets */
const flowSplit = [
  { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
  { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b', 'c', 'd']] },
  { id: 'b', type: 'debug', name: 'B', x: 300, y: 60, wires: [] },
  { id: 'c', type: 'debug', name: 'C', x: 300, y: 100, wires: [] },
  { id: 'd', type: 'debug', name: 'D', x: 300, y: 140, wires: [] },
];

/** junction join: 2 sources → junction → 1 target */
const flowJoin = [
  { id: 'a', type: 'inject', name: 'A', x: 100, y: 80, wires: [['j']] },
  { id: 'b', type: 'inject', name: 'B', x: 100, y: 120, wires: [['j']] },
  { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['c']] },
  { id: 'c', type: 'debug', name: 'C', x: 300, y: 100, wires: [] },
];

/** junction → junction chain */
const flowChain = [
  { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j1']] },
  { id: 'j1', type: 'junction', name: '', x: 200, y: 100, wires: [['j2']] },
  { id: 'j2', type: 'junction', name: '', x: 300, y: 100, wires: [['b']] },
  { id: 'b', type: 'debug', name: 'B', x: 400, y: 100, wires: [] },
];

/** circular junction reference (j1↔j2) */
const flowCircular = [
  { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j1']] },
  { id: 'j1', type: 'junction', name: '', x: 200, y: 100, wires: [['j2']] },
  { id: 'j2', type: 'junction', name: '', x: 300, y: 100, wires: [['j1', 'b']] },
  { id: 'b', type: 'debug', name: 'B', x: 400, y: 100, wires: [] },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildIR — junction support', () => {
  // 6.1 / 6.2: junction IR node generation (isJunction flag, dimensions)

  it('includes junction in nodes[] with isJunction flag', () => {
    const ir = buildIR(flowSimple);
    const jn = ir.nodes.find((n) => n.id === 'j');
    expect(jn).toBeDefined();
    expect(jn.isJunction).toBe(true);
  });

  it('sets junction node dimensions from JUNCTION_STYLE.radius * 2', () => {
    const ir = buildIR(flowSimple);
    const jn = ir.nodes.find((n) => n.id === 'j');
    expect(jn.w).toBe(8); // radius 4 * 2
    expect(jn.h).toBe(8);
  });

  it('regular nodes keep standard dimensions and isJunction is false', () => {
    const ir = buildIR(flowSimple);
    const a = ir.nodes.find((n) => n.id === 'a');
    expect(a.isJunction).toBe(false);
    expect(a.w).toBe(100);
    expect(a.h).toBe(30);
  });

  // 6.2: wire resolution — simple node→junction→node

  it('resolves wire segment node→junction as direct link', () => {
    const ir = buildIR(flowSimple);
    const link = ir.links.find((l) => l.source.id === 'a' && l.target.id === 'j');
    expect(link).toBeDefined();
    expect(link.sourcePort).toBe(0);
  });

  it('resolves wire segment junction→node as direct link', () => {
    const ir = buildIR(flowSimple);
    const link = ir.links.find((l) => l.source.id === 'j' && l.target.id === 'b');
    expect(link).toBeDefined();
  });

  // 6.2: junction split (1 → N)

  it('junction split: source→junction segment exists', () => {
    const ir = buildIR(flowSplit);
    const inLink = ir.links.find((l) => l.source.id === 'a' && l.target.id === 'j');
    expect(inLink).toBeDefined();
  });

  it('junction split: junction has link to each downstream target', () => {
    const ir = buildIR(flowSplit);
    const targets = ir.links
      .filter((l) => l.source.id === 'j')
      .map((l) => l.target.id);
    expect(targets).toEqual(expect.arrayContaining(['b', 'c', 'd']));
    expect(targets).toHaveLength(3);
  });

  // 6.2: junction join (N → 1)

  it('junction join: each source has link to junction', () => {
    const ir = buildIR(flowJoin);
    const sources = ir.links
      .filter((l) => l.target.id === 'j')
      .map((l) => l.source.id);
    expect(sources).toEqual(expect.arrayContaining(['a', 'b']));
    expect(sources).toHaveLength(2);
  });

  it('junction join: junction→target link exists', () => {
    const ir = buildIR(flowJoin);
    const outLink = ir.links.find((l) => l.source.id === 'j' && l.target.id === 'c');
    expect(outLink).toBeDefined();
  });

  // 6.2: junction chain

  it('junction chain: produces links a→j1, j1→j2, j2→b', () => {
    const ir = buildIR(flowChain);
    expect(ir.links.find((l) => l.source.id === 'a' && l.target.id === 'j1')).toBeDefined();
    expect(ir.links.find((l) => l.source.id === 'j1' && l.target.id === 'j2')).toBeDefined();
    expect(ir.links.find((l) => l.source.id === 'j2' && l.target.id === 'b')).toBeDefined();
  });

  // 6.2: circular reference safety

  it('circular junction refs do not produce infinite links', () => {
    const ir = buildIR(flowCircular);
    // a→j1, j1→j2, j2→j1, j2→b — just 4 links, no explosion
    expect(ir.links.length).toBe(4);
  });

  it('circular junction refs still reach non-junction target', () => {
    const ir = buildIR(flowCircular);
    // j2→b should still exist
    const outLink = ir.links.find((l) => l.source.id === 'j2' && l.target.id === 'b');
    expect(outLink).toBeDefined();
  });

  // 6.1: junctions in groups

  it('junction belongs to its parent group', () => {
    const flowsWithGroup = [
      { id: 'g1', type: 'group', name: 'G', x: 50, y: 50, w: 300, h: 200, nodes: ['a', 'j', 'b'], style: {} },
      ...flowSimple,
    ];
    const ir = buildIR(flowsWithGroup);
    const group = ir.groups.find((g) => g.id === 'g1');
    expect(group.nodes).toContain('j');
  });
});

// ---------------------------------------------------------------------------
// Subflow instance name resolution
// ---------------------------------------------------------------------------

describe('buildIR — subflow instance name resolution', () => {
  const subflowDef = { id: 'sub1', type: 'subflow', name: 'My Subflow', in: [], out: [] };

  it('instance with explicit name uses its own name', () => {
    const flows = [
      subflowDef,
      { id: 'inst1', type: 'subflow:sub1', name: 'Custom Name', x: 100, y: 100, wires: [[]] },
    ];
    const ir = buildIR(flows);
    const inst = ir.nodes.find((n) => n.id === 'inst1');
    expect(inst.name).toBe('Custom Name');
  });

  it('instance without name falls back to subflow definition name', () => {
    const flows = [
      subflowDef,
      { id: 'inst1', type: 'subflow:sub1', name: '', x: 100, y: 100, wires: [[]] },
    ];
    const ir = buildIR(flows);
    const inst = ir.nodes.find((n) => n.id === 'inst1');
    expect(inst.name).toBe('My Subflow');
  });

  it('instance without name and missing definition uses type fallback', () => {
    const flows = [
      { id: 'inst1', type: 'subflow:missing', name: '', x: 100, y: 100, wires: [[]] },
    ];
    const ir = buildIR(flows);
    const inst = ir.nodes.find((n) => n.id === 'inst1');
    expect(inst.name).toBe('subflow:missing');
  });
});
