import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unlink } from 'node:fs/promises';
import { createTokenStore } from '../../src/auth/oauth-token-store.js';

const TEST_FILE = '/tmp/test-oauth-tokens.json';

describe('createTokenStore — authorization codes', () => {
  let store;

  beforeEach(async () => {
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
    store = await createTokenStore(TEST_FILE);
  });

  afterEach(async () => {
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
  });

  it('stores and retrieves a code challenge without consuming', async () => {
    await store.saveAuthorizationCode('code-1', 'client-1', 'challenge-abc', 'http://localhost/cb', ['*']);
    const challenge = await store.getCodeChallenge('code-1');
    expect(challenge).toBe('challenge-abc');

    // Code should still be retrievable (not consumed)
    const challenge2 = await store.getCodeChallenge('code-1');
    expect(challenge2).toBe('challenge-abc');
  });

  it('returns null for unknown code', async () => {
    const challenge = await store.getCodeChallenge('unknown');
    expect(challenge).toBeNull();
  });

  it('consumes authorization code on exchange', async () => {
    await store.saveAuthorizationCode('code-2', 'client-2', 'challenge-xyz', 'http://localhost/cb', ['*']);
    const entry = await store.consumeAuthorizationCode('code-2');
    expect(entry.clientId).toBe('client-2');
    expect(entry.codeChallenge).toBe('challenge-xyz');

    // Code should be gone after consumption
    const entry2 = await store.consumeAuthorizationCode('code-2');
    expect(entry2).toBeNull();
  });
});

describe('createTokenStore — tokens', () => {
  let store;

  beforeEach(async () => {
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
    store = await createTokenStore(TEST_FILE);
  });

  afterEach(async () => {
    try { await unlink(TEST_FILE); } catch { /* ok */ }
    try { await unlink(TEST_FILE + '.tmp'); } catch { /* ok */ }
  });

  it('issues and verifies an access token', async () => {
    const tokens = await store.issueTokens('client-1', ['*']);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(3600);

    const authInfo = await store.verifyAccessToken(tokens.accessToken);
    expect(authInfo.clientId).toBe('client-1');
    expect(authInfo.scopes).toEqual(['*']);
    expect(authInfo.expiresAt).toBeTypeOf('number');
  });

  it('throws for unknown access token', async () => {
    await expect(store.verifyAccessToken('unknown-token'))
      .rejects.toThrow('Token not found');
  });

  it('exchanges a refresh token for new tokens', async () => {
    const tokens = await store.issueTokens('client-1', ['*']);

    const newTokens = await store.exchangeRefreshToken(tokens.refreshToken);
    expect(newTokens.accessToken).toBeDefined();
    expect(newTokens.refreshToken).toBeDefined();
    expect(newTokens.accessToken).not.toBe(tokens.accessToken);
    expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);

    // Old access token should be revoked
    await expect(store.verifyAccessToken(tokens.accessToken))
      .rejects.toThrow('Token not found');
  });

  it('returns null for unknown refresh token', async () => {
    const result = await store.exchangeRefreshToken('unknown-rt');
    expect(result).toBeNull();
  });

  it('revokes an access token', async () => {
    const tokens = await store.issueTokens('client-1', ['*']);
    await store.verifyAccessToken(tokens.accessToken); // should work

    await store.revokeToken(tokens.accessToken);

    await expect(store.verifyAccessToken(tokens.accessToken))
      .rejects.toThrow('Token not found');
  });

  it('revokes a refresh token', async () => {
    const tokens = await store.issueTokens('client-1', ['*']);

    await store.revokeToken(tokens.refreshToken);

    const result = await store.exchangeRefreshToken(tokens.refreshToken);
    expect(result).toBeNull();
  });

  it('revoke is idempotent for unknown tokens', async () => {
    await expect(store.revokeToken('never-existed')).resolves.toBeUndefined();
  });

  it('persists tokens across store instances', async () => {
    const tokens = await store.issueTokens('client-1', ['*']);

    const store2 = await createTokenStore(TEST_FILE);
    const authInfo = await store2.verifyAccessToken(tokens.accessToken);
    expect(authInfo.clientId).toBe('client-1');
  });
});
