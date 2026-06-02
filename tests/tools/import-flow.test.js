import { describe, it, expect, vi } from 'vitest';
import {
  normalizeFlowJson,
  regenerateIds,
  mergeFlows,
  applyTargetFlow,
  summarizeImport,
  handleImportFlow,
} from '../../src/tools/import-flow.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TAB1 = { id: 'tab1', type: 'tab', label: 'Flow 1' };
const TAB1_LOCKED = { id: 'tab1', type: 'tab', label: 'Flow 1', locked: true };
const TAB2 = { id: 'tab2', type: 'tab', label: 'Flow 2' };

const FUNC_NODE = { id: 'n1', type: 'function', z: 'tab1', func: 'return msg;', wires: [['n2']] };
const DEBUG_NODE = { id: 'n2', type: 'debug', z: 'tab1', wires: [] };
const CONFIG_NODE = { id: 'cfg1', type: 'mqtt-broker', name: 'Broker' };

// A minimal set of existing flows
const EXISTING = [TAB1, FUNC_NODE, DEBUG_NODE, CONFIG_NODE];

// ---------------------------------------------------------------------------
// normalizeFlowJson
// ---------------------------------------------------------------------------

describe('normalizeFlowJson', () => {
  // Task 3.2: accepts a JSON array string
  it('accepts a JSON array string', () => {
    const input = JSON.stringify([TAB1, FUNC_NODE]);
    const result = normalizeFlowJson(input);
    expect(result).toEqual([TAB1, FUNC_NODE]);
  });

  // Task 3.3: accepts a JSON object string with nodes property
  it('accepts a JSON object string with a nodes property', () => {
    const input = JSON.stringify({ nodes: [TAB1, FUNC_NODE] });
    const result = normalizeFlowJson(input);
    expect(result).toEqual([TAB1, FUNC_NODE]);
  });

  // Task 3.4: throws on invalid JSON
  it('throws on invalid JSON', () => {
    expect(() => normalizeFlowJson('not-json')).toThrow('Invalid flowJson: not valid JSON');
  });

  // Task 3.5: throws on empty array
  it('throws on empty array', () => {
    expect(() => normalizeFlowJson('[]')).toThrow('flowJson is empty — nothing to import');
  });

  it('throws when JSON is not an array or nodes-bearing object', () => {
    expect(() => normalizeFlowJson('"just a string"')).toThrow('Invalid flowJson');
    expect(() => normalizeFlowJson('{"foo":"bar"}')).toThrow('Invalid flowJson');
  });
});

// ---------------------------------------------------------------------------
// regenerateIds
// ---------------------------------------------------------------------------

describe('regenerateIds', () => {
  const nodes = [
    { id: 'tab-A', type: 'tab', label: 'My Flow' },
    { id: 'n-A', type: 'function', z: 'tab-A', wires: [['n-B']] },
    { id: 'n-B', type: 'debug', z: 'tab-A', wires: [] },
  ];

  // Task 3.6: remaps all IDs and preserves z cross-references
  it('remaps all IDs and preserves z cross-references', () => {
    const result = regenerateIds(nodes);

    // All new IDs must differ from originals
    const oldIds = new Set(nodes.map((n) => n.id));
    for (const node of result) {
      expect(oldIds.has(node.id)).toBe(false);
    }

    // z on child nodes must point to the remapped tab ID
    const tabNewId = result[0].id;
    expect(result[1].z).toBe(tabNewId);
    expect(result[2].z).toBe(tabNewId);
  });

  // Task 3.7: remaps wire targets to new IDs correctly
  it('remaps wire targets to new IDs correctly', () => {
    const result = regenerateIds(nodes);
    const n2NewId = result[2].id; // n-B remapped
    expect(result[1].wires[0]).toEqual([n2NewId]);
  });

  it('does not mutate the original nodes', () => {
    regenerateIds(nodes);
    expect(nodes[0].id).toBe('tab-A');
    expect(nodes[1].id).toBe('n-A');
    expect(nodes[1].wires[0]).toEqual(['n-B']);
  });
});

// ---------------------------------------------------------------------------
// mergeFlows
// ---------------------------------------------------------------------------

describe('mergeFlows', () => {
  const newTab = { id: 'new-tab', type: 'tab', label: 'New' };
  const newNode = { id: 'new-n1', type: 'inject', z: 'new-tab', wires: [] };

  // Task 3.8: regenerate strategy produces no conflicts
  it('regenerate strategy produces no conflicts and appends nodes', () => {
    const { mergedFlows, conflicts } = mergeFlows(EXISTING, [newTab, newNode], 'regenerate');
    expect(conflicts).toBe(0);
    expect(mergedFlows).toHaveLength(EXISTING.length + 2);
    expect(mergedFlows.map((n) => n.id)).toContain('new-tab');
  });

  // Task 3.9: overwrite strategy replaces existing nodes by ID
  it('overwrite strategy replaces existing nodes by ID', () => {
    const updatedFunc = { ...FUNC_NODE, func: 'return null;' };
    const { mergedFlows, conflicts } = mergeFlows(EXISTING, [updatedFunc], 'overwrite');
    expect(conflicts).toBe(1);
    const replaced = mergedFlows.find((n) => n.id === 'n1');
    expect(replaced.func).toBe('return null;');
  });

  it('overwrite strategy appends brand-new nodes', () => {
    const { mergedFlows, conflicts } = mergeFlows(EXISTING, [newNode], 'overwrite');
    expect(conflicts).toBe(0);
    expect(mergedFlows.map((n) => n.id)).toContain('new-n1');
  });

  it('throws on unknown strategy', () => {
    expect(() => mergeFlows(EXISTING, [newTab], 'unknown')).toThrow('Unknown conflictStrategy');
  });
});

// ---------------------------------------------------------------------------
// summarizeImport
// ---------------------------------------------------------------------------

describe('summarizeImport', () => {
  // Task 3.10: counts tabs, regular nodes, and config nodes correctly
  it('counts tabs, regular nodes, and config nodes correctly', () => {
    const nodes = [
      { id: 'tab1', type: 'tab' },
      { id: 'n1', type: 'function', z: 'tab1' },
      { id: 'n2', type: 'debug', z: 'tab1' },
      { id: 'n3', type: 'http in', z: 'tab1' },
      { id: 'n4', type: 'function', z: 'tab1' },
      { id: 'n5', type: 'function', z: 'tab1' },
      { id: 'cfg1', type: 'mqtt-broker' }, // no z = config node
    ];
    const summary = summarizeImport(nodes, 0, 'regenerate', null);
    expect(summary.imported).toEqual({ flows: 1, nodes: 5, configNodes: 1 });
    expect(summary.conflicts).toBe(0);
    expect(summary.strategy).toBe('regenerate');
    expect(summary.targetFlowId).toBeNull();
  });

  it('includes targetFlowId when provided', () => {
    const summary = summarizeImport([], 0, 'overwrite', 'tab-xyz');
    expect(summary.targetFlowId).toBe('tab-xyz');
  });
});

// ---------------------------------------------------------------------------
// applyTargetFlow
// ---------------------------------------------------------------------------

describe('applyTargetFlow', () => {
  // Task 3.11: discards tab nodes and remaps z to targetFlowId
  it('discards tab nodes and remaps z to targetFlowId on all remaining nodes', () => {
    const nodes = [
      { id: 'tab2', type: 'tab', label: 'Imported' },
      { id: 'n-X', type: 'function', z: 'tab2', wires: [] },
      { id: 'n-Y', type: 'debug', z: 'tab2', wires: [] },
    ];
    const result = applyTargetFlow(nodes, 'existing-tab');
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.type !== 'tab')).toBe(true);
    expect(result.every((n) => n.z === 'existing-tab')).toBe(true);
  });

  it('also discards subflow nodes', () => {
    const nodes = [
      { id: 'sf1', type: 'subflow', name: 'Sub' },
      { id: 'n1', type: 'inject', z: 'sf1', wires: [] },
    ];
    const result = applyTargetFlow(nodes, 'target-tab');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('inject');
  });

  it('returns empty array when all nodes are tabs', () => {
    const result = applyTargetFlow([TAB1, TAB2], 'some-tab');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// handleImportFlow (handler integration)
// ---------------------------------------------------------------------------

describe('handleImportFlow', () => {
  const makeClient = (flows) => ({
    request: vi.fn().mockResolvedValue({ rev: 'abc', flows }),
    putFlows: vi.fn().mockResolvedValue({}),
  });

  const simpleFlowJson = JSON.stringify([TAB2, { id: 'n-X', type: 'inject', z: 'tab2', wires: [] }]);

  it('calls PUT /flows with merged payload on a valid import', async () => {
    const client = makeClient(EXISTING);
    await handleImportFlow(client, { flowJson: simpleFlowJson });
    expect(client.putFlows).toHaveBeenCalledOnce();
  });

  it('returns a valid summary on success', async () => {
    const client = makeClient(EXISTING);
    const response = await handleImportFlow(client, { flowJson: simpleFlowJson, conflictStrategy: 'regenerate' });
    const result = JSON.parse(response.content[0].text);
    expect(result.strategy).toBe('regenerate');
    expect(result.conflicts).toBe(0);
    expect(result.imported.flows).toBe(1);
    expect(result.imported.nodes).toBe(1);
  });

  // Task 3.12: handler returns error when targetFlowId does not match any existing flow
  it('throws when targetFlowId does not match any existing flow', async () => {
    const client = makeClient(EXISTING);
    await expect(
      handleImportFlow(client, { flowJson: simpleFlowJson, targetFlowId: 'nonexistent' })
    ).rejects.toThrow("Target flow 'nonexistent' not found");
  });

  // Task 3.13: handler returns error when targetFlowId matches a locked flow
  it('throws when targetFlowId matches a locked flow', async () => {
    const client = makeClient([TAB1_LOCKED, FUNC_NODE]);
    await expect(
      handleImportFlow(client, { flowJson: simpleFlowJson, targetFlowId: 'tab1' })
    ).rejects.toThrow("Target flow 'tab1' is locked");
  });

  it('remaps z to targetFlowId when targetFlowId is provided', async () => {
    const client = makeClient(EXISTING);
    const response = await handleImportFlow(client, {
      flowJson: simpleFlowJson,
      targetFlowId: 'tab1',
      conflictStrategy: 'regenerate',
    });
    const result = JSON.parse(response.content[0].text);
    expect(result.targetFlowId).toBe('tab1');
    // Tab nodes from imported JSON are discarded → flows count should be 0
    expect(result.imported.flows).toBe(0);
  });

  it('throws on unknown conflictStrategy', async () => {
    const client = makeClient(EXISTING);
    await expect(
      handleImportFlow(client, { flowJson: simpleFlowJson, conflictStrategy: 'unknown' })
    ).rejects.toThrow('Unknown conflictStrategy');
  });
});
