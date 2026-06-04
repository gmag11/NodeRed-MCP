import { describe, it, expect, vi } from 'vitest';
import {
  resolveInjectNode,
  handleInjectMessage,
} from '../../src/tools/inject-message.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeAllNodes = () => [
  { id: 'flow-1', type: 'tab', label: 'Flow One' },
  { id: 'flow-2', type: 'tab', label: 'Flow Two' },
  { id: 'n1', type: 'inject', z: 'flow-1', name: 'Trigger A', wires: [['n2']] },
  { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] },
  { id: 'n3', type: 'inject', z: 'flow-2', name: 'Trigger B', wires: [['n4']] },
  { id: 'n4', type: 'function', z: 'flow-2', name: 'Processor', wires: [] },
];

const makeCollidingNodes = () => [
  { id: 'flow-1', type: 'tab', label: 'Flow One' },
  { id: 'flow-2', type: 'tab', label: 'Flow Two' },
  { id: 'n1', type: 'inject', z: 'flow-1', name: 'Start', wires: [] },
  { id: 'n3', type: 'inject', z: 'flow-2', name: 'Start', wires: [] },
  { id: 'n5', type: 'inject', z: 'flow-1', name: 'Unique', wires: [] },
];

// ---------------------------------------------------------------------------
// resolveInjectNode
// ---------------------------------------------------------------------------

describe('resolveInjectNode', () => {
  // --- 3.2: resolveInjectNode returns node when nodeId matches ---
  it('returns node when nodeId matches', () => {
    const result = resolveInjectNode(makeAllNodes(), { nodeId: 'n1' });
    expect(result).toEqual({ nodeId: 'n1', name: 'Trigger A' });
  });

  // --- 3.3: resolveInjectNode resolves by name within a specific flow ---
  it('resolves by name within a specific flow', () => {
    const result = resolveInjectNode(makeAllNodes(), {
      name: 'Trigger B',
      flowId: 'flow-2',
    });
    expect(result).toEqual({ nodeId: 'n3', name: 'Trigger B' });
  });

  it('does not find a node with same name in a different flow when flowId is specified', () => {
    expect(() =>
      resolveInjectNode(makeAllNodes(), {
        name: 'Trigger A',
        flowId: 'flow-2',
      }),
    ).toThrow('Inject node not found: no inject node named "Trigger A" in flow "flow-2"');
  });

  // --- 3.4: resolveInjectNode resolves by name across all flows when unique ---
  it('resolves by name across all flows when unique', () => {
    const result = resolveInjectNode(makeAllNodes(), { name: 'Trigger A' });
    expect(result).toEqual({ nodeId: 'n1', name: 'Trigger A' });
  });

  it('resolves unique name across all flows', () => {
    const result = resolveInjectNode(makeCollidingNodes(), { name: 'Unique' });
    expect(result).toEqual({ nodeId: 'n5', name: 'Unique' });
  });

  // --- 3.5: resolveInjectNode throws on name collision listing all matching IDs ---
  it('throws on name collision listing all matching IDs', () => {
    expect(() =>
      resolveInjectNode(makeCollidingNodes(), { name: 'Start' }),
    ).toThrow(
      'Multiple inject nodes named "Start" found ("n1", "n3"). Use nodeId to disambiguate.',
    );
  });

  // --- 3.6: resolveInjectNode throws when node not found ---
  it('throws when nodeId does not exist', () => {
    expect(() =>
      resolveInjectNode(makeAllNodes(), { nodeId: 'ghost' }),
    ).toThrow('Inject node not found: no node with id "ghost"');
  });

  it('throws when name does not match any inject node', () => {
    expect(() =>
      resolveInjectNode(makeAllNodes(), { name: 'NonExistent' }),
    ).toThrow('Inject node not found: no inject node named "NonExistent"');
  });

  // --- 3.7: handler returns error when neither nodeId nor name is provided ---
  it('throws when neither nodeId nor name is provided', () => {
    expect(() => resolveInjectNode(makeAllNodes(), {})).toThrow(
      'Provide either nodeId or name',
    );
  });

  it('throws when called with no options', () => {
    expect(() => resolveInjectNode(makeAllNodes())).toThrow(
      'Provide either nodeId or name',
    );
  });
});

// ---------------------------------------------------------------------------
// handleInjectMessage
// ---------------------------------------------------------------------------

describe('handleInjectMessage', () => {
  it('resolves by nodeId and calls POST /inject/:nodeId', async () => {
    const allNodes = makeAllNodes();
    const client = {
      request: vi.fn().mockResolvedValueOnce({ flows: allNodes }),
      post: vi.fn().mockResolvedValueOnce('Injected'),
    };

    const handler = handleInjectMessage(client);
    const result = await handler({ nodeId: 'n1' });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.post).toHaveBeenCalledWith('/inject/n1');
    expect(JSON.parse(result.content[0].text)).toEqual({
      success: true,
      nodeId: 'n1',
      name: 'Trigger A',
      message: 'Injected',
    });
  });

  it('resolves by name and calls POST /inject/:nodeId', async () => {
    const allNodes = makeAllNodes();
    const client = {
      request: vi.fn().mockResolvedValueOnce({ flows: allNodes }),
      post: vi.fn().mockResolvedValueOnce('Injected'),
    };

    const handler = handleInjectMessage(client);
    const result = await handler({ name: 'Trigger B' });

    expect(client.post).toHaveBeenCalledWith('/inject/n3');
    expect(JSON.parse(result.content[0].text)).toEqual({
      success: true,
      nodeId: 'n3',
      name: 'Trigger B',
      message: 'Injected',
    });
  });

  it('propagates error when resolveInjectNode throws', async () => {
    const allNodes = makeAllNodes();
    const client = {
      request: vi.fn().mockResolvedValueOnce({ flows: allNodes }),
      post: vi.fn(),
    };

    const handler = handleInjectMessage(client);

    await expect(handler({})).rejects.toThrow('Provide either nodeId or name');
    expect(client.post).not.toHaveBeenCalled();
  });

  it('propagates error when node not found', async () => {
    const allNodes = makeAllNodes();
    const client = {
      request: vi.fn().mockResolvedValueOnce({ flows: allNodes }),
      post: vi.fn(),
    };

    const handler = handleInjectMessage(client);

    await expect(handler({ name: 'Ghost' })).rejects.toThrow(
      'Inject node not found',
    );
    expect(client.post).not.toHaveBeenCalled();
  });

  it('handles result when node is not an inject node (API returns error)', async () => {
    const allNodes = [
      { id: 'flow-1', type: 'tab', label: 'Flow' },
      { id: 'n1', type: 'function', z: 'flow-1', name: 'Fn', wires: [] },
    ];
    const client = {
      request: vi.fn().mockResolvedValueOnce({ flows: allNodes }),
      post: vi.fn(),
    };

    const handler = handleInjectMessage(client);

    // resolveInjectNode finds by nodeId, but the node type is 'function'
    // Node-RED will return an error when POST /inject/:n1 is called
    // but the handler doesn't validate type — it delegates to the API
    // This test ensures the tool still passes through the API response
    client.post.mockRejectedValueOnce(
      new Error('Node-RED API error: POST /inject/n1 returned 404'),
    );

    await expect(handler({ nodeId: 'n1' })).rejects.toThrow(
      'Node-RED API error',
    );
  });
});
