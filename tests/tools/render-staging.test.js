import { describe, it, expect, vi } from 'vitest';
import { handleRenderStaging, renderStagingDefinition } from '../../src/tools/render-staging.js';

function makeStagingStore(flows = []) {
  return {
    getFlows: vi.fn().mockResolvedValue(flows),
    getStagingSummary: vi.fn().mockReturnValue({
      dirtyNodeIds: [],
      dirtyFlowIds: [],
      deployed: true,
      pendingChanges: 0,
    }),
  };
}

const sampleFlows = [
  { id: 'tab1', type: 'tab', label: 'F1', z: '' },
  { id: 'n1', type: 'inject', name: 'Start', x: 100, y: 100, z: 'tab1', wires: [['n2']] },
  { id: 'n2', type: 'debug', name: 'Log', x: 300, y: 100, z: 'tab1', wires: [] },
];

describe('render-staging tool', () => {
  it('returns SVG output by default', async () => {
    const staging = makeStagingStore(sampleFlows);
    const handler = handleRenderStaging(staging);
    const result = await handler({});

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/^<svg /);
    expect(result.content[0].text).toContain('</svg>');
  });

  it('returns HTML output when format is html', async () => {
    const staging = makeStagingStore(sampleFlows);
    const handler = handleRenderStaging(staging);
    const result = await handler({ format: 'html' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('<!DOCTYPE html>');
    expect(result.content[0].text).toContain('</html>');
  });

  it('returns Mermaid output when format is mermaid', async () => {
    const staging = makeStagingStore(sampleFlows);
    const handler = handleRenderStaging(staging);
    const result = await handler({ format: 'mermaid' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('```mermaid');
    expect(result.content[0].text).toContain('flowchart TD');
  });

  it('throws for unknown format', async () => {
    const staging = makeStagingStore(sampleFlows);
    const handler = handleRenderStaging(staging);
    await expect(handler({ format: 'pdf' })).rejects.toThrow('Unknown format');
  });

  it('has read-only annotation', () => {
    expect(renderStagingDefinition.annotations).toBeDefined();
    expect(renderStagingDefinition.name).toBe('render-staging');
  });

  it('handles empty flows gracefully', async () => {
    const staging = makeStagingStore([]);
    const handler = handleRenderStaging(staging);
    const result = await handler({ format: 'mermaid' });
    expect(result.content[0].text).toContain('Empty flow');
  });
});
