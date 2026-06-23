/**
 * MCP server authentication configuration.
 *
 * Reads and validates all auth-related environment variables.
 * Centralizes validation so invalid config is caught at startup,
 * not at request time.
 */

/**
 * Validates and returns the frozen auth configuration.
 *
 * @returns {Readonly<AuthConfig>}
 */
export function loadAuthConfig() {
  const apiKey = (process.env.MCP_API_KEY || '').trim() || null;
  const oauthEnabled = process.env.MCP_OAUTH_ENABLED === 'true';
  const oauthIssuerUrl = (process.env.MCP_OAUTH_ISSUER_URL || '').trim() || null;
  const oauthClientsFile = (process.env.MCP_OAUTH_CLIENTS_FILE || '').trim() || null;
  const oauthTokensFile = (process.env.MCP_OAUTH_TOKENS_FILE || '').trim() || null;

  // Validate OAuth configuration when enabled
  if (oauthEnabled) {
    if (!oauthIssuerUrl) {
      throw new Error(
        'MCP_OAUTH_ENABLED is true but MCP_OAUTH_ISSUER_URL is not set. ' +
        'Set MCP_OAUTH_ISSUER_URL to the public base URL of this server ' +
        '(e.g., https://nodered-mcp.example.com).'
      );
    }

    let issuer;
    try {
      issuer = new URL(oauthIssuerUrl);
    } catch {
      throw new Error(
        `MCP_OAUTH_ISSUER_URL is not a valid URL: "${oauthIssuerUrl}"`
      );
    }

    // Allow http://localhost for development
    if (issuer.protocol !== 'https:' &&
        issuer.hostname !== 'localhost' &&
        issuer.hostname !== '127.0.0.1') {
      throw new Error(
        `MCP_OAUTH_ISSUER_URL must use HTTPS in production. Got: "${oauthIssuerUrl}". ` +
        'http://localhost is allowed for development.'
      );
    }

    // RFC 8414: issuer URL must not have fragment or query
    if (issuer.hash) {
      throw new Error(
        `MCP_OAUTH_ISSUER_URL must not have a fragment: "${oauthIssuerUrl}"`
      );
    }
    if (issuer.search) {
      throw new Error(
        `MCP_OAUTH_ISSUER_URL must not have a query string: "${oauthIssuerUrl}"`
      );
    }
  }

  const config = Object.freeze({
    /** @type {string|null} API key for Bearer token auth. null = auth disabled. */
    apiKey,

    /** @type {boolean} Whether OAuth 2.0 authorization server is enabled. */
    oauthEnabled,

    /** @type {string|null} Base issuer URL for OAuth metadata. Required when oauthEnabled. */
    oauthIssuerUrl,

    /** @type {string|null} Path to JSON file storing OAuth clients. */
    oauthClientsFile,

    /** @type {string|null} Path to JSON file storing OAuth tokens. */
    oauthTokensFile,
  });

  // Determine the display auth mode string
  const mode = getAuthModeLabel(config);

  return { config, mode };
}

/**
 * Returns a human-readable label for the current auth configuration.
 *
 * @param {Readonly<AuthConfig>} config
 * @returns {string}
 */
function getAuthModeLabel(config) {
  const parts = [];
  if (config.apiKey) parts.push('api-key');
  if (config.oauthEnabled) parts.push('oauth');
  return parts.length > 0 ? parts.join(' + ') : 'none';
}

/**
 * @typedef {object} AuthConfig
 * @property {string|null} apiKey
 * @property {boolean} oauthEnabled
 * @property {string|null} oauthIssuerUrl
 * @property {string|null} oauthClientsFile
 * @property {string|null} oauthTokensFile
 */
