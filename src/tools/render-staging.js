/**
 * MCP tool: render-staging
 *
 * Renders the current staging workspace in SVG, HTML, or Mermaid format.
 * Supports flow filtering, dirty highlighting, and interactive HTML output.
 */

import { ANN_READONLY } from './constants.js';
import { renderStaging } from '../renderer/index.js';

/**
 * Handler for the render-staging MCP tool.
 *
 * @param {import('../staging-store.js').StagingStore} staging
 * @returns {(params: object) => Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export function handleRenderStaging(staging) {
  return async (params) => {
    const {
      format = 'svg',
      flowId,
      highlightDirty = true,
    } = params;

    const flows = await staging.getFlows();
    const summary = staging.getStagingSummary();
    const dirtyNodeIds = new Set(summary.dirtyNodeIds);
    const dirtyFlowIds = new Set(summary.dirtyFlowIds);

    const result = renderStaging(flows, {
      format,
      flowId,
      highlightDirty,
      dirtyNodeIds,
      dirtyFlowIds,
    });

    switch (format) {
      case 'svg':
        return {
          content: [{ type: 'text', text: result.svg }],
        };
      case 'html':
        return {
          content: [{ type: 'text', text: result.html }],
        };
      case 'mermaid':
        return {
          content: [
            {
              type: 'text',
              text: `\`\`\`mermaid\n${result.mermaid}\n\`\`\``,
            },
          ],
        };
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  };
}

export const renderStagingDefinition = {
  name: 'render-staging',
  annotations: ANN_READONLY,
  handler: handleRenderStaging,
};
