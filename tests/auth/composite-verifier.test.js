import { describe, it, expect } from 'vitest';
import { createCompositeVerifier } from '../../src/auth/composite-verifier.js';
import { createApiKeyVerifier } from '../../src/auth/api-key-verifier.js';

const VALID_KEY = 'composite-test-key';

describe('createCompositeVerifier', () => {
  it('accepts a valid API key when only API key is configured', async () => {
    const apiKeyVerifier = createApiKeyVerifier(VALID_KEY);
    const verifier = createCompositeVerifier({
      apiKey: VALID_KEY,
      oauthVerifier: null,
    });

    const result = await verifier.verifyAccessToken(VALID_KEY);
    expect(result.clientId).toBe('api-key');
    expect(result.scopes).toEqual(['*']);
    expect(result.expiresAt).toBe(Number.POSITIVE_INFINITY);
  });

  it('rejects invalid API key when only API key is configured', async () => {
    const verifier = createCompositeVerifier({
      apiKey: VALID_KEY,
      oauthVerifier: null,
    });

    await expect(verifier.verifyAccessToken('wrong'))
      .rejects.toThrow('Invalid API key');
  });

  it('falls through to OAuth when API key is not set', async () => {
    const oauthVerifier = {
      async verifyAccessToken(token) {
        if (token === 'valid-oauth-token') {
          return {
            token,
            clientId: 'oauth-client',
            scopes: ['read'],
            expiresAt: Date.now() / 1000 + 3600,
          };
        }
        throw new Error('OAuth verification failed');
      },
    };

    const verifier = createCompositeVerifier({
      apiKey: null,
      oauthVerifier,
    });

    const result = await verifier.verifyAccessToken('valid-oauth-token');
    expect(result.clientId).toBe('oauth-client');
    expect(result.scopes).toEqual(['read']);
  });

  it('API key takes priority over OAuth (fast path)', async () => {
    let oauthCalled = false;
    const oauthVerifier = {
      async verifyAccessToken(_token) {
        oauthCalled = true;
        return { token: 'x', clientId: 'c', scopes: [], expiresAt: 0 };
      },
    };

    const verifier = createCompositeVerifier({
      apiKey: VALID_KEY,
      oauthVerifier,
    });

    const result = await verifier.verifyAccessToken(VALID_KEY);
    expect(result.clientId).toBe('api-key');
    // OAuth should NOT have been called
    expect(oauthCalled).toBe(false);
  });

  it('rejects when no verifier is configured', async () => {
    const verifier = createCompositeVerifier({
      apiKey: null,
      oauthVerifier: null,
    });

    await expect(verifier.verifyAccessToken('anything'))
      .rejects.toThrow('No authentication method configured');
  });
});
