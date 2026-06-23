/**
 * Composite token verifier that tries API key first, then falls through to OAuth.
 *
 * Used as the single verifier passed to the SDK's requireBearerAuth() middleware.
 * Supports three modes:
 * - API key only: fast path comparison, no file I/O
 * - OAuth only: delegates to the OAuth provider's verifyAccessToken
 * - Both: API key first (fast path), then OAuth
 */

import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

/**
 * Creates a composite verifier from the auth configuration.
 *
 * @param {object} opts
 * @param {string|null} opts.apiKey - API key from config (null = disabled)
 * @param {import('@modelcontextprotocol/sdk/server/auth/provider.js').OAuthTokenVerifier|null} opts.oauthVerifier - OAuth verifier (null = disabled)
 * @returns {import('@modelcontextprotocol/sdk/server/auth/provider.js').OAuthTokenVerifier}
 */
export function createCompositeVerifier({ apiKey, oauthVerifier }) {
  return {
    /**
     * Verify a bearer token.
     *
     * Tries API key match first (fast, no I/O), then falls through to OAuth.
     *
     * @param {string} token
     * @returns {Promise<import('./types.js').AuthInfo>}
     */
    async verifyAccessToken(token) {
      // Fast path: API key
      if (apiKey) {
        if (token === apiKey) {
          return {
            token,
            clientId: 'api-key',
            scopes: ['*'],
            expiresAt: Number.POSITIVE_INFINITY,
          };
        }
        // API key is configured but token doesn't match.
        // If OAuth is also configured, fall through to it.
        // Otherwise, reject immediately.
        if (!oauthVerifier) {
          throw new InvalidTokenError('Invalid API key');
        }
      }

      // Fall through to OAuth
      if (oauthVerifier) {
        return oauthVerifier.verifyAccessToken(token);
      }

      // No verifier available — defensive, should not happen
      throw new InvalidTokenError('No authentication method configured');
    },
  };
}
