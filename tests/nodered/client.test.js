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
        text: async () => JSON.stringify(data),
      });

      const result = await client.request('GET', '/flows');
      expect(result).toEqual(data);
    });

    it('includes Node-RED-API-Version and Authorization headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '{}',
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
        text: async () => '{}',
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
        text: async () => JSON.stringify(data),
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

  describe('requestText', () => {
    it('returns raw response body as a string on 200', async () => {
      const html = '<html>nodes help</html>';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => html,
      });

      const result = await client.requestText('GET', '/nodes');
      expect(result).toBe(html);
    });

    it('includes Authorization and Node-RED-API-Version headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      await client.requestText('GET', '/nodes');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1880/nodes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Node-RED-API-Version': 'v2',
            'Authorization': 'Bearer test-token',
          }),
        }),
      );
    });

    it('does not include Accept: application/json header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      await client.requestText('GET', '/nodes');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Accept');
    });

    it('throws on 404 with method, path and status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.requestText('GET', '/nodes'))
        .rejects.toThrow(/GET.*\/nodes.*404/);
    });

    it('retries once on 401 and returns text on success', async () => {
      const html = '<html>help</html>';
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => html });

      const result = await client.requestText('GET', '/nodes');
      expect(result).toBe(html);
      expect(mockAuthManager.reauthenticate).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // putFlows
  // ---------------------------------------------------------------------------

  describe('putFlows', () => {
    it('sends PUT /flows with Node-RED-Deployment-Type: flows by default', async () => {
      const payload = { rev: 'abc123', flows: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rev: 'abc124' }),
        text: async () => JSON.stringify({ rev: 'abc124' }),
      });

      await client.putFlows(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1880/flows',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Node-RED-Deployment-Type': 'flows',
          }),
        }),
      );
    });

    it('sends a custom deploy type when specified', async () => {
      const payload = { rev: 'abc123', flows: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rev: 'abc124' }),
        text: async () => JSON.stringify({ rev: 'abc124' }),
      });

      await client.putFlows(payload, 'full');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['Node-RED-Deployment-Type']).toBe('full');
    });

    it('includes standard headers alongside deployment type header', async () => {
      const payload = { rev: 'abc123', flows: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rev: 'abc124' }),
        text: async () => JSON.stringify({ rev: 'abc124' }),
      });

      await client.putFlows(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1880/flows',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Node-RED-API-Version': 'v2',
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Node-RED-Deployment-Type': 'flows',
          }),
        }),
      );
    });

    it('serializes the payload as JSON in the body', async () => {
      const payload = { rev: 'r1', flows: [{ id: 'n1', type: 'tab' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rev: 'r2' }),
        text: async () => JSON.stringify({ rev: 'r2' }),
      });

      await client.putFlows(payload);

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(JSON.parse(callBody)).toEqual(payload);
    });
  });
});
