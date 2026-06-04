/**
 * MCP Server definition.
 *
 * Creates and configures the McpServer instance with all registered tools.
 * Transport-agnostic: the caller decides how to connect it.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { handleGetFlows } from './tools/get-flows.js';
import { handleGetFlowNodes } from './tools/get-flow-nodes.js';
import { handleGetFlowDiagram } from './tools/get-flow-diagram.js';
import { handleGetConfigNodes } from './tools/get-config-nodes.js';
import { handleGetNodeDetail } from './tools/get-node-detail.js';
import { handleGetPaletteNodes } from './tools/get-palette-nodes.js';
import { handleGetNodeTypeDetail } from './tools/get-node-type-detail.js';
import { handleCreateFlow } from './tools/create-flow.js';
import { handleDeleteFlow } from './tools/delete-flow.js';
import { handleUpdateFlow } from './tools/update-flow.js';
import { handleUpdateNode } from './tools/update-node.js';
import { handleConnectNodes } from './tools/connect-nodes.js';
import { handleDisconnectNodes } from './tools/disconnect-nodes.js';
import { handleCreateNode } from './tools/create-node.js';
import { handleDeleteNode } from './tools/delete-node.js';
import { handleExportFlowJson } from './tools/export-flow.js';
import { handleImportFlow } from './tools/import-flow.js';
import { handleGetContext } from './tools/get-context.js';
import { handleDeleteContext } from './tools/delete-context.js';
import { handleSearchNodes } from './tools/search-nodes.js';
import { handleInjectMessage } from './tools/inject-message.js';
import { handleReadDebugMessages } from './tools/read-debug-messages.js';
import { handleInstallNode } from './tools/install-node.js';
import { handleUninstallNode } from './tools/uninstall-node.js';
import { loadSkills } from './skills/loader.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Create a configured MCP server with all tools registered.
 *
 * @param {ReturnType<import('./nodered/client.js').createNodeRedClient>} nodeRedClient
 * @param {import('./nodered/comms-client.js').CommsClient} [commsClient]
 * @returns {McpServer}
 */
export function createMcpServer(nodeRedClient, commsClient) {
  const server = new McpServer({
    name: 'nodered-mcp-server',
    version: '0.1.0',
  });

  // Register: get-flows
  server.tool(
    'get-flows',
    'Get a summarized list of all flows (tabs and subflows) from the Node-RED instance. ' +
    'Returns each flow\'s id, label, enabled/disabled status, node count, and the types of nodes it contains. ' +
    'Use this to understand what flows exist and what they do at a glance.',
    {},
    async () => handleGetFlows(nodeRedClient),
  );

  // Register: get-flow-nodes
  server.tool(
    'get-flow-nodes',
    'Get a detailed, paginated list of nodes within a specific Node-RED flow. ' +
    'Returns each node\'s id, type, name, disabled state, position (x/y), wires (connections), and sanitized configuration. ' +
    'Large text fields (func, template, format, html, css) are excluded to save context. ' +
    'Supports filtering by disabled state, node type, and connected subgraph (upstream/downstream from a specific node). ' +
    'Use offset/limit for pagination on large flows.',
    {
      flowId: z.string().describe('ID of the flow (tab or subflow) to inspect'),
      disabledOnly: z.boolean().optional().describe('If true, return only disabled nodes'),
      nodeType: z.string().optional().describe('Filter to nodes of this type (e.g. "function", "http in")'),
      fromNodeId: z.string().optional().describe('Filter to the connected subgraph reachable from this node ID'),
      direction: z.enum(['downstream', 'upstream', 'both']).optional().default('both')
        .describe('Traversal direction when fromNodeId is set: downstream (follow wires forward), upstream (follow wires backward), or both (full connected component). Default: both'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max nodes to return (default 50, max 200)'),
    },
    async (params) => handleGetFlowNodes(nodeRedClient, params),
  );

  // Register: get-flow-diagram
  server.tool(
    'get-flow-diagram',
    'Get a Mermaid flowchart diagram (flowchart TD) representing the topology of a Node-RED flow. ' +
    'Shows node names/types as labeled boxes connected by wires. ' +
    'Disabled nodes are styled with dashed borders. Multi-output nodes show output port labels. ' +
    'Supports the same filtering options as get-flow-nodes (disabled, type, subgraph direction) and pagination. ' +
    'Use this to visualize flow structure or share with users.',
    {
      flowId: z.string().describe('ID of the flow (tab or subflow) to diagram'),
      disabledOnly: z.boolean().optional().describe('If true, include only disabled nodes in the diagram'),
      nodeType: z.string().optional().describe('Include only nodes of this type in the diagram'),
      fromNodeId: z.string().optional().describe('Include only the connected subgraph reachable from this node ID'),
      direction: z.enum(['downstream', 'upstream', 'both']).optional().default('both')
        .describe('Traversal direction when fromNodeId is set. Default: both'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max nodes to include in diagram (default 50, max 200)'),
    },
    async (params) => handleGetFlowDiagram(nodeRedClient, params),
  );

  // Register: get-config-nodes
  server.tool(
    'get-config-nodes',
    'Get a paginated list of global configuration nodes from the Node-RED instance. ' +
    'Configuration nodes (e.g. mqtt-broker, tls-config, http-proxy) are shared resources used by flow nodes but not tied to any specific flow. ' +
    'Returns each config node\'s id, type, name, and sanitized configuration. ' +
    'Supports filtering by node type and pagination.',
    {
      nodeType: z.string().optional().describe('Filter to config nodes of this type (e.g. "mqtt-broker")'),
      offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (default 0)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max config nodes to return (default 50, max 200)'),
    },
    async (params) => handleGetConfigNodes(nodeRedClient, params),
  );

  // Register: get-node-detail
  server.tool(
    'get-node-detail',
    'Get the full detail of a single Node-RED node by its ID. ' +
    'Returns all node fields including large text fields (func, template, format, html, css) ' +
    'that are intentionally excluded from get-flow-nodes to save context. ' +
    'Use this when you need to read the actual logic or content of a specific node (e.g. a function node\'s JavaScript code or a template node\'s markup).',
    {
      nodeId: z.string().describe('ID of the node to retrieve'),
    },
    async (params) => handleGetNodeDetail(nodeRedClient, params),
  );

  // Register: get-palette-nodes
  server.tool(
    'get-palette-nodes',
    'Get a paginated list of all node types available in the Node-RED palette. ' +
    'Returns each type name, its module, version, category, and enabled state. ' +
    'Results are sorted alphabetically by type name. ' +
    'Use page and pageSize to iterate through large palettes. ' +
    'Use this to discover what node types are installed before building or auditing flows.',
    {
      page: z.number().int().min(1).optional().default(1).describe('Page number (1-based, default 1)'),
      pageSize: z.number().int().min(1).max(200).optional().default(50).describe('Items per page (default 50, max 200)'),
    },
    async (params) => handleGetPaletteNodes(nodeRedClient, params),
  );

  // Register: get-node-type-detail
  server.tool(
    'get-node-type-detail',
    'Get detailed information about a specific Node-RED node type from the palette. ' +
    'Returns the type name, module, version, category, description, enabled state, ' +
    'and a list of configurable parameters with their types and default values. ' +
    'Use this to understand what properties a node type accepts before using it in a flow.',
    {
      type: z.string().describe('The node type name to look up (e.g. "inject", "function", "http in")'),
    },
    async (params) => handleGetNodeTypeDetail(nodeRedClient, params),
  );

  // Register: create-flow
  server.tool(
    'create-flow',
    'Create a new Node-RED flow tab with the given label and optional properties. ' +
    'Returns the new flow\'s ID and the full current state as returned by Node-RED. ' +
    'Use this to add a new empty flow tab before creating nodes inside it.',
    {
      label: z.string().describe('Display label for the new flow tab'),
      disabled: z.boolean().optional().describe('Whether the flow is disabled (default false)'),
      info: z.string().optional().describe('Description or notes for the flow (default empty string)'),
      env: z.array(z.object({
        name: z.string().describe('Environment variable name'),
        value: z.string().describe('Environment variable value'),
        type: z.string().describe('Environment variable type (e.g. "str", "num", "bool")'),
      })).optional().describe('Flow-level environment variables (default empty array)'),
    },
    async (params) => handleCreateFlow(nodeRedClient, params),
  );

  // Register: delete-flow
  server.tool(
    'delete-flow',
    'Delete an existing Node-RED flow tab by ID. ' +
    'Fetches the full flow state (including all its nodes) before deletion and returns it as previousState. ' +
    'Use previousState to undo the deletion if needed. ' +
    'Refuses to delete a locked flow.',
    {
      flowId: z.string().describe('ID of the flow tab to delete'),
    },
    async (params) => handleDeleteFlow(nodeRedClient, params),
  );

  // Register: update-flow
  server.tool(
    'update-flow',
    'Update metadata fields (label, disabled, info, env) of an existing Node-RED flow tab. ' +
    'Nodes inside the flow are left unchanged. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a locked flow.',
    {
      flowId: z.string().describe('ID of the flow tab to update'),
      updates: z.object({
        label: z.string().optional().describe('New display label'),
        disabled: z.boolean().optional().describe('New enabled/disabled state'),
        info: z.string().optional().describe('New description or notes'),
        env: z.array(z.object({
          name: z.string().describe('Environment variable name'),
          value: z.string().describe('Environment variable value'),
          type: z.string().describe('Environment variable type (e.g. "str", "num", "bool")'),
        })).optional().describe('Replacement flow-level environment variables'),
      }).describe('Fields to update — at least one field is required'),
    },
    async (params) => handleUpdateFlow(nodeRedClient, params),
  );

  // Register: update-node
  server.tool(
    'update-node',
    'Shallow-merge a properties object onto an existing Node-RED node\'s configuration and deploy immediately. ' +
    'IMPORTANT: Do NOT include `wires` in properties — wiring is managed exclusively by connect-nodes and disconnect-nodes. ' +
    'To wire a node after creating it: call connect-nodes with fromNodeId and toNodeId. ' +
    'Fields in properties overwrite the matching node fields; fields not mentioned are preserved. ' +
    'Returns previousState and currentState for review or undo. ' +
    'Refuses to update a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to update'),
      properties: z.record(z.unknown()).describe('Properties to shallow-merge onto the node — must NOT include wires; use connect-nodes to add connections'),
    },
    async (params) => handleUpdateNode(nodeRedClient, params),
  );

  // Register: connect-nodes
  server.tool(
    'connect-nodes',
    'Add a wire from a node output port to a target node and deploy immediately. ' +
    'Idempotent — if the wire already exists, returns success without re-deploying. ' +
    'Pads the source node\'s wires array if the requested output port does not exist yet. ' +
    'Returns previousWires and currentWires for the source node. ' +
    'Use this after create-node to connect the new node into the flow. ' +
    'Refuses to wire nodes in a locked flow. ' +
    'BATCH MODE: Provide optional `connections` array with `{ outputPort, toNodeId }` objects to wire multiple ' +
    'output ports in a single call. When `connections` is provided, `outputPort` and `toNodeId` are ignored. ' +
    'Example batch: `connections: [{ outputPort: 0, toNodeId: "n1" }, { outputPort: 1, toNodeId: "n2" }]`.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0) — ignored when `connections` is provided'),
      toNodeId: z.string().optional().describe('ID of the target node to wire to — ignored when `connections` is provided'),
      connections: z.array(z.object({
        outputPort: z.number().int().min(0).describe('Output port index (0-based)'),
        toNodeId: z.string().describe('ID of the target node to wire to'),
      })).optional().describe('Batch mode: wire multiple output ports in one call. When provided, `outputPort` and `toNodeId` are ignored.'),
    },
    async (params) => handleConnectNodes(nodeRedClient, params),
  );

  // Register: disconnect-nodes
  server.tool(
    'disconnect-nodes',
    'Remove wires from a node output port and deploy immediately. ' +
    'Supports three modes: ' +
    '(1) SINGLE: provide `toNodeId` to remove one specific wire; ' +
    '(2) CLEAR-PORT: set `clearPort: true` (omit `toNodeId`) to clear all wires from `outputPort`; ' +
    '(3) BATCH: provide `connections` array of `{ outputPort, toNodeId }` to remove multiple wires at once. ' +
    'In single mode, returns an error if the wire does not exist. ' +
    'In clear-port mode, returns success without deploying if the port is already empty. ' +
    'In batch mode, validates all wires exist before removing any (atomic). ' +
    'Returns previousWires and currentWires for the source node. ' +
    'When `connections` is provided, `toNodeId`, `clearPort`, and `outputPort` are ignored. ' +
    'Refuses to modify nodes in a locked flow.',
    {
      fromNodeId: z.string().describe('ID of the source node'),
      outputPort: z.number().int().min(0).optional().default(0).describe('Output port index (0-based, default 0) — ignored when `connections` is provided'),
      toNodeId: z.string().optional().describe('ID of the target node whose wire to remove — omitted in clear-port mode; ignored when `connections` is provided'),
      clearPort: z.boolean().optional().default(false).describe('If true and `toNodeId` is omitted, remove ALL wires from `outputPort`. Ignored when `connections` is provided.'),
      connections: z.array(z.object({
        outputPort: z.number().int().min(0).describe('Output port index (0-based)'),
        toNodeId: z.string().describe('ID of the target node to disconnect'),
      })).optional().describe('Batch mode: remove multiple wires in one call. When provided, `outputPort`, `toNodeId`, and `clearPort` are ignored.'),
    },
    async (params) => handleDisconnectNodes(nodeRedClient, params),
  );

  // Register: create-node
  server.tool(
    'create-node',
    'Create a new node of any installed palette type inside a specified Node-RED flow and deploy immediately. ' +
    'Generates a unique ID for the node. ' +
    'Use the optional `properties` object to set type-specific configuration fields (e.g. func, url, method). ' +
    'The `id`, `z`, and `wires` fields in `properties` are silently ignored — the tool controls them. ' +
    'Returns nodeId and currentState. ' +
    'IMPORTANT — after creating a node, you MUST wire it manually using connect-nodes and disconnect-nodes. ' +
    'Creating a node does NOT connect it to anything. ' +
    'To INSERT a node between A and B: (1) create-node to get newId, (2) disconnect-nodes A→B, (3) connect-nodes A→newId, (4) connect-nodes newId→B. ' +
    'Skipping steps 2-4 will leave the new node isolated and the original flow broken. ' +
    'Refuses to create in a locked flow.',
    {
      type: z.string().describe('Palette node type to create (e.g. "function", "debug", "http in")'),
      flowId: z.string().describe('ID of the flow tab or subflow to place the node in'),
      properties: z.record(z.unknown()).optional().describe('Type-specific configuration fields to set on the new node'),
      x: z.number().optional().default(200).describe('X canvas position (default 200)'),
      y: z.number().optional().default(200).describe('Y canvas position (default 200)'),
    },
    async (params) => handleCreateNode(nodeRedClient, params),
  );

  // Register: delete-node
  server.tool(
    'delete-node',
    'Remove an existing node from a Node-RED flow by its ID and deploy immediately. ' +
    'Node-RED automatically cleans up any dangling wire references to the deleted node on deploy. ' +
    'Returns nodeId and previousState (the full node object before deletion) for review or recovery. ' +
    'Refuses to delete a node in a locked flow.',
    {
      nodeId: z.string().describe('ID of the node to delete'),
    },
    async (params) => handleDeleteNode(nodeRedClient, params),
  );

  // Register: export-flow
  server.tool(
    'export-flow',
    'Export a Node-RED flow or selection of nodes as a JSON array string that can be passed to import-flow. ' +
    'Two export modes are supported: ' +
    '"flow" (default) exports a full tab — the tab node, all its child nodes, and any referenced config nodes. ' +
    'If flowId is omitted in flow mode, all nodes in the instance are exported. ' +
    '"nodes" exports a specific selection of nodes by nodeIds, trimming wires to targets outside the selection. ' +
    'Use this to back up a flow before editing, share it with the user, or pass it to import-flow to duplicate or migrate a flow.',
    {
      exportMode: z.enum(['flow', 'nodes']).optional().default('flow')
        .describe('Export mode: "flow" (full tab + config nodes) or "nodes" (selected nodes with trimmed wires). Default: "flow"'),
      flowId: z.string().optional()
        .describe('ID of the flow tab to export (flow mode only). Omit to export all flows.'),
      nodeIds: z.array(z.string()).optional()
        .describe('IDs of nodes to export (nodes mode only). Required when exportMode is "nodes".'),
    },
    async (params) => handleExportFlowJson(nodeRedClient, params),
  );

  // Register: import-flow
  server.tool(
    'import-flow',
    'Import a Node-RED flow JSON into the running instance and redeploy all flows. ' +
    'Accepts a JSON array string (Node-RED export format) or a JSON object with a `nodes` array. ' +
    'WARNING: All flows are redeployed on import, which briefly interrupts any running flows. ' +
    'Two conflict strategies are supported: ' +
    '"regenerate" (default) remaps all node IDs to new UUIDs — always safe, creates a duplicate. ' +
    '"overwrite" replaces existing nodes whose IDs match the imported JSON — use to apply an updated version of a flow. ' +
    'Optional `targetFlowId`: when provided, all non-tab nodes are injected into that existing flow tab ' +
    '(tab nodes in the JSON are discarded and their children are remapped to the target). ' +
    'Returns a summary: `{ imported: { flows, nodes, configNodes }, conflicts, strategy, targetFlowId }`. ' +
    'Use export-flow to obtain the flowJson string from this or another Node-RED instance.',
    {
      flowJson: z.string().describe('Node-RED flow JSON to import — a JSON array string or a JSON object string with a "nodes" array'),
      conflictStrategy: z.enum(['regenerate', 'overwrite']).optional().default('regenerate')
        .describe('How to handle ID collisions: "regenerate" (default) remaps all IDs to new UUIDs; "overwrite" replaces existing nodes by ID'),
      targetFlowId: z.string().optional()
        .describe('If provided, import all non-tab nodes into this existing flow tab (its ID must exist and must not be locked)'),
    },
    async (params) => handleImportFlow(nodeRedClient, params),
  );

  // Register: get-context
  server.tool(
    'get-context',
    'Read a context variable from a Node-RED node, flow, or global context scope. ' +
    'Single-key mode (key provided): returns { "<key>": <value> } — e.g. { "counter": 42 }. ' +
    'All-keys mode (no key): returns a JSON object with all key-value pairs — e.g. { "counter": 42, "config": {} }. ' +
    'Use scope="global" to access global context (no id needed). ' +
    'Use scope="flow" with a flowId to access flow-scoped context. ' +
    'Use scope="node" with a nodeId to access node-scoped context. ' +
    'If the key does not exist, value is returned as null (not an error). ' +
    'WARNING: In-memory context values are lost when Node-RED restarts.',
    {
      scope: z.enum(['node', 'flow', 'global']).describe('Context scope to read from'),
      id: z.string().optional().describe('Node or flow UUID — required when scope is "node" or "flow"'),
      key: z.string().optional().describe('Context key to read; omit to return all keys in the scope'),
    },
    async (params) => handleGetContext(nodeRedClient, params),
  );

  // Register: delete-context
  server.tool(
    'delete-context',
    'Delete a context variable from a Node-RED node, flow, or global context scope. ' +
    'Use scope="global" to delete from global context (no id needed). ' +
    'Use scope="flow" with a flowId to delete from flow-scoped context. ' +
    'Use scope="node" with a nodeId to delete from node-scoped context. ' +
    'Returns { scope, id?, key, deleted: true } on success. ' +
    'Note: The Node-RED Admin API does not support writing context values directly — ' +
    'use a function node with flow.set() / global.set() if you need to write context.',
    {
      scope: z.enum(['node', 'flow', 'global']).describe('Context scope to delete from'),
      id: z.string().optional().describe('Node or flow UUID — required when scope is "node" or "flow"'),
      key: z.string().describe('Context key to delete'),
    },
    async (params) => handleDeleteContext(nodeRedClient, params),
  );

  // Register: search-nodes
  server.tool(
    'search-nodes',
    'Deep-search all regular nodes across all flows (or a single flow via flowId) with a single query string. ' +
    'Serializes each node with JSON.stringify and matches the query against the resulting string. ' +
    'Plain text mode (default, regex: false) is case-insensitive substring matching. ' +
    'Regex mode (regex: true) treats the query as a JavaScript regex pattern. ' +
    'Each result includes flowId, flowLabel, nodeId, type, name, x, and y. ' +
    'Use this to find nodes by name, type, property value, function body content, or any other field.',
    {
      query: z.string().describe('The search term — plain text (case-insensitive substring) or regex pattern when regex: true'),
      regex: z.boolean().optional().default(false).describe('If true, treat query as a JavaScript regex pattern (default false — plain text search)'),
      flowId: z.string().optional().describe('Limit search to nodes in a specific flow tab or subflow (omit to search all flows)'),
      limit: z.number().int().min(1).optional().default(50).describe('Max results to return (default 50)'),
    },
    async (params) => handleSearchNodes(nodeRedClient, params),
  );

  // Register: inject-message
  server.tool(
    'inject-message',
    'Trigger an inject node in the running Node-RED instance by node ID or by name (optionally scoped to a flow). ' +
    'The target node MUST be an inject node. ' +
    'Use `read-debug-messages` to observe the results of the injected message. ' +
    'If multiple inject nodes share the same name, an error is returned listing the matching IDs — use nodeId to disambiguate.',
    {
      nodeId: z.string().optional().describe('Node UUID of the inject node to trigger (alternative to name)'),
      name: z.string().optional().describe('Name of the inject node to trigger (alternative to nodeId)'),
      flowId: z.string().optional().describe('Flow ID to scope the name search (optional, ignored when nodeId is provided)'),
    },
    async (params) => handleInjectMessage(nodeRedClient)(params),
  );

  // Register: install-node
  server.tool(
    'install-node',
    'Install a new Node-RED node module from the npm registry via the Admin API\'s POST /nodes endpoint. ' +
    'Accepts a plain npm package name (no @version qualifiers — the API does not support them via JSON body). ' +
    'Intended workflow: the LLM discovers a suitable package from the Node-RED library catalog (https://flows.nodered.org/search?type=node), ' +
    'the user selects one, and this tool installs it. ' +
    'Returns the Node Module object with name, version, and the list of installed node types. ' +
    'Note: installation may take 10-30+ seconds for large packages. Some nodes may require a Node-RED restart for full activation.',
    {
      module: z.string().describe('npm package name to install (plain name, no @version), e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleInstallNode(nodeRedClient, params),
  );

  // Register: uninstall-node
  server.tool(
    'uninstall-node',
    'Uninstall a Node-RED node module from the running instance via the Admin API\'s DELETE /nodes/:module endpoint. ' +
    'The `module` parameter is the module identifier as shown in get-palette-nodes (e.g., "node-red-node-suncalc"). ' +
    'Use get-palette-nodes to discover installed modules. ' +
    'WARNING: Uninstalling a module removes its node types from ALL flows. Nodes of those types will be lost. ' +
    'If unsure, export your flows with export-flow before uninstalling. ' +
    'Returns { uninstalled: true, module } on success.',
    {
      module: z.string().describe('Module identifier to uninstall, as shown in get-palette-nodes, e.g. "node-red-node-suncalc"'),
    },
    async (params) => handleUninstallNode(nodeRedClient, params),
  );

  // Register: read-debug-messages
  if (commsClient) {
    server.tool(
      'read-debug-messages',
      'Read buffered debug messages from the connected Node-RED instance. ' +
      'Messages are captured in real time from the /comms WebSocket and stored in an in-memory ring buffer. ' +
      'Use this to observe the output of debug nodes after triggering a flow with inject-message. ' +
      'All filter parameters are optional — combine them to narrow results. ' +
      'The `last` and `limit` parameters are mutually exclusive.',
      {
        nodeId: z.string().optional().describe('Filter: exact match on debug node ID'),
        nodeName: z.string().optional().describe('Filter: case-insensitive substring match on debug node name'),
        keyword: z.string().optional().describe('Filter: case-insensitive substring match in the stringified message payload'),
        after: z.number().optional().describe('Filter: inclusive lower bound timestamp (Unix ms) — only messages with timestamp >= after'),
        before: z.number().optional().describe('Filter: inclusive upper bound timestamp (Unix ms) — only messages with timestamp <= before'),
        last: z.number().int().min(1).optional().describe('Return the last N matching messages (tail mode). Mutually exclusive with limit.'),
        limit: z.number().int().min(1).optional().describe('Return the first N matching messages (default 50). Mutually exclusive with last.'),
      },
      async (params) => handleReadDebugMessages(commsClient)(params),
    );
  }

  // ── Skills integration ──────────────────────────────────────────────

  // Resolve project root (src/server.js → src/ → project root)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '..');
  const allSkills = loadSkills(projectRoot);

  // Only expose Node-RED skills — filter out openspec, workflows, etc.
  const skills = new Map(
    [...allSkills].filter(([name]) => name.startsWith('nodered-'))
  );

  // Register MCP Prompts — one per skill
  for (const [skillName, skill] of skills) {
    server.prompt(
      skillName,
      skill.description,
      {},
      async () => ({
        messages: [{
          role: 'user',
          content: { type: 'text', text: skill.content },
        }],
      }),
    );
  }

  // Register MCP Resources — one per skill
  for (const [skillName, skill] of skills) {
    server.resource(
      skillName,
      `nodered://skills/${skillName}`,
      { description: skill.description, mimeType: 'text/markdown' },
      async () => ({
        contents: [{
          uri: `nodered://skills/${skillName}`,
          text: skill.content,
          mimeType: 'text/markdown',
        }],
      }),
    );
  }

  // Register: get-skill tool
  server.tool(
    'get-skill',
    'MUST call this BEFORE building any Node-RED flows. ' +
    'Use this tool to retrieve domain-specific guidance, best practices, patterns, ' +
    'and reference material for building Node-RED flows. ' +
    'Call it with a skill name (e.g. "nodered-flow-builder") to get the full skill content.',
    {
      topic: z.string().describe('The skill topic/name to retrieve (e.g. "nodered-flow-builder", "nodered-node-reference")'),
    },
    async (params) => {
      const skill = skills.get(params.topic);
      if (!skill) {
        const available = [...skills.keys()].join(', ');
        return {
          content: [{
            type: 'text',
            text: `Skill "${params.topic}" not found. Available skills: ${available || '(none)'}`,
          }],
        };
      }
      return {
        content: [{
          type: 'text',
          text: skill.content,
        }],
      };
    },
  );

  return server;
}
