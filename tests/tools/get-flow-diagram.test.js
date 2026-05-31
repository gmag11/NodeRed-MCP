import { describe, it, expect } from 'vitest';
import { generateMermaidDiagram, transformFlowDiagram } from '../../src/tools/get-flow-diagram.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'Flow 1', disabled: false });
const TAB2 = makeNode({ id: 'tab2', type: 'tab', label: 'Empty', disabled: false });

const INJECT = makeNode({ id: 'A', type: 'inject', z: 'tab1', name: 'Start', wires: [['B']] });
const FUNC = makeNode({ id: 'B', type: 'function', z: 'tab1', name: 'Process', wires: [['C']] });
const DEBUG = makeNode({ id: 'C', type: 'debug', z: 'tab1', name: '', wires: [] });
const DISABLED = makeNode({ id: 'D', type: 'change', z: 'tab1', name: 'Skip', d: true, wires: [['C']] });
const SWITCH = makeNode({ id: 'SW', type: 'switch', z: 'tab1', name: 'Route', wires: [['B'], ['C']] });

const ALL_NODES = [TAB1, TAB2, INJECT, FUNC, DEBUG, DISABLED, SWITCH];
const RAW = { flows: ALL_NODES };

// ---------------------------------------------------------------------------
// generateMermaidDiagram
// ---------------------------------------------------------------------------
describe('generateMermaidDiagram', () => {
  it('starts with flowchart TD', () => {
    const diagram = generateMermaidDiagram([INJECT, FUNC, DEBUG]);
    expect(diagram).toMatch(/^flowchart TD/);
  });

  it('uses name as label when available', () => {
    const diagram = generateMermaidDiagram([INJECT]);
    expect(diagram).toContain('"Start"');
  });

  it('uses type as label when name is absent', () => {
    const diagram = generateMermaidDiagram([DEBUG]);
    expect(diagram).toContain('"debug"');
  });

  it('generates edges for wire connections', () => {
    const diagram = generateMermaidDiagram([INJECT, FUNC, DEBUG]);
    expect(diagram).toContain('A --> B');
    expect(diagram).toContain('B --> C');
  });

  it('does not generate edges to nodes outside the current set', () => {
    // Only A, B — C is not in the list
    const diagram = generateMermaidDiagram([INJECT, FUNC]);
    expect(diagram).not.toContain('B --> C');
  });

  it('marks disabled nodes with :::disabled class', () => {
    const diagram = generateMermaidDiagram([INJECT, DISABLED]);
    expect(diagram).toContain(':::disabled');
  });

  it('includes classDef disabled when any disabled node exists', () => {
    const diagram = generateMermaidDiagram([INJECT, DISABLED]);
    expect(diagram).toContain('classDef disabled');
  });

  it('does NOT include classDef disabled when no disabled nodes', () => {
    const diagram = generateMermaidDiagram([INJECT, FUNC, DEBUG]);
    expect(diagram).not.toContain('classDef disabled');
  });

  it('labels multi-output edges with out1, out2', () => {
    const diagram = generateMermaidDiagram([SWITCH, FUNC, DEBUG]);
    expect(diagram).toContain('|out1|');
    expect(diagram).toContain('|out2|');
  });

  it('does NOT label single-output edges', () => {
    const diagram = generateMermaidDiagram([INJECT, FUNC, DEBUG]);
    expect(diagram).not.toContain('|out1|');
  });

  it('returns empty flow comment for empty array', () => {
    const diagram = generateMermaidDiagram([]);
    expect(diagram).toContain('%% Empty flow');
  });
});

// ---------------------------------------------------------------------------
// transformFlowDiagram
// ---------------------------------------------------------------------------
describe('transformFlowDiagram', () => {
  it('returns a diagram string and pagination metadata', () => {
    const result = transformFlowDiagram(RAW, 'tab1');
    expect(result.flowId).toBe('tab1');
    expect(typeof result.diagram).toBe('string');
    expect(result.diagram).toMatch(/^flowchart TD/);
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('offset');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('hasMore');
  });

  it('throws for unknown flowId', () => {
    expect(() => transformFlowDiagram(RAW, 'nonexistent')).toThrow(/Flow not found/);
  });

  it('returns empty diagram comment for an empty flow', () => {
    const result = transformFlowDiagram(RAW, 'tab2');
    expect(result.diagram).toContain('%% Empty flow');
    expect(result.totalCount).toBe(0);
  });

  it('subgraph filter downstream limits diagram nodes', () => {
    // A→B→C chain; D has incoming wire to C; SW has multiple outputs
    // From A downstream: A, B, C
    const result = transformFlowDiagram(RAW, 'tab1', { fromNodeId: 'A', direction: 'downstream' });
    expect(result.diagram).toContain('A');
    expect(result.diagram).toContain('B');
    expect(result.diagram).toContain('C');
    expect(result.diagram).not.toContain('D[');
    expect(result.diagram).not.toContain('SW[');
  });

  it('subgraph filter upstream from C includes D and B and A', () => {
    const result = transformFlowDiagram(RAW, 'tab1', { fromNodeId: 'C', direction: 'upstream' });
    // C has upstream sources: B→C and D→C
    const ids = result.diagram;
    expect(ids).toContain('C');
    expect(ids).toContain('B');
    expect(ids).toContain('D');
  });

  it('subgraph filter both from B returns full component', () => {
    // Simplified fixture without SW to keep chain clear
    const nodes = [
      TAB1,
      makeNode({ id: 'X', type: 'inject', z: 'tab1', wires: [['Y']] }),
      makeNode({ id: 'Y', type: 'function', z: 'tab1', wires: [['Z']] }),
      makeNode({ id: 'Z', type: 'debug', z: 'tab1', wires: [] }),
    ];
    const raw = { flows: nodes };
    const result = transformFlowDiagram(raw, 'tab1', { fromNodeId: 'Y', direction: 'both' });
    expect(result.diagram).toContain('X');
    expect(result.diagram).toContain('Y');
    expect(result.diagram).toContain('Z');
  });

  it('pagination returns correct hasMore', () => {
    const manyNodes = [
      TAB1,
      ...Array.from({ length: 80 }, (_, i) =>
        makeNode({ id: `p${i}`, type: 'debug', z: 'tab1', wires: [] })
      ),
    ];
    const raw = { flows: manyNodes };
    const page1 = transformFlowDiagram(raw, 'tab1', { offset: 0, limit: 50 });
    expect(page1.hasMore).toBe(true);
    expect(page1.totalCount).toBe(80);

    const page2 = transformFlowDiagram(raw, 'tab1', { offset: 50, limit: 50 });
    expect(page2.hasMore).toBe(false);
    expect(page2.nodes).toBeUndefined(); // diagram response has 'diagram', not 'nodes'
  });
});
