/**
 * Integration tests for HTTP transport authentication.
 *
 * Tests the requireBearerAuth middleware pipeline at the HTTP level
 * without requiring the full Node-RED backend.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import http from 'node:http';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { createCompositeVerifier } from '../../src/auth/composite-verifier.js';

const API_KEY = 'integration-test-key-abc123';
const PORT = 19876; // unlikely to conflict

/**
 * Helper: make an HTTP request to the test server.
 */
function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${PORT}`);
    const req = http.request(
      url,
      { method: 'GET', headers },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on('error', (err) => reject(err));
    req.end();
  });
}

describe('HTTP transport auth integration', () => {
  let server;

  beforeAll(async () => {
    const app = express();

    // ── Protected route with auth ────────────────────────────────
    const authMiddleware = requireBearerAuth({
      verifier: createCompositeVerifier({
        apiKey: API_KEY,
        oauthVerifier: null,
      }),
      requiredScopes: [],
    });

    app.use('/mcp', authMiddleware);
    app.get('/mcp', (_req, res) => {
      res.json({ status: 'ok', clientId: _req.auth?.clientId });
    });

    // ── Unprotected route (backward compat simulation) ──────────
    app.get('/unprotected', (_req, res) => {
      res.json({ status: 'ok' });
    });

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // ── 9.5 API Key tests ───────────────────────────────────────

  it('valid API key grants access', async () => {
    const res = await request('/mcp', {
      Authorization: `Bearer ${API_KEY}`,
    });
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.clientId).toBe('api-key');
  });

  it('invalid API key returns 401', async () => {
    const res = await request('/mcp', {
      Authorization: 'Bearer wrong-key',
    });
    expect(res.status).toBe(401);
  });

  it('missing Authorization header returns 401', async () => {
    const res = await request('/mcp');
    expect(res.status).toBe(401);
  });

  // ── 9.8 No auth configured (unprotected route) ──────────────

  it('unprotected route works without auth', async () => {
    const res = await request('/unprotected');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });
});
