/**
 * In-Memory Staging Store for Node-RED MCP Server.
 *
 * Holds a mutable copy of the Node-RED flows, enabling write tools to stage
 * changes locally and deploy explicitly. Mirrors the Node-RED editor's
 * "workspace + explicit deploy" model.
 *
 * Key features:
 * - Lazy-loads flows from Node-RED on first access
 * - Tracks dirty nodes and flows for granular deploys
 * - Provides deploy with three modes: full, flows, nodes
 * - Supports invalidation and summary for LLM context
 */

export class StagingStore {
  /** @type {ReturnType<import('./nodered/client.js').createNodeRedClient>} */
  #client;

  /** @type {object[]} */
  #flows = [];

  /** @type {string|null} */
  #rev = null;

  /** @type {Set<string>} */
  #dirtyNodeIds = new Set();

  /** @type {Set<string>} */
  #dirtyFlowIds = new Set();

  /** @type {boolean} */
  #isLoaded = false;

  /**
   * @param {ReturnType<import('./nodered/client.js').createNodeRedClient>} client
   */
  constructor(client) {
    this.#client = client;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Ensure flows are loaded from Node-RED (lazy-load on first access).
   * Idempotent — no-op if already loaded.
   *
   * @returns {Promise<void>}
   */
  async ensureLoaded() {
    if (this.#isLoaded) return;

    const rawResponse = await this.#client.request('GET', '/flows');
    this.#rev = rawResponse?.rev ?? null;
    this.#flows = rawResponse?.flows ?? [];
    this.#isLoaded = true;
  }

  /**
   * Return the current staged flows array.
   * Triggers lazy-load if not yet loaded.
   *
   * @returns {Promise<object[]>} The staged flows array
   */
  async getFlows() {
    await this.ensureLoaded();
    return this.#flows;
  }

  /**
   * Apply a pure mutation function to the staged flows and track dirty state.
   *
   * The mutation function receives a `{ flows }` wrapper (matching the shape
   * of `rawResponse` from GET /flows) and must return an object containing at
   * least `updatedFlows`. Extra properties are passed through to the caller.
   *
   * After applying the mutation, dirty tracking auto-detects added, removed,
   * and modified nodes by comparing before/after snapshots.
   *
   * @template T
   * @param {(rawResponse: { flows: object[] }) => { updatedFlows: object[], [key: string]: any }} fn - Pure mutation function
   * @returns {Promise<T>} The result from fn, excluding `updatedFlows`
   */
  async applyMutation(fn) {
    await this.ensureLoaded();

    // Snapshot before mutation: id -> node
    const beforeMap = new Map();
    for (const node of this.#flows) {
      beforeMap.set(node.id, node);
    }

    // Apply mutation — fn receives { flows } like the old rawResponse
    const result = fn({ flows: this.#flows });
    const { updatedFlows, ...output } = result;

    // Snapshot after mutation
    const afterMap = new Map();
    for (const node of updatedFlows) {
      afterMap.set(node.id, node);
    }

    // Track dirty: added or modified nodes
    for (const [id, node] of afterMap) {
      const before = beforeMap.get(id);
      if (!before || JSON.stringify(before) !== JSON.stringify(node)) {
        this.#dirtyNodeIds.add(id);
        if (node.z) this.#dirtyFlowIds.add(node.z);
        // Flow tab creation/modification also dirties the flow itself
        if (node.type === 'tab' || node.type === 'subflow') {
          this.#dirtyFlowIds.add(node.id);
        }
      }
    }

    // Track dirty: removed nodes
    for (const [id, node] of beforeMap) {
      if (!afterMap.has(id)) {
        this.#dirtyNodeIds.add(id);
        if (node.z) this.#dirtyFlowIds.add(node.z);
        if (node.type === 'tab' || node.type === 'subflow') {
          this.#dirtyFlowIds.add(node.id);
        }
      }
    }

    // Update internal state
    this.#flows = updatedFlows;

    return output;
  }

  /**
   * Deploy the staged flows to Node-RED.
   *
   * Sends the full flows array via POST /flows with the specified deploy type.
   * On success, re-fetches flows from Node-RED to sync rev and state, then
   * clears dirty tracking. On 409 version_mismatch, throws without retrying.
   *
   * @param {string} [deployType='nodes'] - Node-RED-Deployment-Type header value: 'full', 'flows', or 'nodes'
   * @returns {Promise<void>}
   * @throws {Error} On deploy failure including version_mismatch (409)
   */
  async deploy(deployType = 'nodes') {
    await this.ensureLoaded();

    const flowsPayload = { rev: this.#rev, flows: this.#flows };

    await this.#client.putFlows(flowsPayload, deployType);

    // Re-fetch to sync rev and state
    await this.invalidate();
    await this.ensureLoaded();

    // Clear dirty tracking — post-deploy everything is clean
    this.#dirtyNodeIds.clear();
    this.#dirtyFlowIds.clear();
  }

  /**
   * Check whether there are pending (undeployed) changes.
   *
   * @returns {boolean} True if either dirty set is non-empty
   */
  hasPendingChanges() {
    return this.#dirtyNodeIds.size > 0 || this.#dirtyFlowIds.size > 0;
  }

  /**
   * Return a staging summary object for inclusion in tool responses.
   *
   * @returns {{ pendingChanges: number, dirtyNodeIds: string[], dirtyFlowIds: string[], deployed: boolean }}
   */
  getStagingSummary() {
    return {
      pendingChanges: this.#dirtyNodeIds.size,
      dirtyNodeIds: [...this.#dirtyNodeIds],
      dirtyFlowIds: [...this.#dirtyFlowIds],
      deployed: !this.hasPendingChanges(),
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Invalidate the staging cache. Next getFlows() or applyMutation() call
   * will re-fetch from Node-RED. Also clears dirty tracking.
   *
   * @returns {Promise<void>}
   */
  async invalidate() {
    this.#flows = [];
    this.#rev = null;
    this.#isLoaded = false;
    this.#dirtyNodeIds.clear();
    this.#dirtyFlowIds.clear();
  }
}
