/**
 * Shared response formatting utilities for MCP tool handlers.
 *
 * Provides consistent success/error response shapes across all tools.
 */

/**
 * Format a successful tool response.
 *
 * @param {any} data - The response data to serialize
 * @returns {{ content: Array<{ type: string, text: string }> }}
 */
export function formatSuccess(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response for a tool.
 *
 * @param {string} message - User-facing error message
 * @param {object} [details] - Optional additional details
 * @returns {{ content: Array<{ type: string, text: string }>, isError: boolean }}
 */
export function formatError(message, details) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ error: message, ...(details && { details }) }, null, 2),
    }],
    isError: true,
  };
}
