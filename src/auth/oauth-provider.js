/**
 * OAuth 2.0 server provider implementing the MCP SDK's OAuthServerProvider interface.
 *
 * Coordinates between:
 * - ClientsStore: registered OAuth clients
 * - TokenStore: authorization codes, access/refresh tokens
 *
 * Supports authorization code flow with PKCE (S256).
 */

import { InvalidGrantError, InvalidClientError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { randomBytes } from 'node:crypto';

/**
 * Creates an OAuth server provider compatible with the SDK's mcpAuthRouter().
 *
 * @param {object} opts
 * @param {import('./oauth-clients-store.js').ClientsStore} opts.clientsStore
 * @param {import('./oauth-token-store.js').OAuthTokenStore} opts.tokenStore
 * @returns {import('@modelcontextprotocol/sdk/server/auth/provider.js').OAuthServerProvider}
 */
export function createOAuthProvider({ clientsStore, tokenStore }) {
  return {
    // Expose clientsStore as required by the interface
    get clientsStore() {
      return clientsStore;
    },

    /**
     * Begin the authorization flow.
     *
     * Generates an authorization code bound to the PKCE challenge,
     * then redirects the client with the code and state.
     *
     * This is a programmatic authorization — no consent screen.
     * For production, you may want to add a consent UI here.
     */
    async authorize(client, params, res) {
      // Validate client
      if (!client) {
        throw new InvalidClientError('Unknown client');
      }

      const state = params.state;
      const scopes = params.scopes || ['*'];
      const codeChallenge = params.codeChallenge;
      const redirectUri = params.redirectUri;

      // Generate authorization code
      const code = randomBytes(32).toString('hex');

      // Store code with challenge for later verification
      await tokenStore.saveAuthorizationCode(
        code,
        client.client_id,
        codeChallenge,
        redirectUri,
        scopes,
      );

      // Build redirect URL with authorization code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      res.redirect(302, redirectUrl.href);
    },

    /**
     * Retrieve the PKCE code challenge for an authorization code.
     * Does NOT consume the code — the SDK calls this before exchangeAuthorizationCode.
     */
    async challengeForAuthorizationCode(_client, authorizationCode) {
      const challenge = await tokenStore.getCodeChallenge(authorizationCode);
      if (!challenge) {
        throw new InvalidGrantError('Authorization code is invalid or expired');
      }
      return challenge;
    },

    /**
     * Exchange an authorization code for access and refresh tokens.
     */
    async exchangeAuthorizationCode(client, authorizationCode, codeVerifier, redirectUri) {
      // Consume the authorization code
      const entry = await tokenStore.consumeAuthorizationCode(authorizationCode);
      if (!entry) {
        throw new InvalidGrantError('Authorization code is invalid or expired');
      }

      // Validate client matches
      if (entry.clientId !== client.client_id) {
        throw new InvalidGrantError('Authorization code was issued to a different client');
      }

      // Validate redirect URI if provided
      if (redirectUri && entry.redirectUri !== redirectUri) {
        throw new InvalidGrantError('Redirect URI mismatch');
      }

      // Issue tokens
      const tokens = await tokenStore.issueTokens(client.client_id, entry.scopes);

      return {
        access_token: tokens.accessToken,
        token_type: 'bearer',
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
        scope: entry.scopes.join(' '),
      };
    },

    /**
     * Exchange a refresh token for new tokens.
     */
    async exchangeRefreshToken(client, refreshToken, scopes) {
      const result = await tokenStore.exchangeRefreshToken(refreshToken);
      if (!result) {
        throw new InvalidGrantError('Refresh token is invalid or expired');
      }

      const effectiveScopes = scopes && scopes.length > 0 ? scopes : ['*'];

      return {
        access_token: result.accessToken,
        token_type: 'bearer',
        expires_in: result.expiresIn,
        refresh_token: result.refreshToken,
        scope: effectiveScopes.join(' '),
      };
    },

    /**
     * Verify an access token. Delegates to token store.
     */
    async verifyAccessToken(token) {
      return tokenStore.verifyAccessToken(token);
    },

    /**
     * Revoke an access or refresh token.
     */
    async revokeToken(_client, request) {
      await tokenStore.revokeToken(request.token);
    },
  };
}
