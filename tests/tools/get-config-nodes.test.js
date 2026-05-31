import { describe, it, expect } from 'vitest';
import { transformConfigNodes } from '../../src/tools/get-config-nodes.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeNode = (overrides) => ({ wires: [], ...overrides });

const TAB1 = makeNode({ id: 'tab1', type: 'tab', label: 'Flow 1' });
const FLOW_NODE = makeNode({ id: 'fn1', type: 'inject', z: 'tab1' });

const MQTT_BROKER = makeNode({ id: 'cfg1', type: 'mqtt-broker', name: 'Local Broker', broker: 'localhost', port: 1883, clientid: 'mcp' });
const TLS_CONFIG = makeNode({ id: 'cfg2', type: 'tls-config', name: 'My TLS', cert: 'cert.pem', key: 'key.pem' });
const HTTP_PROXY = makeNode({ id: 'cfg3', type: 'http-proxy', name: '', url: 'http://proxy:3128' });

const ALL_NODES = [TAB1, FLOW_NODE, MQTT_BROKER, TLS_CONFIG, HTTP_PROXY];
const RAW = { flows: ALL_NODES };

// ---------------------------------------------------------------------------
// transformConfigNodes
// ---------------------------------------------------------------------------
describe('transformConfigNodes', () => {
  describe('basic listing', () => {
    it('returns only config nodes (no z, not tab/subflow)', () => {
      const result = transformConfigNodes(RAW);
      expect(result.nodes).toHaveLength(3);
      const ids = result.nodes.map((n) => n.id).sort();
      expect(ids).toEqual(['cfg1', 'cfg2', 'cfg3']);
    });

    it('returns totalCount, offset, limit, hasMore metadata', () => {
      const result = transformConfigNodes(RAW);
      expect(result.totalCount).toBe(3);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.hasMore).toBe(false);
    });

    it('returns empty array when no config nodes exist', () => {
      const result = transformConfigNodes({ flows: [TAB1, FLOW_NODE] });
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('returns each config node with id, type, name, config', () => {
      const result = transformConfigNodes(RAW);
      const broker = result.nodes.find((n) => n.id === 'cfg1');
      expect(broker).toMatchObject({
        id: 'cfg1',
        type: 'mqtt-broker',
        name: 'Local Broker',
      });
      expect(broker.config).toBeDefined();
    });
  });

  describe('config sanitization', () => {
    it('excludes blocklisted fields from config', () => {
      const nodeWithTemplate = makeNode({
        id: 'tmpl', type: 'some-config', name: '', template: 'big content', safeField: 'ok',
      });
      const result = transformConfigNodes({ flows: [nodeWithTemplate] });
      expect(result.nodes[0].config).not.toHaveProperty('template');
      expect(result.nodes[0].config).toHaveProperty('safeField', 'ok');
    });

    it('excludes metadata fields from config', () => {
      const result = transformConfigNodes(RAW);
      for (const node of result.nodes) {
        expect(node.config).not.toHaveProperty('id');
        expect(node.config).not.toHaveProperty('type');
        expect(node.config).not.toHaveProperty('name');
      }
    });

    it('preserves all safe config fields for mqtt-broker', () => {
      const result = transformConfigNodes(RAW);
      const broker = result.nodes.find((n) => n.id === 'cfg1');
      expect(broker.config).toMatchObject({ broker: 'localhost', port: 1883, clientid: 'mcp' });
    });
  });

  describe('nodeType filter', () => {
    it('returns only mqtt-broker nodes when nodeType is mqtt-broker', () => {
      const result = transformConfigNodes(RAW, { nodeType: 'mqtt-broker' });
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('cfg1');
    });

    it('returns empty when no config nodes match the type', () => {
      const result = transformConfigNodes(RAW, { nodeType: 'nonexistent-type' });
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('pagination', () => {
    const manyNodes = Array.from({ length: 15 }, (_, i) =>
      makeNode({ id: `cfg${i}`, type: 'mqtt-broker', name: `Broker ${i}` })
    );
    const bigRaw = { flows: manyNodes };

    it('returns first 10 with hasMore: true', () => {
      const result = transformConfigNodes(bigRaw, { limit: 10 });
      expect(result.nodes).toHaveLength(10);
      expect(result.totalCount).toBe(15);
      expect(result.hasMore).toBe(true);
    });

    it('returns remaining nodes on second page with hasMore: false', () => {
      const result = transformConfigNodes(bigRaw, { offset: 10, limit: 10 });
      expect(result.nodes).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });
  });
});
