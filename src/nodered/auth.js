/**
 * Node-RED authentication module.
 *
 * Supports three modes:
 * - none: no authentication required
 * - credentials: username/password → Bearer token
 * - apikey: static API key used directly as Bearer token
 */

/**
 * Detect the authentication mode of a Node-RED instance.
 *
 * If NODERED_API_KEY is set, returns 'apikey' immediately without probing.
 * Otherwise calls GET /auth/login to determine the mode.
 *
 * @param {string} baseUrl - Node-RED instance URL
 * @param {string} [apiKey] - Static API key (skips detection if provided)
 * @returns {Promise<'none'|'credentials'|'apikey'>}
 */
export async function detectAuthMode(baseUrl, apiKey) {
  if (apiKey) {
    return 'apikey';
  }

  const res = await fetch(`${baseUrl}/auth/login`);
  if (!res.ok) {
    throw new Error(`Failed to detect auth mode: GET /auth/login returned ${res.status}`);
  }

  const body = await res.json();

  // Empty object means no authentication configured
  if (!body.type) {
    return 'none';
  }

  if (body.type === 'credentials') {
    return 'credentials';
  }

  throw new Error(
    `Unsupported Node-RED auth type: "${body.type}". ` +
    `Set NODERED_API_KEY in your environment to authenticate with a static token.`
  );
}

/**
 * Obtain an access token from Node-RED using the credentials grant.
 *
 * @param {string} baseUrl - Node-RED instance URL
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string>} The access_token
 */
export async function getToken(baseUrl, username, password) {
  const res = await fetch(`${baseUrl}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 'node-red-admin',
      grant_type: 'password',
      scope: '*',
      username,
      password,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain Node-RED token: POST /auth/token returned ${res.status}`);
  }

  const body = await res.json();
  return body.access_token;
}

/**
 * Manages authentication state for a single Node-RED instance.
 */
export class AuthManager {
  #baseUrl;
  #username;
  #password;
  #apiKey;
  #token = null;
  #mode = null;

  /**
   * @param {object} config
   * @param {string} config.baseUrl - Node-RED instance URL
   * @param {string} [config.username]
   * @param {string} [config.password]
   * @param {string} [config.apiKey]
   */
  constructor({ baseUrl, username, password, apiKey }) {
    this.#baseUrl = baseUrl;
    this.#username = username;
    this.#password = password;
    this.#apiKey = apiKey;
  }

  /**
   * Initialize the auth manager: detect mode and acquire token if needed.
   * Must be called once before using getAuthHeader().
   */
  async init() {
    this.#mode = await detectAuthMode(this.#baseUrl, this.#apiKey);

    if (this.#mode === 'credentials') {
      if (!this.#username || !this.#password) {
        throw new Error(
          'Node-RED requires credentials authentication but NODERED_USERNAME and/or NODERED_PASSWORD are not set.'
        );
      }
      this.#token = await getToken(this.#baseUrl, this.#username, this.#password);
    } else if (this.#mode === 'apikey') {
      this.#token = this.#apiKey;
    }
  }

  /**
   * Returns the current auth mode.
   * @returns {'none'|'credentials'|'apikey'|null}
   */
  get mode() {
    return this.#mode;
  }

  /**
   * Returns the Authorization header value, or null if no auth is needed.
   * @returns {string|null}
   */
  getAuthHeader() {
    if (this.#mode === 'none' || !this.#token) {
      return null;
    }
    return `Bearer ${this.#token}`;
  }

  /**
   * Invalidate the current token and re-authenticate.
   * Only applicable for credentials mode.
   * @returns {Promise<void>}
   */
  async reauthenticate() {
    if (this.#mode !== 'credentials') {
      return;
    }
    this.#token = null;
    this.#token = await getToken(this.#baseUrl, this.#username, this.#password);
  }

  /**
   * Invalidate the current token (e.g., after a 401).
   */
  invalidateToken() {
    this.#token = null;
  }
}
