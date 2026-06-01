import { describe, it, expect, vi } from 'vitest';
import { findNodeType, extractHelpHtml, handleGetNodeTypeDetail } from '../../src/tools/get-node-type-detail.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INJECT_MOD = {
  module: '@node-red/nodes',
  version: '4.0.0',
  description: 'Injects a message into a flow',
  enabled: true,
  types: ['inject', 'complete'],
  config: {
    repeat: { type: 'str', value: '' },
    crontab: { type: 'str', value: '' },
    once: { type: 'bool', value: false },
  },
};

const HTTP_MOD = {
  module: 'node-red-node-http',
  version: '1.2.0',
  description: 'HTTP input node',
  enabled: true,
  types: ['http in'],
  config: {
    method: { type: 'str', value: 'GET' },
    url: { type: 'str', value: '' },
  },
};

const NO_CONFIG_MOD = {
  module: 'some-module',
  version: '0.1.0',
  description: '',
  enabled: true,
  types: ['custom-node'],
};

const ALL_MODS = [INJECT_MOD, HTTP_MOD, NO_CONFIG_MOD];

// ---------------------------------------------------------------------------
// findNodeType
// ---------------------------------------------------------------------------

describe('findNodeType', () => {
  it('returns the raw node set for a known type name', () => {
    const result = findNodeType(ALL_MODS, 'inject');
    expect(result).toBe(INJECT_MOD);
  });

  it('includes the module field in the response', () => {
    const result = findNodeType(ALL_MODS, 'http in');
    expect(result.module).toBe('node-red-node-http');
  });

  it('returns all node set fields including types array', () => {
    const result = findNodeType(ALL_MODS, 'inject');
    expect(result.types).toContain('inject');
    expect(result.version).toBe('4.0.0');
    expect(result.enabled).toBe(true);
  });

  it('returns node set with config when present', () => {
    const result = findNodeType(ALL_MODS, 'inject');
    expect(result.config).toBeDefined();
    expect(result.config.once).toBeDefined();
  });

  it('returns node set without config when absent', () => {
    const result = findNodeType(ALL_MODS, 'custom-node');
    expect(result.config).toBeUndefined();
  });

  it('throws when type name is not found', () => {
    expect(() => findNodeType(ALL_MODS, 'nonexistent-type')).toThrow(
      "Node type 'nonexistent-type' not found",
    );
  });

  it('finds a type that is not the first in its node set types array', () => {
    const result = findNodeType(ALL_MODS, 'complete');
    expect(result).toBe(INJECT_MOD);
  });
});

// ---------------------------------------------------------------------------
// extractHelpHtml
// ---------------------------------------------------------------------------

const SAMPLE_HTML = `
<script type="text/html" data-help-name="inject">
  <p>Injects a message into a flow.</p>
</script>
<script type="text/html" data-help-name="debug">
  <p>Displays messages in the <strong>debug sidebar</strong>.</p>
</script>
`;

describe('extractHelpHtml', () => {
  it('returns Markdown converted from the matching help block', () => {
    const result = extractHelpHtml(SAMPLE_HTML, 'inject');
    expect(result).toContain('Injects a message into a flow.');
    expect(result).not.toContain('<p>');
  });

  it('returns null when no matching block exists', () => {
    const result = extractHelpHtml(SAMPLE_HTML, 'nonexistent-type');
    expect(result).toBeNull();
  });

  it('returns the correct block when multiple types are present', () => {
    const result = extractHelpHtml(SAMPLE_HTML, 'debug');
    expect(result).toContain('debug sidebar');
    expect(result).not.toContain('Injects');
  });

  it('handles type names with special regex characters', () => {
    const html = `<script type="text/html" data-help-name="http in"><p>HTTP input.</p></script>`;
    const result = extractHelpHtml(html, 'http in');
    expect(result).toContain('HTTP input.');
  });

  it('matches when data-help-name appears before type attribute', () => {
    const html = `<script data-help-name="junction" type="text/html"><p>Junction help.</p></script>`;
    const result = extractHelpHtml(html, 'junction');
    expect(result).toContain('Junction help.');
  });
});

// ---------------------------------------------------------------------------
// handleGetNodeTypeDetail (integration)
// ---------------------------------------------------------------------------

describe('handleGetNodeTypeDetail', () => {
  it('merges the help field into the node set response', async () => {
    const helpHtml = `<script type="text/html" data-help-name="inject"><p>Inject help.</p></script>`;
    const mockClient = {
      request: vi.fn().mockResolvedValue(ALL_MODS),
      requestText: vi.fn().mockResolvedValue(helpHtml),
    };

    const response = await handleGetNodeTypeDetail(mockClient, { type: 'inject' });
    const result = JSON.parse(response.content[0].text);

    expect(result.module).toBe('@node-red/nodes');
    expect(result.help).toContain('Inject help.');
    expect(result.help).not.toContain('<p>');
  });

  it('sets help to null when no documentation block exists for the type', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue(ALL_MODS),
      requestText: vi.fn().mockResolvedValue('<script type="text/html" data-help-name="other">x</script>'),
    };

    const response = await handleGetNodeTypeDetail(mockClient, { type: 'inject' });
    const result = JSON.parse(response.content[0].text);

    expect(result.help).toBeNull();
  });

  it('returns an error message when the type is not found', async () => {
    const mockClient = {
      request: vi.fn().mockResolvedValue(ALL_MODS),
      requestText: vi.fn().mockResolvedValue(''),
    };

    const response = await handleGetNodeTypeDetail(mockClient, { type: 'no-such-type' });
    expect(response.content[0].text).toMatch(/not found/);
  });
});
