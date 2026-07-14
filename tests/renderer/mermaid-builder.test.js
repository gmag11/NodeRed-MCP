import { describe, it, expect } from 'vitest';
import { buildMermaid } from '../../src/renderer/mermaid-builder.js';
import { buildIR } from '../../src/renderer/ir-builder.js';

function makeNode(overrides = {}) {
  return { type: 'inject', wires: [], ...overrides };
}

describe('buildMermaid', () => {
  it('starts with flowchart TD', () => {
    const flows = [{ id: 'A', ...makeNode({ name: 'Start' }) }];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toMatch(/^flowchart TD/);
  });

  it('renders node labels using name', () => {
    const flows = [{ id: 'A', ...makeNode({ name: 'Start' }) }];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('"Start"');
  });

  it('renders edges for connected nodes', () => {
    const flows = [
      { id: 'A', ...makeNode({ name: 'A', wires: [['B']] }) },
      { id: 'B', ...makeNode({ type: 'debug', name: 'B', x: 300, wires: [] }) },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('A --> B');
  });

  it('includes classDef dirty when dirty nodes present', () => {
    const flows = [{ id: 'A', ...makeNode({ name: 'Dirty' }) }];
    const dirtyNodeIds = new Set(['A']);
    const ir = buildIR(flows, { highlightDirty: true, dirtyNodeIds });
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('classDef dirty');
  });

  it('does NOT include classDef dirty when no dirty nodes', () => {
    const flows = [{ id: 'A', ...makeNode({ name: 'Clean' }) }];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).not.toContain('classDef dirty');
  });

  it('includes classDef disabled when disabled nodes present', () => {
    const flows = [{ id: 'A', ...makeNode({ name: 'Off', d: true }) }];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('classDef disabled');
  });

  it('labels multi-output edges', () => {
    const flows = [
      { id: 'SW', ...makeNode({ type: 'switch', name: 'Route', wires: [['B'], ['C']] }) },
      { id: 'B', ...makeNode({ type: 'function', name: 'Proc', x: 200, wires: [] }) },
      { id: 'C', ...makeNode({ type: 'debug', name: 'Log', x: 200, y: 100, wires: [] }) },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('|out1|');
    expect(diagram).toContain('|out2|');
  });

  it('renders group subgraph with style', () => {
    const flows = [
      { id: 'grp1', type: 'group', name: 'G', style: { fill: '#ff0' }, nodes: ['A'] },
      { id: 'A', ...makeNode({ name: 'Start' }) },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('subgraph grp1["G"]');
    expect(diagram).toContain('style grp1 fill:#ff0');
  });

  it('returns empty flow message for no nodes', () => {
    const ir = buildIR([]);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('%% Empty flow');
  });

  // Junction rendering (6.4)

  it('renders junction as circle node with (()) syntax', () => {
    const flows = [
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('j(())');
  });

  it('junction circle node has junctionClass', () => {
    const flows = [
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('j(()):::junctionClass');
  });

  it('junctionClass uses JUNCTION_STYLE colors', () => {
    const flows = [
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('classDef junctionClass');
    expect(diagram).toContain('fill:#999999');
    expect(diagram).toContain('stroke:#666666');
  });

  it('no junctionClass when no junctions present', () => {
    const flows = [{ id: 'A', type: 'inject', name: 'A', wires: [] }];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).not.toContain('junctionClass');
  });

  it('junction wires rendered as hop segments', () => {
    const flows = [
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toMatch(/a --> j/);
    expect(diagram).toMatch(/j --> b/);
  });

  // Subflow instance rendering

  it('subflow instance label includes [Subflow] prefix and resolved name', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: '', x: 100, y: 100, wires: [[]] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('"');
    expect(diagram).toContain('[Subflow] init');
  });

  it('subflow instance with explicit name shows name without prefix', () => {
    const flows = [
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: 'My Custom', x: 100, y: 100, wires: [[]] },
    ];
    const ir = buildIR(flows);
    const diagram = buildMermaid(ir);
    expect(diagram).toContain('[Subflow] My Custom');
  });
});
