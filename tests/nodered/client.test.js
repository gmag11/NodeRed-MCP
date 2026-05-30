import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNodeRedClient } from '../../src/nodered/client.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createNodeRedClient', () => {
  let mockAuthManager;
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthManager = {
      getAuthHeader: vi.fn(() => 'Bearer test-token'),
      reauthenticate: vi.fn(),
    };
    client = createNodeRedClient('http://localhost:1880', mockAuthManager);
  });

  describe('successful requests', () => {
    it('returns parsed JSON on 200', async () => {
      const data = { rev: '1', flows: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => data,
      });

      const result = await client.request('GET', '/flows');
      expect(result).toEqual(data);
    });

    it('includes Node-RED-API-Version and Authorization headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.request('GET', '/flows');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1880/flows',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Node-RED-API-Version': 'v2',
            'Authorization': 'Bearer test-token',
          }),
        }),
      );
    });

    it('omits Authorization when auth returns null', async () => {
      mockAuthManager.getAuthHeader.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await client.request('GET', '/settings');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
      expect(callHeaders['Node-RED-API-Version']).toBe('v2');
    });
  });

  describe('error handling', () => {
    it('throws on 404 with method, path and status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.request('GET', '/missing'))
        .rejects.toThrow(/GET.*\/missing.*404/);
    });

    it('throws on 500 with method, path and status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.request('POST', '/flows'))
        .rejects.toThrow(/POST.*\/flows.*500/);
    });
  });

  describe('401 retry', () => {
    it('retries once on 401 after re-authentication', async () => {
      const data = { rev: '1', flows: [] };

      // First call: 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });
      // Retry: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => data,
      });

      const result = await client.request('GET', '/flows');

      expect(result).toEqual(data);
      expect(mockAuthManager.reauthenticate).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws after failed retry on 401', async () => {
      // First call: 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });
      // Retry: also 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Still Unauthorized',
      });

      await expect(client.request('GET', '/flows'))
        .rejects.toThrow(/re-auth.*GET.*\/flows.*401/);
    });
  });
});
