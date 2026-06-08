/**
 * Shared response formatting utilities for MCP tool handlers.
 *
 * Provides consistent success/error response shapes across all tools.
 */

/**
 * Format a successful tool response.
 *
 * structuredContent is only included when `data` is a plain object (record),
 * because the MCP SDK requires structuredContent to be a record, not an array.
 *
 * @param {any} data - The response data to serialize
 * @returns {{ content: Array<{ type: string, text: string }>, structuredContent?: object }}
 */
export function formatSuccess(data) {
  const response = {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
  // MCP SDK requires structuredContent to be a record (object); arrays are rejected
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    response.structuredContent = data;
  }
  return response;
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
