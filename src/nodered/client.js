/**
 * Generic HTTP client for the Node-RED Admin API.
 *
 * Wraps native fetch with:
 * - Automatic Node-RED-API-Version: v2 header
 * - Authorization header via AuthManager
 * - 401 retry (re-authenticate once then retry)
 * - Descriptive errors for non-2xx responses
 */

/**
 * Create a Node-RED API client bound to an AuthManager.
 *
 * @param {string} baseUrl - Node-RED instance URL
 * @param {import('./auth.js').AuthManager} authManager
 * @returns {{ request: (method: string, path: string, body?: any) => Promise<any> }}
 */
export function createNodeRedClient(baseUrl, authManager) {
  /**
   * Make a request to the Node-RED Admin API.
   *
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} path - API path (e.g., '/flows')
   * @param {any} [body] - Request body (will be JSON-serialized)
   * @returns {Promise<any>} Parsed JSON response
   */
  async function request(method, path, body) {
    const url = `${baseUrl}${path}`;

    const res = await doFetch(method, url, body);

    // Handle 401: invalidate token, re-authenticate, retry once
    if (res.status === 401) {
      await authManager.reauthenticate();
      const retryRes = await doFetch(method, url, body);

      if (!retryRes.ok) {
        const retryBody = await safeReadBody(retryRes);
        throw new Error(
          `Node-RED API error after re-auth: ${method} ${path} returned ${retryRes.status}` +
          (retryBody ? ` — ${retryBody}` : '')
        );
      }

      return retryRes.json();
    }

    if (!res.ok) {
      const errorBody = await safeReadBody(res);
      throw new Error(
        `Node-RED API error: ${method} ${path} returned ${res.status}` +
        (errorBody ? ` — ${errorBody}` : '')
      );
    }

    return res.json();
  }

  /**
   * Internal fetch helper that builds the correct headers.
   */
  async function doFetch(method, url, body) {
    const headers = {
      'Node-RED-API-Version': 'v2',
      'Accept': 'application/json',
    };

    const authHeader = authManager.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a request to the Node-RED Admin API and return the raw response body as text.
   * Useful for endpoints that return HTML (e.g. GET /nodes with Accept: text/html).
   *
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} path - API path (e.g., '/nodes')
   * @returns {Promise<string>} Raw response body as a string
   */
  async function requestText(method, path) {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Node-RED-API-Version': 'v2',
    };

    const authHeader = authManager.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let res = await fetch(url, { method, headers });

    if (res.status === 401) {
      await authManager.reauthenticate();
      const authHeader2 = authManager.getAuthHeader();
      if (authHeader2) {
        headers['Authorization'] = authHeader2;
      }
      res = await fetch(url, { method, headers });

      if (!res.ok) {
        const retryBody = await safeReadBody(res);
        throw new Error(
          `Node-RED API error after re-auth: ${method} ${path} returned ${res.status}` +
          (retryBody ? ` — ${retryBody}` : '')
        );
      }
    } else if (!res.ok) {
      const errorBody = await safeReadBody(res);
      throw new Error(
        `Node-RED API error: ${method} ${path} returned ${res.status}` +
        (errorBody ? ` — ${errorBody}` : '')
      );
    }

    return res.text();
  }

  return { request, requestText };
}

/**
 * Safely read the response body as text for error messages.
 * Returns null if the body cannot be read.
 */
async function safeReadBody(res) {
  try {
    const text = await res.text();
    return text.length > 200 ? text.slice(0, 200) + '…' : text;
  } catch {
    return null;
  }
}
