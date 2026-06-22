import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { createClientsStore } from '../../src/auth/oauth-clients-store.js';

const TEST_FILE = '/tmp/test-oauth-clients.json';

describe('createClientsStore', () => {
  let store;

  beforeEach(async () => {
    // Start with clean file
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
    store = await createClientsStore(TEST_FILE);
  });

  afterEach(async () => {
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
  });

  it('returns null for unknown client', async () => {
    const client = await store.getClient('nonexistent');
    expect(client).toBeNull();
  });

  it('registers a new client and retrieves it', async () => {
    const registered = await store.registerClient({
      client_name: 'Test Client',
      redirect_uris: ['http://localhost:9999/callback'],
    });

    expect(registered.client_id).toBeDefined();
    expect(registered.client_secret).toBeDefined();
    expect(registered.client_secret.length).toBe(64); // 32 bytes hex
    expect(registered.client_name).toBe('Test Client');
    expect(registered.redirect_uris).toEqual(['http://localhost:9999/callback']);
    expect(registered.client_id_issued_at).toBeTypeOf('number');

    const retrieved = await store.getClient(registered.client_id);
    expect(retrieved).toEqual(registered);
  });

  it('persists clients across store instances', async () => {
    const registered = await store.registerClient({
      client_name: 'Persistent Client',
      redirect_uris: ['http://localhost:8888/callback'],
    });

    // Create a new store instance pointing to the same file
    const store2 = await createClientsStore(TEST_FILE);
    const retrieved = await store2.getClient(registered.client_id);
    expect(retrieved.client_name).toBe('Persistent Client');
  });

  it('handles empty file gracefully', async () => {
    await writeFile(TEST_FILE, '{}', 'utf-8');
    const freshStore = await createClientsStore(TEST_FILE);
    const client = await freshStore.getClient('any');
    expect(client).toBeNull();
  });
});
