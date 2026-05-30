import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from '../../src/nodered/auth.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('AuthManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mode: none', () => {
    it('returns null from getAuthHeader when no auth required', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const manager = new AuthManager({ baseUrl: 'http://localhost:1880' });
      await manager.init();

      expect(manager.mode).toBe('none');
      expect(manager.getAuthHeader()).toBeNull();
    });
  });

  describe('mode: apikey', () => {
    it('returns Bearer header with API key directly', async () => {
      const manager = new AuthManager({
        baseUrl: 'http://localhost:1880',
        apiKey: 'my-secret-key',
      });
      await manager.init();

      expect(manager.mode).toBe('apikey');
      expect(manager.getAuthHeader()).toBe('Bearer my-secret-key');
      // Should NOT have called fetch (no detection needed)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('mode: credentials', () => {
    it('obtains token and returns Bearer header', async () => {
      // First call: GET /auth/login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'credentials', prompts: [] }),
      });
      // Second call: POST /auth/token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123' }),
      });

      const manager = new AuthManager({
        baseUrl: 'http://localhost:1880',
        username: 'admin',
        password: 'pass',
      });
      await manager.init();

      expect(manager.mode).toBe('credentials');
      expect(manager.getAuthHeader()).toBe('Bearer tok-123');
    });

    it('throws when credentials are missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'credentials', prompts: [] }),
      });

      const manager = new AuthManager({ baseUrl: 'http://localhost:1880' });
      await expect(manager.init()).rejects.toThrow(/NODERED_USERNAME/);
    });

    it('throws on token acquisition failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'credentials', prompts: [] }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const manager = new AuthManager({
        baseUrl: 'http://localhost:1880',
        username: 'admin',
        password: 'wrong',
      });
      await expect(manager.init()).rejects.toThrow(/401/);
    });
  });

  describe('unsupported auth type', () => {
    it('throws descriptive error suggesting NODERED_API_KEY', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'strategy' }),
      });

      const manager = new AuthManager({ baseUrl: 'http://localhost:1880' });
      await expect(manager.init()).rejects.toThrow(/NODERED_API_KEY/);
    });
  });

  describe('reauthenticate', () => {
    it('obtains a new token on reauthenticate', async () => {
      // init: detect + first token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'credentials', prompts: [] }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-1' }),
      });

      const manager = new AuthManager({
        baseUrl: 'http://localhost:1880',
        username: 'admin',
        password: 'pass',
      });
      await manager.init();
      expect(manager.getAuthHeader()).toBe('Bearer tok-1');

      // reauthenticate: new token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-2' }),
      });
      await manager.reauthenticate();
      expect(manager.getAuthHeader()).toBe('Bearer tok-2');
    });
  });
});
