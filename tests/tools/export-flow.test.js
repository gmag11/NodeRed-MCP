import { describe, it, expect, vi } from 'vitest';
import {
  collectFlowNodes,
  collectReferencedConfigNodes,
  collectSelectedNodes,
  trimWires,
  handleExportFlowJson,
} from '../../src/tools/export-flow.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TAB1 = { id: 'tab1', type: 'tab', label: 'My Flow' };
const TAB2 = { id: 'tab2', type: 'tab', label: 'Other Flow' };

const MQTT_BROKER = { id: 'cfg1', type: 'mqtt-broker', name: 'Local Broker' };
const TLS_CFG = { id: 'cfg2', type: 'tls-config', name: 'TLS' };

const MQTT_IN = { id: 'n1', type: 'mqtt in', z: 'tab1', broker: 'cfg1', wires: [['n2']] };
const FUNC_NODE = { id: 'n2', type: 'function', z: 'tab1', func: 'return msg;', wires: [['n3']] };
const DEBUG_NODE = { id: 'n3', type: 'debug', z: 'tab1', wires: [] };
const OTHER_NODE = { id: 'n4', type: 'inject', z: 'tab2', wires: [] };

const ALL_NODES = [TAB1, TAB2, MQTT_BROKER, TLS_CFG, MQTT_IN, FUNC_NODE, DEBUG_NODE, OTHER_NODE];
const RAW = { flows: ALL_NODES };

// ---------------------------------------------------------------------------
// collectFlowNodes
// ---------------------------------------------------------------------------

describe('collectFlowNodes', () => {
  // Task 3.2: returns tab node + children for a known flowId
  it('returns tab node + children for a known flowId', () => {
    const result = collectFlowNodes(ALL_NODES, 'tab1');
    const ids = result.map((n) => n.id);
    expect(ids).toContain('tab1');
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).toContain('n3');
    expect(ids).not.toContain('tab2');
    expect(ids).not.toContain('n4');
    expect(result).toHaveLength(4);
  });

  it('returns only child nodes when tab node is not in allNodes', () => {
    const nodes = [MQTT_IN, FUNC_NODE, DEBUG_NODE];
    const result = collectFlowNodes(nodes, 'tab1');
    expect(result.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('returns empty array for a flowId with no matching nodes', () => {
    const result = collectFlowNodes(ALL_NODES, 'nonexistent');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// collectReferencedConfigNodes
// ---------------------------------------------------------------------------

describe('collectReferencedConfigNodes', () => {
  // Task 3.3: includes a config node referenced by a child node property
  it('includes a config node referenced by a child node property', () => {
    const flowNodes = collectFlowNodes(ALL_NODES, 'tab1');
    const result = collectReferencedConfigNodes(ALL_NODES, flowNodes);
    expect(result.map((n) => n.id)).toContain('cfg1');
  });

  // Task 3.4: does not include config nodes not referenced by the exported flow
  it('does not include config nodes not referenced by the exported flow', () => {
    const flowNodes = collectFlowNodes(ALL_NODES, 'tab1');
    const result = collectReferencedConfigNodes(ALL_NODES, flowNodes);
    // TLS_CFG (cfg2) is not referenced by any node in tab1
    expect(result.map((n) => n.id)).not.toContain('cfg2');
  });

  it('returns empty array when no config nodes exist', () => {
    const simpleNodes = [TAB1, FUNC_NODE, DEBUG_NODE];
    const flowNodes = collectFlowNodes(simpleNodes, 'tab1');
    const result = collectReferencedConfigNodes(simpleNodes, flowNodes);
    expect(result).toEqual([]);
  });

  it('does not include tab or subflow nodes as config nodes', () => {
    const flowNodes = collectFlowNodes(ALL_NODES, 'tab1');
    const result = collectReferencedConfigNodes(ALL_NODES, flowNodes);
    for (const node of result) {
      expect(node.type).not.toBe('tab');
      expect(node.type).not.toBe('subflow');
    }
  });
});

// ---------------------------------------------------------------------------
// collectSelectedNodes
// ---------------------------------------------------------------------------

describe('collectSelectedNodes', () => {
  // Task 3.7: returns only nodes whose IDs are in nodeIds
  it('returns only nodes whose IDs are in nodeIds', () => {
    const result = collectSelectedNodes(ALL_NODES, ['n1', 'n3']);
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['n1', 'n3']);
  });

  it('returns empty array when nodeIds is empty', () => {
    const result = collectSelectedNodes(ALL_NODES, []);
    expect(result).toEqual([]);
  });

  it('skips IDs not found in allNodes', () => {
    const result = collectSelectedNodes(ALL_NODES, ['n1', 'MISSING']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });
});

// ---------------------------------------------------------------------------
// trimWires
// ---------------------------------------------------------------------------

describe('trimWires', () => {
  // Task 3.8: removes wire targets outside the selection, leaves [] for fully-trimmed ports
  it('removes wire targets outside the selection', () => {
    const nodes = [
      { id: 'n1', wires: [['n2', 'n3']] },
      { id: 'n2', wires: [] },
    ];
    const allowedIds = new Set(['n1', 'n2']);
    const result = trimWires(nodes, allowedIds);
    expect(result[0].wires[0]).toEqual(['n2']);
  });

  it('leaves [] for fully-trimmed ports', () => {
    const nodes = [
      { id: 'n1', wires: [['n99', 'n100']] },
    ];
    const allowedIds = new Set(['n1']);
    const result = trimWires(nodes, allowedIds);
    expect(result[0].wires[0]).toEqual([]);
  });

  it('does not mutate original nodes', () => {
    const original = { id: 'n1', wires: [['n2', 'n3']] };
    const nodes = [original];
    trimWires(nodes, new Set(['n1']));
    expect(original.wires[0]).toEqual(['n2', 'n3']);
  });

  it('passes through nodes with no wires array unchanged', () => {
    const node = { id: 'n1', type: 'tab', label: 'Flow' };
    const result = trimWires([node], new Set(['n1']));
    expect(result[0]).toEqual(node);
  });
});

// ---------------------------------------------------------------------------
// handleExportFlowJson (handler)
// ---------------------------------------------------------------------------

describe('handleExportFlowJson', () => {
  function makeStaging(flows) {
    return { getFlows: vi.fn().mockResolvedValue([...flows]) };
  }

  // Task 3.5: handler (flow mode) returns error when flowId is not found
  it('throws when flowId is not found in flow mode', async () => {
    const staging = makeStaging(ALL_NODES);
    await expect(
      handleExportFlowJson(staging, { exportMode: 'flow', flowId: 'nonexistent' })
    ).rejects.toThrow("Flow 'nonexistent' not found");
  });

  // Task 3.6: handler (flow mode) with no flowId returns all nodes as JSON string
  it('returns all nodes as JSON string when no flowId given in flow mode', async () => {
    const staging = makeStaging(ALL_NODES);
    const response = await handleExportFlowJson(staging, { exportMode: 'flow' });
    const result = JSON.parse(response.content[0].text);
    expect(result.exportMode).toBe('flow');
    expect(result.nodeCount).toBe(ALL_NODES.length);
    const parsedJson = JSON.parse(result.json);
    expect(parsedJson).toHaveLength(ALL_NODES.length);
  });

  it('returns flow + config nodes for a valid flowId', async () => {
    const staging = makeStaging(ALL_NODES);
    const response = await handleExportFlowJson(staging, { exportMode: 'flow', flowId: 'tab1' });
    const result = JSON.parse(response.content[0].text);
    expect(result.exportMode).toBe('flow');
    expect(result.flowId).toBe('tab1');
    expect(result.label).toBe('My Flow');
    const parsedJson = JSON.parse(result.json);
    const ids = parsedJson.map((n) => n.id);
    // tab, n1, n2, n3 + cfg1 (referenced by n1.broker)
    expect(ids).toContain('tab1');
    expect(ids).toContain('n1');
    expect(ids).toContain('n2');
    expect(ids).toContain('n3');
    expect(ids).toContain('cfg1');
    expect(ids).not.toContain('cfg2');
    expect(result.nodeCount).toBe(5);
  });

  // Task 3.9: handler (nodes mode) returns error when nodeIds is empty or omitted
  it('throws when exportMode is "nodes" and nodeIds is empty', async () => {
    const staging = makeStaging(ALL_NODES);
    await expect(
      handleExportFlowJson(staging, { exportMode: 'nodes', nodeIds: [] })
    ).rejects.toThrow('exportMode "nodes" requires a non-empty nodeIds array');
  });

  it('throws when exportMode is "nodes" and nodeIds is omitted', async () => {
    const staging = makeStaging(ALL_NODES);
    await expect(
      handleExportFlowJson(staging, { exportMode: 'nodes' })
    ).rejects.toThrow('exportMode "nodes" requires a non-empty nodeIds array');
  });

  // Task 3.10: handler (nodes mode) returns trimmed node array with correct nodeCount
  it('returns trimmed node array with correct nodeCount in nodes mode', async () => {
    const staging = makeStaging(ALL_NODES);
    // Select n1 and n2; n1 wires to n2 and n3 — n3 not in selection so wire trimmed
    const response = await handleExportFlowJson(staging, {
      exportMode: 'nodes',
      nodeIds: ['n1', 'n2'],
    });
    const result = JSON.parse(response.content[0].text);
    expect(result.exportMode).toBe('nodes');
    expect(result.nodeCount).toBe(2);
    const parsedJson = JSON.parse(result.json);
    expect(parsedJson).toHaveLength(2);
    const n1 = parsedJson.find((n) => n.id === 'n1');
    // Wire to n2 should remain, wire to n3 (outside selection) should be removed
    expect(n1.wires[0]).toEqual(['n2']);
  });
});
