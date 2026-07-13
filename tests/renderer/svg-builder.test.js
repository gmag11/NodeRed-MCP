import { describe, it, expect } from 'vitest';
import { buildSVG } from '../../src/renderer/svg-builder.js';
import { buildIR } from '../../src/renderer/ir-builder.js';

function makeNode(overrides = {}) {
  return {
    type: 'inject', x: 100, y: 100, wires: [], ...overrides,
  };
}

describe('buildSVG', () => {
  it('returns a valid SVG string with svg tag', () => {
    const flows = [
      { id: 'n1', ...makeNode({ name: 'Start', wires: [['n2']] }) },
      { id: 'n2', ...makeNode({ type: 'debug', name: 'Log', x: 300, wires: [] }) },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('contains grid pattern', () => {
    const flows = [{ id: 'n1', ...makeNode() }];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('pattern id="grid"');
    expect(svg).toContain('fill="url(#grid)"');
  });

  it('renders node rect elements', () => {
    const flows = [
      { id: 'n1', ...makeNode({ name: 'Start', type: 'inject' }) },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('<rect');
    expect(svg).toContain('Start');
  });

  it('renders link paths for connected nodes', () => {
    const flows = [
      { id: 'n1', ...makeNode({ name: 'A', wires: [['n2']] }) },
      { id: 'n2', ...makeNode({ type: 'debug', name: 'B', x: 300, wires: [] }) },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('<path');
    expect(svg).toContain('C ');
  });

  it('renders disabled nodes with dashed style', () => {
    const flows = [
      { id: 'n1', ...makeNode({ d: true }) },
      { id: 'n2', ...makeNode({ type: 'debug', name: 'B', x: 300, d: true }) },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('stroke-dasharray');
  });

  it('includes legend when dirty nodes present', () => {
    const flows = [
      { id: 'n1', ...makeNode({ name: 'Dirty' }) },
    ];
    const dirtyNodeIds = new Set(['n1']);
    const ir = buildIR(flows, { highlightDirty: true, dirtyNodeIds });
    const svg = buildSVG(ir);
    expect(svg).toContain('Un-deployed');
  });

  it('handles empty flow gracefully', () => {
    const ir = buildIR([]);
    const svg = buildSVG(ir);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('</svg>');
  });

  it('renders groups as dashed containers', () => {
    const flows = [
      { id: 'g1', type: 'group', name: 'G', style: {}, x: 80, y: 80, w: 140, h: 70, nodes: ['n1'] },
      { id: 'n1', ...makeNode({ name: 'N', z: undefined }) },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('stroke-dasharray');
    expect(svg).toContain('G');
  });

  // Junction rendering (6.3)

  it('renders junction as circle element with class nr-junction', () => {
    const flows = [
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('class="nr-junction"');
    expect(svg).toContain('<circle');
  });

  it('junction circle has correct fill and stroke from JUNCTION_STYLE', () => {
    const flows = [
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    expect(svg).toContain('fill="#999999"');
    expect(svg).toContain('stroke="#666666"');
  });

  it('junction has no text label', () => {
    const flows = [
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    // Junction circle line should not contain <text>
    const junctionLine = svg.split('\n').find((l) => l.includes('nr-junction'));
    expect(junctionLine).not.toContain('<text');
  });

  it('junction wire segments: node→junction and junction→node both rendered', () => {
    const flows = [
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, wires: [] },
    ];
    const ir = buildIR(flows);
    const svg = buildSVG(ir);
    // Should have at least 2 nr-link paths (a→j and j→b)
    const linkCount = (svg.match(/class="nr-link"/g) || []).length;
    expect(linkCount).toBe(2);
  });
});
