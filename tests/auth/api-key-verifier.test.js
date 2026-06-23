import { describe, it, expect } from 'vitest';
import { createApiKeyVerifier } from '../../src/auth/api-key-verifier.js';

const VALID_KEY = 'test-api-key-12345';

describe('createApiKeyVerifier', () => {
  const verifier = createApiKeyVerifier(VALID_KEY);

  it('returns AuthInfo for a valid API key', async () => {
    const result = await verifier.verifyAccessToken(VALID_KEY);
    expect(result.clientId).toBe('api-key');
    expect(result.scopes).toEqual(['*']);
    expect(result.expiresAt).toBe(Number.POSITIVE_INFINITY);
  });

  it('throws InvalidTokenError for an invalid API key', async () => {
    await expect(verifier.verifyAccessToken('wrong-key'))
      .rejects.toThrow('Invalid API key');
  });

  it('throws InvalidTokenError for an empty token', async () => {
    await expect(verifier.verifyAccessToken(''))
      .rejects.toThrow('Invalid API key');
  });
});
