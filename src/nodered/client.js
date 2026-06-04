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
 * @returns {{ request: (method: string, path: string, body?: any, extraHeaders?: object) => Promise<any>, requestText: (method: string, path: string) => Promise<string>, putFlows: (flowsPayload: any, deployType?: string) => Promise<any>, post: (path: string, body?: any) => Promise<any> }}
 */
export function createNodeRedClient(baseUrl, authManager) {
  /**
   * Make a request to the Node-RED Admin API.
   *
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} path - API path (e.g., '/flows')
   * @param {any} [body] - Request body (will be JSON-serialized)
   * @returns {Promise<any>} Parsed JSON response, or raw text if the response is not valid JSON
   */
  async function request(method, path, body, extraHeaders) {
    const url = `${baseUrl}${path}`;

    const res = await doFetch(method, url, body, extraHeaders);

    // Handle 401: invalidate token, re-authenticate, retry once
    if (res.status === 401) {
      await authManager.reauthenticate();
      const retryRes = await doFetch(method, url, body, extraHeaders);

      if (!retryRes.ok) {
        const retryBody = await safeReadBody(retryRes);
        throw new Error(
          `Node-RED API error after re-auth: ${method} ${path} returned ${retryRes.status}` +
            (retryBody ? ` — ${retryBody}` : '')
        );
      }

      return retryRes.status === 204 ? null : parseResponseBody(retryRes);
    }

    if (!res.ok) {
      const errorBody = await safeReadBody(res);
      throw new Error(
        `Node-RED API error: ${method} ${path} returned ${res.status}` +
          (errorBody ? ` — ${errorBody}` : '')
      );
    }

    return res.status === 204 ? null : parseResponseBody(res);
  }

  /**
   * Read the response body and parse as JSON. If JSON parsing fails,
   * return the raw text (some Node-RED endpoints return plain text).
   *
   * @param {Response} res - Fetch Response object
   * @returns {Promise<any>} Parsed JSON or raw text
   */
  async function parseResponseBody(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Internal fetch helper that builds the correct headers.
   */
  async function doFetch(method, url, body, extraHeaders) {
    console.error(`[NodeRed-MCP] → ${method} ${url}`);

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

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(res => {
      console.error(`[NodeRed-MCP] ← ${res.status} ${method} ${url}`);
      return res;
    });
  }

  /**
   * Deploy the full flows payload to Node-RED using PUT /flows.
   *
   * @param {object} flowsPayload - The flows payload (must include `rev` from GET /flows)
   * @param {string} [deployType='flows'] - Value for the `Node-RED-Deployment-Type` header
   * @returns {Promise<any>} Parsed JSON response
   */
  async function putFlows(flowsPayload, deployType = 'flows') {
    return request('POST', '/flows', flowsPayload, {
      'Node-RED-Deployment-Type': deployType,
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

  /**
   * Make a POST request to the Node-RED Admin API.
   * Convenience wrapper around request('POST', ...).
   *
   * @param {string} path - API path (e.g., '/inject/:nodeId')
   * @param {any} [body] - Optional request body
   * @returns {Promise<any>} Parsed JSON response
   */
  async function post(path, body) {
    return request('POST', path, body);
  }

  return { request, requestText, putFlows, post };
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
