# Design: refactor-tool-architecture

## Overview

Two complementary refactors applied together:

1. **Extract tool definitions** — Each tool module exports its registration metadata alongside the handler
2. **Centralize response formatting** — Shared helpers for consistent success/error responses

## Pattern: Tool definition export

Each tool module (e.g., `src/tools/get-flows.js`) exports a `definition` object:

```js
// src/tools/get-flows.js
import { z } from 'zod';

export const getFlowsDefinition = {
  name: 'get-flows',
  description: 'Get a summarized list of all flow tabs...',
  inputSchema: {},  // Zod raw shape (empty object for no-param tools)
  handler: handleGetFlows,  // The async handler function
};
```

For tools with parameters:

```js
// src/tools/create-node.js
export const createNodeDefinition = {
  name: 'create-node',
  description: 'Create a new node...',
  inputSchema: {
    type: z.string().describe('Palette node type...'),
    flowId: z.string().describe('ID of the flow tab...'),
    properties: z.record(z.unknown()).optional().describe('...'),
    x: z.number().optional().default(300).describe('...'),
    y: z.number().optional().default(200).describe('...'),
  },
  handler: handleCreateNode,
};
```

## Server.js becomes a registry

```js
// src/server.js
import { getFlowsDefinition } from './tools/get-flows.js';
import { createNodeDefinition } from './tools/create-node.js';
// ... etc

const toolDefinitions = [
  getFlowsDefinition,
  createNodeDefinition,
  // ... all 38 tools
];

for (const def of toolDefinitions) {
  server.tool(def.name, def.description, def.inputSchema, async (params) => {
    return def.handler(staging, nodeRedClient, params);
  });
}
```

## Response formatting helpers

### `src/tools/response-utils.js`

```js
/**
 * Format a successful tool response with both text and structured content.
 */
export function formatSuccess(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error message as a tool response (non-throwing).
 */
export function formatError(message, details) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, ...(details && { details }) }, null, 2) }],
    isError: true,
  };
}
```

### Usage in handlers

```js
// Before:
return {
  content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
};

// After:
return formatSuccess(result);
```

## Staging message DRY

The repeated staging warning can be centralized into a constant:

```js
// src/tools/constants.js
export const STAGING_WARNING = '⚠️ STAGING: Changes are NOT live until you call `deploy`. Check the `staging` field in the response.';
```

Tool descriptions reference it via template literal:
```js
description: `Create a new flow tab... ${STAGING_WARNING}`,
```

## Files affected

- **`src/tools/response-utils.js`** (new) — formatSuccess, formatError
- **`src/tools/constants.js`** (new) — shared description strings
- **`src/tools/*.js`** (~38 files) — Add `definition` export, use formatSuccess
- **`src/server.js`** — Replace inline registrations with loop over definitions
- **`tests/tools/*.test.js`** — Update imports if needed

## Migration strategy

This is a pure refactor with zero behavioral changes. All existing vitest tests must pass without modification. The refactor order:
1. Create `response-utils.js` and `constants.js`
2. Update handlers one by one to use `formatSuccess`
3. Add `definition` exports to each tool module
4. Rewrite `server.js` to use the registry pattern
5. Remove old inline code from `server.js`
