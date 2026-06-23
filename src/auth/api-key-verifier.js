/**
 * API Key verifier implementing the MCP SDK's token verification interface.
 *
 * Used with requireBearerAuth() middleware. Validates tokens against
 * the MCP_API_KEY environment variable.
 */

import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

/**
 * Creates an API key token verifier.
 *
 * @param {string} apiKey - The expected API key from MCP_API_KEY env var
 * @returns {{ verifyAccessToken: (token: string) => Promise<AuthInfo> }}
 */
export function createApiKeyVerifier(apiKey) {
  return {
    /**
     * Verify a bearer token against the configured API key.
     *
     * @param {string} token - The bearer token from the Authorization header
     * @returns {Promise<import('./types.js').AuthInfo>}
     * @throws {InvalidTokenError} if the token does not match
     */
    async verifyAccessToken(token) {
      if (token === apiKey) {
        return {
          clientId: 'api-key',
          scopes: ['*'],
          expiresAt: Number.POSITIVE_INFINITY,
        };
      }
      throw new InvalidTokenError('Invalid API key');
    },
  };
}
