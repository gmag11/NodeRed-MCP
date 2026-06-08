/**
 * Unified Staging Renderer
 *
 * Entry point for rendering the staging workspace into SVG, HTML, or Mermaid
 * formats. Consumes the internal intermediate representation (IR) and delegates
 * to format-specific builders.
 *
 * @module renderer
 */

import { buildIR } from './ir-builder.js';
import { buildSVG } from './svg-builder.js';
import { buildHTML } from './html-builder.js';
import { buildMermaid } from './mermaid-builder.js';

/**
 * Render the staging workspace in the requested format.
 *
 * @param {object[]} flows - Raw Node-RED flows array (from StagingStore)
 * @param {object} options - Rendering options
 * @param {'svg'|'html'|'mermaid'} options.format - Output format
 * @param {string} [options.flowId] - Filter to a single flow tab/subflow
 * @param {boolean} [options.highlightDirty=true] - Highlight un-deployed nodes
 * @param {Set<string>} [options.dirtyNodeIds] - Set of dirty node IDs
 * @param {Set<string>} [options.dirtyFlowIds] - Set of dirty flow IDs
 * @returns {{ svg?: string, html?: string, mermaid?: string }}
 * @throws {Error} If flowId is provided but not found
 */
export function renderStaging(flows, options = {}) {
  const {
    format = 'svg',
    flowId,
    highlightDirty = true,
    dirtyNodeIds = new Set(),
    dirtyFlowIds = new Set(),
  } = options;

  // Build the intermediate representation
  const ir = buildIR(flows, { flowId, highlightDirty, dirtyNodeIds, dirtyFlowIds });

  switch (format) {
    case 'svg':
      return { svg: buildSVG(ir) };
    case 'html':
      return { html: buildHTML(ir) };
    case 'mermaid':
      return { mermaid: buildMermaid(ir) };
    default:
      throw new Error(`Unknown format: ${format}. Supported: svg, html, mermaid`);
  }
}
