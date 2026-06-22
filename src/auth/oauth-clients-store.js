/**
 * JSON file-backed OAuth client registry.
 *
 * Implements the SDK's client store interface:
 * - getClient(clientId): retrieves a registered client
 * - registerClient(clientData): registers a new OAuth client
 *
 * Uses atomic writes (temp file + rename) to prevent corruption.
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import path from 'node:path';

/** Default clients store path when MCP_OAUTH_CLIENTS_FILE is not set. */
const DEFAULT_CLIENTS_PATH = 'oauth-clients.json';

/**
 * Creates a JSON file-backed OAuth client registry.
 *
 * @param {string|null} filePath - Path to the JSON clients file (null = use default)
 * @returns {Promise<ClientsStore>}
 */
export async function createClientsStore(filePath) {
  const resolvedPath = path.resolve(filePath || DEFAULT_CLIENTS_PATH);
  const clients = await loadClients(resolvedPath);

  return {
    /**
     * Retrieve a registered OAuth client by ID.
     *
     * @param {string} clientId
     * @returns {Promise<object|null>} The client object or null if not found
     */
    async getClient(clientId) {
      return clients[clientId] || null;
    },

    /**
     * Register a new OAuth client (Dynamic Client Registration).
     *
     * Generates client_id and client_secret cryptographically.
     *
     * @param {object} clientData
     * @param {string} clientData.client_name
     * @param {string[]} clientData.redirect_uris
     * @returns {Promise<object>} The registered client
     */
    async registerClient(clientData) {
      const clientId = randomUUID();
      const clientSecret = randomBytes(32).toString('hex');

      const client = {
        client_id: clientId,
        client_secret: clientSecret,
        client_name: clientData.client_name,
        redirect_uris: clientData.redirect_uris,
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };

      clients[clientId] = client;
      await saveClients(resolvedPath, clients);

      return client;
    },
  };
}

/**
 * Load clients from the JSON file, or return empty object if the file
 * does not exist.
 *
 * @param {string} filePath
 * @returns {Promise<Record<string, object>>}
 */
async function loadClients(filePath) {
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

/**
 * Atomically save clients to the JSON file.
 *
 * Writes to a temp file first, then renames it over the target.
 *
 * @param {string} filePath
 * @param {Record<string, object>} clients
 * @returns {Promise<void>}
 */
async function saveClients(filePath, clients) {
  const tmpPath = filePath + '.tmp';
  await writeFile(tmpPath, JSON.stringify(clients, null, 2), 'utf-8');
  await rename(tmpPath, filePath);
}

/**
 * @typedef {object} ClientsStore
 * @property {(clientId: string) => Promise<object|null>} getClient
 * @property {(clientData: object) => Promise<object>} registerClient
 */
