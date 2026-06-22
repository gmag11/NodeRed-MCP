/**
 * JSON file-backed OAuth token and authorization code store.
 *
 * Handles:
 * - Authorization codes (temporary, with PKCE challenge)
 * - Access tokens (with clientId, scopes, expiry)
 * - Refresh tokens
 * - Token revocation
 *
 * Uses atomic writes (temp file + rename) to prevent corruption.
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

/** Default token store path when MCP_OAUTH_TOKENS_FILE is not set. */
const DEFAULT_TOKENS_PATH = 'oauth-tokens.json';

/** Access token lifetime: 1 hour */
const ACCESS_TOKEN_TTL_SEC = 3600;

/** Refresh token lifetime: 30 days */
const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 3600;

/** Authorization code lifetime: 10 minutes */
const AUTH_CODE_TTL_SEC = 600;

/**
 * Creates a JSON file-backed OAuth token store.
 *
 * @param {string|null} filePath - Path to the JSON tokens file (null = use default)
 * @returns {Promise<OAuthTokenStore>}
 */
export async function createTokenStore(filePath) {
  const resolvedPath = path.resolve(filePath || DEFAULT_TOKENS_PATH);
  const data = await loadTokens(resolvedPath);

  return {
    // ── Authorization codes ──────────────────────────────────────

    /**
     * Store an authorization code with its PKCE challenge.
     *
     * @param {string} code
     * @param {string} clientId
     * @param {string} codeChallenge
     * @param {string} redirectUri
     * @param {string[]} scopes
     */
    async saveAuthorizationCode(code, clientId, codeChallenge, redirectUri, scopes) {
      data.codes = data.codes || {};
      data.codes[code] = {
        clientId,
        codeChallenge,
        redirectUri,
        scopes,
        expiresAt: Math.floor(Date.now() / 1000) + AUTH_CODE_TTL_SEC,
      };
      await saveTokens(resolvedPath, data);
    },

    /**
     * Look up the PKCE challenge for an authorization code WITHOUT consuming it.
     * Returns null if the code is unknown or expired.
     *
     * @param {string} code
     * @returns {Promise<string|null>}
     */
    async getCodeChallenge(code) {
      data.codes = data.codes || {};
      const entry = data.codes[code];
      if (!entry) return null;
      if (entry.expiresAt < Math.floor(Date.now() / 1000)) {
        delete data.codes[code];
        await saveTokens(resolvedPath, data);
        return null;
      }
      return entry.codeChallenge;
    },

    /**
     * Retrieve and consume an authorization code.
     * Returns null if the code is unknown or expired.
     *
     * @param {string} code
     * @returns {Promise<object|null>}
     */
    async consumeAuthorizationCode(code) {
      data.codes = data.codes || {};
      const entry = data.codes[code];
      if (!entry) return null;

      // Check expiry
      if (entry.expiresAt < Math.floor(Date.now() / 1000)) {
        delete data.codes[code];
        await saveTokens(resolvedPath, data);
        return null;
      }

      // Consume the code (single-use)
      delete data.codes[code];
      await saveTokens(resolvedPath, data);

      return entry;
    },

    // ── Access tokens ─────────────────────────────────────────────

    /**
     * Issue a new access token (and optional refresh token).
     *
     * @param {string} clientId
     * @param {string[]} scopes
     * @returns {Promise<{ accessToken: string, refreshToken?: string, expiresIn: number }>}
     */
    async issueTokens(clientId, scopes) {
      data.tokens = data.tokens || {};

      const accessToken = randomBytes(32).toString('hex');
      const refreshToken = randomBytes(32).toString('hex');
      const nowSec = Math.floor(Date.now() / 1000);

      data.tokens[accessToken] = {
        clientId,
        scopes,
        expiresAt: nowSec + ACCESS_TOKEN_TTL_SEC,
      };

      // Store refresh token mapping
      data.refreshTokens = data.refreshTokens || {};
      data.refreshTokens[refreshToken] = {
        accessToken,
        clientId,
        scopes,
        expiresAt: nowSec + REFRESH_TOKEN_TTL_SEC,
      };

      await saveTokens(resolvedPath, data);

      return {
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_TTL_SEC,
      };
    },

    /**
     * Verify an access token. Returns the AuthInfo on success.
     *
     * @param {string} token
     * @returns {Promise<import('./types.js').AuthInfo>}
     * @throws {import('@modelcontextprotocol/sdk/server/auth/errors.js').InvalidTokenError}
     */
    async verifyAccessToken(token) {
      data.tokens = data.tokens || {};
      const entry = data.tokens[token];

      if (!entry) {
        throw new InvalidTokenError('Token not found');
      }

      if (entry.expiresAt < Math.floor(Date.now() / 1000)) {
        throw new InvalidTokenError('Token has expired');
      }

      return {
        token,
        clientId: entry.clientId,
        scopes: entry.scopes,
        expiresAt: entry.expiresAt,
      };
    },

    // ── Refresh tokens ────────────────────────────────────────────

    /**
     * Exchange a refresh token for a new access token.
     * The old access token is revoked and the refresh token is rotated.
     *
     * @param {string} refreshToken
     * @returns {Promise<{ accessToken: string, refreshToken: string, expiresIn: number }|null>}
     */
    async exchangeRefreshToken(refreshToken) {
      data.refreshTokens = data.refreshTokens || {};
      data.tokens = data.tokens || {};

      const rtEntry = data.refreshTokens[refreshToken];
      if (!rtEntry) return null;

      // Check refresh token expiry
      if (rtEntry.expiresAt < Math.floor(Date.now() / 1000)) {
        delete data.refreshTokens[refreshToken];
        await saveTokens(resolvedPath, data);
        return null;
      }

      // Revoke old access token
      const oldAccessToken = rtEntry.accessToken;
      if (oldAccessToken && data.tokens[oldAccessToken]) {
        delete data.tokens[oldAccessToken];
      }

      // Issue new tokens
      const newAccessToken = randomBytes(32).toString('hex');
      const newRefreshToken = randomBytes(32).toString('hex');
      const nowSec = Math.floor(Date.now() / 1000);

      data.tokens[newAccessToken] = {
        clientId: rtEntry.clientId,
        scopes: rtEntry.scopes,
        expiresAt: nowSec + ACCESS_TOKEN_TTL_SEC,
      };

      // Rotate refresh token
      delete data.refreshTokens[refreshToken];
      data.refreshTokens[newRefreshToken] = {
        accessToken: newAccessToken,
        clientId: rtEntry.clientId,
        scopes: rtEntry.scopes,
        expiresAt: nowSec + REFRESH_TOKEN_TTL_SEC,
      };

      await saveTokens(resolvedPath, data);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_TTL_SEC,
      };
    },

    // ── Revocation ────────────────────────────────────────────────

    /**
     * Revoke an access token or refresh token.
     * Does nothing if the token is already unknown.
     *
     * @param {string} token
     * @returns {Promise<void>}
     */
    async revokeToken(token) {
      let changed = false;

      // Check access tokens
      data.tokens = data.tokens || {};
      if (data.tokens[token]) {
        delete data.tokens[token];
        changed = true;
      }

      // Check refresh tokens
      data.refreshTokens = data.refreshTokens || {};
      if (data.refreshTokens[token]) {
        const rtEntry = data.refreshTokens[token];
        // Also revoke the associated access token
        if (rtEntry.accessToken && data.tokens[rtEntry.accessToken]) {
          delete data.tokens[rtEntry.accessToken];
        }
        delete data.refreshTokens[token];
        changed = true;
      }

      if (changed) {
        await saveTokens(resolvedPath, data);
      }
    },
  };
}

/**
 * Load token data from the JSON file, or return empty structure
 * if the file does not exist.
 *
 * @param {string} filePath
 * @returns {Promise<object>}
 */
async function loadTokens(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

/**
 * Atomically save token data to the JSON file.
 *
 * @param {string} filePath
 * @param {object} data
 * @returns {Promise<void>}
 */
async function saveTokens(filePath, data) {
  const tmpPath = filePath + '.tmp';
  await writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tmpPath, filePath);
}

/**
 * @typedef {object} OAuthTokenStore
 * @property {(code: string, clientId: string, codeChallenge: string, redirectUri: string, scopes: string[]) => Promise<void>} saveAuthorizationCode
 * @property {(code: string) => Promise<object|null>} consumeAuthorizationCode
 * @property {(clientId: string, scopes: string[]) => Promise<{ accessToken: string, refreshToken?: string, expiresIn: number }>} issueTokens
 * @property {(token: string) => Promise<import('./types.js').AuthInfo>} verifyAccessToken
 * @property {(refreshToken: string) => Promise<{ accessToken: string, refreshToken: string, expiresIn: number }|null>} exchangeRefreshToken
 * @property {(token: string) => Promise<void>} revokeToken
 */
