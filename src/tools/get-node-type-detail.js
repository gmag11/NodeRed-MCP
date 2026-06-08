/**
 * MCP tool: get-node-type-detail
 *
 * Returns detailed information about a specific node type installed in the
 * Node-RED palette, including its configuration parameters.
 */
import TurndownService from 'turndown';
import { formatSuccess } from './response-utils.js';

import { ANN_READONLY } from './constants.js';
import { GenericObjectSchema } from '../schemas/responses.js';
const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

/**
 * Extract the help HTML for a specific node type from the GET /nodes HTML response.
 *
 * The HTML response contains blocks of the form:
 *   <script type="text/html" data-help-name="<type>">...</script>
 *
 * @param {string} html - Full HTML body from GET /nodes with Accept: text/html
 * @param {string} typeName - The node type name to extract documentation for
 * @returns {string|null} Inner HTML of the help block, or null if not found
 */
export function extractHelpHtml(html, typeName) {
  // Escape special regex characters in the type name
  const escaped = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<script[^>]+data-help-name=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/script>`,
    'i'
  );
  const match = html.match(pattern);
  return match ? turndown.turndown(match[1].trim()) : null;
}

/**
 * Search the raw GET /nodes response for a specific type name and return its node set.
 *
 * @param {Array<object>} rawResponse - Array of node set objects from GET /nodes
 * @param {string} typeName - The node type to look up (e.g. "inject")
 * @returns {object} The raw node set object from the API
 * @throws {Error} If the type is not found in any installed node set
 */
export function findNodeType(rawResponse, typeName) {
  for (const nodeSet of rawResponse) {
    if ((nodeSet.types || []).includes(typeName)) {
      return nodeSet;
    }
  }

  throw new Error(`Node type '${typeName}' not found`);
}

/**
 * Handler for the get-node-type-detail MCP tool.
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.type - The node type name to look up
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleGetNodeTypeDetail(client, params) {
  const [rawResponse, helpHtml] = await Promise.all([
    client.request('GET', '/nodes'),
    client.requestText('GET', '/nodes'),
  ]);

  let nodeSet;
  try {
    nodeSet = findNodeType(rawResponse, params.type);
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: err.message,
        },
      ],
    };
  }

  const help = extractHelpHtml(helpHtml, params.type);
  const result = { ...nodeSet, help };

  return formatSuccess(result);
}

export const getNodeTypeDetailDefinition = {
  name: 'get-node-type-detail',
  annotations: ANN_READONLY,
  outputSchema: GenericObjectSchema,
  handler: handleGetNodeTypeDetail,
};
