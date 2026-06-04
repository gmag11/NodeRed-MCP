import { describe, it, expect, vi } from 'vitest';
import { applyNodeUpdate, handleUpdateNode } from '../../src/tools/update-node.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Build a minimal flows array with one tab and two nodes */
const makeFlows = (overrides = {}) => {
  const tab = { id: 'flow-1', type: 'tab', label: 'My Flow', locked: false };
  const node1 = { id: 'n1', type: 'function', z: 'flow-1', name: 'Old Name', func: 'return msg;', wires: [['n2']] };
  const node2 = { id: 'n2', type: 'debug', z: 'flow-1', name: 'Debug', wires: [] };
  return { rev: 'rev-abc', flows: [{ ...tab, ...overrides.tab }, node1, node2] };
};

const makeLockedFlows = () => {
  const tab = { id: 'flow-1', type: 'tab', label: 'Locked Flow', locked: true };
  const node = { id: 'n1', type: 'function', z: 'flow-1', name: 'Old', wires: [] };
  return { rev: 'rev-locked', flows: [tab, node] };
};

// ---------------------------------------------------------------------------
// applyNodeUpdate
// ---------------------------------------------------------------------------

describe('applyNodeUpdate', () => {
  it('updates a single field and returns correct previousState / currentState', () => {
    const rawResponse = makeFlows();
    const { previousState, currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'New Name' });

    expect(previousState.name).toBe('Old Name');
    expect(currentState.name).toBe('New Name');
  });

  it('preserves unmentioned fields (shallow merge)', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'Changed' });

    expect(currentState.func).toBe('return msg;');
    expect(currentState.type).toBe('function');
    expect(currentState.z).toBe('flow-1');
  });

  it('updates multiple properties at once', () => {
    const rawResponse = makeFlows();
    const { currentState } = applyNodeUpdate(rawResponse, 'n1', { name: 'Multi', func: 'return null;' });

    expect(currentState.name).toBe('Multi');
    expect(currentState.func).toBe('return null;');
  });

  it('returns updatedFlows with the node replaced', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyNodeUpdate(rawResponse, 'n1', { name: 'Updated' });

    const updatedNode = updatedFlows.find((n) => n.id === 'n1');
    expect(updatedNode.name).toBe('Updated');
  });

  it('leaves other nodes unchanged in updatedFlows', () => {
    const rawResponse = makeFlows();
    const { updatedFlows } = applyNodeUpdate(rawResponse, 'n1', { name: 'Updated' });

    const otherNode = updatedFlows.find((n) => n.id === 'n2');
    expect(otherNode.name).toBe('Debug');
  });

  it('throws if wires is present in properties', () => {
    const rawResponse = makeFlows();
    expect(() => applyNodeUpdate(rawResponse, 'n1', { wires: [] }))
      .toThrow(/wires/i);
  });

  it('throws Node not found when nodeId does not exist', () => {
    const rawResponse = makeFlows();
    expect(() => applyNodeUpdate(rawResponse, 'missing-id', { name: 'X' }))
      .toThrow("Node 'missing-id' not found");
  });

  it('throws a locked error when the parent flow is locked', () => {
    const rawResponse = makeLockedFlows();
    expect(() => applyNodeUpdate(rawResponse, 'n1', { name: 'X' }))
      .toThrow("Flow 'flow-1' is locked");
  });
});

// ---------------------------------------------------------------------------
// applyNodeUpdate — credential handling
// ---------------------------------------------------------------------------

describe('applyNodeUpdate credential handling', () => {
  /** Build a flow with an MQTT broker config node that has a credentials object */
  const makeFlowsWithConfigNode = () => {
    const configNode = {
      id: 'mqtt-1',
      type: 'mqtt-broker',
      name: 'My MQTT',
      broker: 'localhost',
      port: '1883',
      credentials: {
        username: '__PWRD__',
        password: '__PWRD__',
      },
    };
    return { rev: 'rev-1', flows: [configNode] };
  };

  /** Build a flow with a config node that has NO credentials property (as returned by Node-RED API for privacy) */
  const makeFlowsWithConfigNodeNoCreds = () => {
    const configNode = {
      id: 'mqtt-1',
      type: 'mqtt-broker',
      name: 'My MQTT',
      broker: 'localhost',
      port: '1883',
    };
    return { rev: 'rev-1', flows: [configNode] };
  };

  it('moves top-level username/password into credentials when node has credentials property', () => {
    const rawResponse = makeFlowsWithConfigNode();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      username: 'newuser',
      password: 'newpass',
    });

    // Should NOT be at top level
    expect(currentState.username).toBeUndefined();
    expect(currentState.password).toBeUndefined();
    // Should be nested under credentials
    expect(currentState.credentials).toEqual({
      username: 'newuser',
      password: 'newpass',
    });
    // Non-credential fields should be preserved
    expect(currentState.broker).toBe('localhost');
  });

  it('moves top-level credentials into credentials sub-object even when node has no credentials property (fallback heuristic)', () => {
    const rawResponse = makeFlowsWithConfigNodeNoCreds();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      username: 'newuser',
      password: 'newpass',
    });

    expect(currentState.username).toBeUndefined();
    expect(currentState.password).toBeUndefined();
    expect(currentState.credentials).toEqual({
      username: 'newuser',
      password: 'newpass',
    });
  });

  it('deep-merges credentials: preserves unspecified credential fields', () => {
    const rawResponse = makeFlowsWithConfigNode();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      password: 'only-new-password',
    });

    // password should be updated
    expect(currentState.credentials.password).toBe('only-new-password');
    // username should be preserved from existing credentials
    expect(currentState.credentials.username).toBe('__PWRD__');
  });

  it('deep-merges when caller sends credentials object directly', () => {
    const rawResponse = makeFlowsWithConfigNode();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      broker: 'new-broker',
      credentials: {
        password: 'via-credentials-obj',
      },
    });

    expect(currentState.broker).toBe('new-broker');
    expect(currentState.credentials.password).toBe('via-credentials-obj');
    // username should be preserved (not overwritten by absent key)
    expect(currentState.credentials.username).toBe('__PWRD__');
  });

  it('preserves non-credential top-level properties when moving credentials', () => {
    const rawResponse = makeFlowsWithConfigNode();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      name: 'Renamed Broker',
      username: 'u',
      password: 'p',
      broker: 'new-broker.example.com',
      port: '8883',
    });

    expect(currentState.name).toBe('Renamed Broker');
    expect(currentState.broker).toBe('new-broker.example.com');
    expect(currentState.port).toBe('8883');
    expect(currentState.username).toBeUndefined();
    expect(currentState.password).toBeUndefined();
    expect(currentState.credentials).toEqual({
      username: 'u',
      password: 'p',
    });
  });

  it('does not create credentials property when no credential fields are present', () => {
    const rawResponse = makeFlowsWithConfigNodeNoCreds();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      name: 'Renamed',
      broker: 'new-broker',
    });

    expect(currentState.name).toBe('Renamed');
    expect(currentState.broker).toBe('new-broker');
    expect(currentState.credentials).toBeUndefined();
  });

  it('handles known credential field names like token, cert, key', () => {
    const rawResponse = makeFlowsWithConfigNodeNoCreds();
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      token: 'abc123',
      cert: '/path/cert.pem',
      key: '/path/key.pem',
      name: 'TLS Node',
    });

    expect(currentState.token).toBeUndefined();
    expect(currentState.cert).toBeUndefined();
    expect(currentState.key).toBeUndefined();
    expect(currentState.credentials).toEqual({
      token: 'abc123',
      cert: '/path/cert.pem',
      key: '/path/key.pem',
    });
    expect(currentState.name).toBe('TLS Node');
  });

  it('uses credentialKeys from API as authoritative list (overrides heuristic)', () => {
    const rawResponse = makeFlowsWithConfigNodeNoCreds();
    // Simulate API response: the node type defines 'apiKey' and 'passphrase' as credentials,
    // but 'token' is NOT a credential for this node type.
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      apiKey: 'key-123',
      passphrase: 'secret-phrase',
      token: 'should-not-be-credential',
      name: 'API Node',
    }, ['apiKey', 'passphrase']);

    // Only apiKey and passphrase should be in credentials
    expect(currentState.credentials).toEqual({
      apiKey: 'key-123',
      passphrase: 'secret-phrase',
    });
    // 'token' should remain at top level because it's NOT in credentialKeys
    expect(currentState.token).toBe('should-not-be-credential');
    expect(currentState.name).toBe('API Node');
    expect(currentState.apiKey).toBeUndefined();
    expect(currentState.passphrase).toBeUndefined();
  });

  it('credentialKeys from API prevents false positives from heuristic', () => {
    const rawResponse = makeFlowsWithConfigNodeNoCreds();
    // Empty credentialKeys means NO fields should be moved to credentials
    const { currentState } = applyNodeUpdate(rawResponse, 'mqtt-1', {
      username: 'top-level-user',
      token: 'top-level-token',
      name: 'No Credentials Node',
    }, []);

    // Nothing should be in credentials
    expect(currentState.credentials).toBeUndefined();
    // All fields should remain at top level
    expect(currentState.username).toBe('top-level-user');
    expect(currentState.token).toBe('top-level-token');
    expect(currentState.name).toBe('No Credentials Node');
  });
});

// ---------------------------------------------------------------------------
// handleUpdateNode
// ---------------------------------------------------------------------------

describe('handleUpdateNode', () => {
  it('GETs /flows then PUTs with updated node', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)           // GET /flows
        .mockResolvedValueOnce(null),                  // GET /credentials (no creds)
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'New' } });

    expect(client.request).toHaveBeenCalledWith('GET', '/flows');
    expect(client.putFlows).toHaveBeenCalledOnce();
    const [putPayload, deployType] = client.putFlows.mock.calls[0];
    expect(deployType).toBe('flows');
    expect(putPayload.rev).toBe('rev-abc');
    const updatedNode = putPayload.flows.find((n) => n.id === 'n1');
    expect(updatedNode.name).toBe('New');
  });

  it('round-trips the rev field in the PUT body', async () => {
    const rawResponse = { ...makeFlows(), rev: 'my-revision-123' };
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)           // GET /flows
        .mockResolvedValueOnce(null),                  // GET /credentials
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'X' } });

    const [putPayload] = client.putFlows.mock.calls[0];
    expect(putPayload.rev).toBe('my-revision-123');
  });

  it('returns previousState and currentState in MCP content', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)           // GET /flows
        .mockResolvedValueOnce(null),                  // GET /credentials
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    const result = await handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'New' } });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nodeId).toBe('n1');
    expect(parsed.previousState.name).toBe('Old Name');
    expect(parsed.currentState.name).toBe('New');
  });

  it('throws if wires is in properties', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)           // GET /flows
        .mockResolvedValueOnce(null),                  // GET /credentials
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'n1', properties: { wires: [] } }))
      .rejects.toThrow(/wires/i);
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('throws if nodeId is not found', async () => {
    const rawResponse = makeFlows();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse),           // GET /flows
      // No credentials call needed — node not found throws first
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'ghost', properties: { name: 'X' } }))
      .rejects.toThrow("Node 'ghost' not found");
  });

  it('throws if parent flow is locked', async () => {
    const rawResponse = makeLockedFlows();
    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse)           // GET /flows
        .mockResolvedValueOnce(null),                  // GET /credentials
      putFlows: vi.fn(),
    };

    await expect(handleUpdateNode(client, { nodeId: 'n1', properties: { name: 'X' } }))
      .rejects.toThrow("Flow 'flow-1' is locked");
    expect(client.putFlows).not.toHaveBeenCalled();
  });

  it('queries /credentials/:type/:id to get authoritative credential field names', async () => {
    // Build a flow with an MQTT broker config node
    const mqttNode = {
      id: 'mqtt-1',
      type: 'mqtt-broker',
      name: 'My MQTT',
      broker: 'localhost',
      port: '1883',
    };
    const rawResponse = { rev: 'rev-1', flows: [mqttNode] };

    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse) // GET /flows
        .mockResolvedValueOnce({           // GET /credentials/mqtt-broker/mqtt-1
          username: 'stored-user',
          has_password: true,
        }),
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, {
      nodeId: 'mqtt-1',
      properties: { username: 'new-user', password: 'new-pass', broker: 'new-broker' },
    });

    // Should have called the credentials endpoint
    expect(client.request).toHaveBeenCalledWith('GET', '/credentials/mqtt-broker/mqtt-1');

    const [putPayload] = client.putFlows.mock.calls[0];
    const updatedNode = putPayload.flows.find((n) => n.id === 'mqtt-1');

    // username and password should be in credentials (from API)
    expect(updatedNode.credentials).toEqual({
      username: 'new-user',
      password: 'new-pass',
    });
    // broker should be at top level
    expect(updatedNode.broker).toBe('new-broker');
    expect(updatedNode.username).toBeUndefined();
    expect(updatedNode.password).toBeUndefined();
  });

  it('falls back to heuristic when /credentials endpoint fails', async () => {
    const mqttNode = {
      id: 'mqtt-1',
      type: 'mqtt-broker',
      name: 'My MQTT',
      broker: 'localhost',
      port: '1883',
    };
    const rawResponse = { rev: 'rev-1', flows: [mqttNode] };

    const client = {
      request: vi.fn()
        .mockResolvedValueOnce(rawResponse) // GET /flows
        .mockRejectedValueOnce(new Error('Not Found')), // GET /credentials fails (404)
      putFlows: vi.fn().mockResolvedValueOnce({}),
    };

    await handleUpdateNode(client, {
      nodeId: 'mqtt-1',
      properties: { username: 'heuristic-user', password: 'heuristic-pass' },
    });

    // Should still work — heuristic places username/password in credentials
    const [putPayload] = client.putFlows.mock.calls[0];
    const updatedNode = putPayload.flows.find((n) => n.id === 'mqtt-1');
    expect(updatedNode.credentials).toEqual({
      username: 'heuristic-user',
      password: 'heuristic-pass',
    });
    expect(updatedNode.username).toBeUndefined();
    expect(updatedNode.password).toBeUndefined();
  });
});
