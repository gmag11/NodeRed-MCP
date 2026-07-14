import { describe, it, expect } from 'vitest';
import { buildHTML } from '../../src/renderer/html-builder.js';

describe('buildHTML', () => {
  const flowsWithTwoTabs = [
    { id: 'tab1', type: 'tab', label: 'Main Flow', z: '' },
    { id: 'tab2', type: 'tab', label: 'Utils', z: '' },
    { id: 'n1', type: 'inject', name: 'Start', x: 100, y: 100, z: 'tab1', wires: [['n2']] },
    { id: 'n2', type: 'debug', name: 'Log', x: 300, y: 100, z: 'tab1', wires: [] },
    { id: 'n3', type: 'function', name: 'Helper', x: 100, y: 100, z: 'tab2', wires: [] },
  ];

  const flowsWithOneTab = [
    { id: 'tab1', type: 'tab', label: 'Only', z: '' },
    { id: 'n1', type: 'inject', name: 'Solo', x: 100, y: 100, z: 'tab1', wires: [] },
  ];

  const flowsNoTabs = [
    { id: 'n1', type: 'inject', name: 'Untabbed', x: 100, y: 100, wires: [] },
  ];

  it('returns a complete HTML document', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('contains tab bar with multiple tabs', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('Main Flow');
    expect(html).toContain('Utils');
    expect(html).toContain('tab-bar');
  });

  it('contains D3.js CDN script', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('d3.v7.min.js');
  });

  it('contains WebSocket client code', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('staging-ws');
    expect(html).toContain('WebSocket');
  });

  it('embeds flow data as ALL_FLOWS', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('ALL_FLOWS');
  });

  it('has tab switching logic', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('switchTab');
    expect(html).toContain('buildTabData');
  });

  it('has zoom state preservation', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('zoomState');
  });

  it('has dirty highlighting support', () => {
    const html = buildHTML(flowsWithTwoTabs, { highlightDirty: true, dirtyNodeIds: new Set(['n1']) });
    expect(html).toContain('DIRTY_NODE_IDS');
    expect(html).toContain('nr-node-dirty');
  });

  it('has refresh button', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('btn-refresh');
    expect(html).toContain('Refresh');
  });

  it('excludes config nodes (no wires property) from rendering', () => {
    const flowsWithConfig = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'n1', type: 'inject', name: 'A', x: 100, y: 100, z: 'tab1', wires: [] },
      { id: 'cfg1', type: 'ui-group', name: 'ConfigNode', z: 'tab1' }, // no wires!
    ];
    const html = buildHTML(flowsWithConfig);
    // ui-group shouldn't appear as a node label in the tab data
    expect(html).toContain('Array.isArray(n.wires)');
  });

  it('has reconnect banner', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('Disconnected');
    expect(html).toContain('retrying');
  });

  it('handles empty flows gracefully', () => {
    const html = buildHTML([]);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('No nodes');
  });

  it('handles flows with no tab nodes', () => {
    const html = buildHTML(flowsNoTabs);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('ALL_FLOWS');
  });

  it('shows tab bar with a single tab', () => {
    const html = buildHTML(flowsWithOneTab);
    // Single tab should still show the tab bar
    expect(html).toContain('Only');
    expect(html).toContain('tab-bar');
    expect(html).toContain('with-tabs');
  });

  describe('refresh button confirmation dialog', () => {
    it('includes confirmation check for dirty nodes before refresh', () => {
      const html = buildHTML(flowsWithTwoTabs, { highlightDirty: true, dirtyNodeIds: new Set(['n1']) });
      expect(html).toContain('DIRTY_NODE_IDS.size > 0');
      expect(html).toContain('confirm(');
    });

    it('contains the warning message in English', () => {
      const html = buildHTML(flowsWithTwoTabs);
      expect(html).toContain('Warning: You have un-deployed changes.');
      expect(html).toContain('Refreshing will permanently discard all pending changes.');
      expect(html).toContain('Are you sure you want to continue?');
    });

    it('cancels refresh when user declines the confirmation', () => {
      const html = buildHTML(flowsWithTwoTabs);
      expect(html).toMatch(/if\s*\(\s*!\s*confirm\s*\(/);
      expect(html).toContain('return;');
    });
  });

  // Junction rendering (6.5)

  it('includes junction nodes in ALL_FLOWS data', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, z: 'tab1', wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, z: 'tab1', wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, z: 'tab1', wires: [] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('"type":"junction"');
  });

  it('generates isJunction flag in D3 node data', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, z: 'tab1', wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, z: 'tab1', wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, z: 'tab1', wires: [] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('isJunction');
    expect(html).toContain('isJunction: isJunction');
  });

  it('renders junction as D3 circle element in entry selection', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, z: 'tab1', wires: [] },
    ];
    const html = buildHTML(flows);
    // Should have D3 circle append for junction, not rect+text
    expect(html).toContain('filter(function(d) { return d.isJunction; }).append("circle")');
  });

  it('junction wire link uses direct lookup not resolution helper', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'a', type: 'inject', name: 'A', x: 100, y: 100, z: 'tab1', wires: [['j']] },
      { id: 'j', type: 'junction', name: '', x: 200, y: 100, z: 'tab1', wires: [['b']] },
      { id: 'b', type: 'debug', name: 'B', x: 300, y: 100, z: 'tab1', wires: [] },
    ];
    const html = buildHTML(flows);
    // Link building uses .find directly, not resolveTargets
    expect(html).toContain('tn = nodes.find');
    expect(html).not.toContain('resolveTargets');
  });

  // Subflow instance rendering

  it('includes getSubflowInstanceName function', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: '', z: 'tab1', x: 100, y: 100, wires: [[]] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('getSubflowInstanceName');
  });

  it('subflow instance name is resolved in buildTabData', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: '', z: 'tab1', x: 100, y: 100, wires: [[]] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('getSubflowInstanceName(n)');
  });

  it('subflow instance nodes have subflow-instance CSS class', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: '', z: 'tab1', x: 100, y: 100, wires: [[]] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('subflow-instance');
    expect(html).toContain('startsWith("subflow:")');
  });

  it('subflow instance has badge rendering in D3 code', () => {
    const flows = [
      { id: 'tab1', type: 'tab', label: 'F', z: '' },
      { id: 'sub1', type: 'subflow', name: 'init', in: [], out: [] },
      { id: 'inst1', type: 'subflow:sub1', name: '', z: 'tab1', x: 100, y: 100, wires: [[]] },
    ];
    const html = buildHTML(flows);
    expect(html).toContain('nr-subflow-badge');
    expect(html).toContain('#7BA7B3');
  });

  // Viewer subflow tabs (5.1)
  it('contains openSubflowTab, closeSubflowTab, and dblclick wiring for subflow nodes', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('openSubflowTab');
    expect(html).toContain('closeSubflowTab');
    expect(html).toContain('handleNodeDblclick');
    expect(html).toContain('on("dblclick"');
    expect(html).toContain('event.stopPropagation()');
  });

  // Viewer subflow tabs (5.2)
  it('dblclick only reacts to subflow-typed nodes, not other types', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('indexOf("subflow:") === 0');
    expect(html).toContain('handleNodeDblclick');
    // The handler body is gated; non-subflow nodes hit the no-op branch
    expect(html).toContain('openSubflowTab(d.type.slice("subflow:".length))');
  });

  // Viewer subflow tabs (5.3)
  it('uses reconcileTabs instead of wholesale tabs reassignment on WS/refresh', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('reconcileTabs');
    // reconcileTabs is called in both the WS handler and applySnapshot
    expect(html).toContain('reconcileTabs(freshTabs)');
    expect(html).toContain('reconcileTabs(freshTabs2)');
  });

  // Viewer subflow tabs (5.4)
  it('closeSubflowTab only removes one entry, no cascade-close or parentId logic', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('closeSubflowTab');
    expect(html).not.toContain('parentId');
    // The close function should only splice one entry and not iterate over dependent tabs
    expect(html).not.toMatch(/closeSubflowTab.*tabs\.filter/);
  });

  // Viewer subflow tab-bar visibility (1.3)
  it('tab bar visibility computed dynamically from tabs.length', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('tabs.length <= 1');
    expect(html).toContain('with-tabs');
  });

  // Viewer subflow close button CSS (4.2)
  it('has nr-tab-close CSS class for subflow tab close buttons', () => {
    const html = buildHTML(flowsWithTwoTabs);
    expect(html).toContain('nr-tab-close');
    expect(html).toContain('\\u00d7');
  });
});
