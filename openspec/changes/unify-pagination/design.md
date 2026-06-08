# Design: unify-pagination

## Overview

A simple rename of two parameters in one tool to match the existing convention used by 3 other tools.

## Before

```js
// src/server.js — get-palette-nodes input schema
{
  page: z.number().int().min(1).optional().default(1).describe('Page number (1-based, default 1)'),
  pageSize: z.number().int().min(1).max(200).optional().default(50).describe('Items per page (default 50, max 200)'),
}
```

## After

```js
// src/server.js — get-palette-nodes input schema
{
  offset: z.number().int().min(0).optional().default(0).describe('Pagination offset (0-based, default 0)'),
  limit: z.number().int().min(1).max(200).optional().default(50).describe('Max items to return (default 50, max 200)'),
}
```

## Handler change

The handler currently computes pagination from `page`/`pageSize`:

```js
const start = (page - 1) * pageSize;
const end = start + pageSize;
```

After the change, it uses `offset`/`limit` directly:

```js
const start = offset;
const end = offset + limit;
```

## Tool description update

The parameter descriptions in the tool registration string change from "page/pageSize" terminology to "offset/limit" terminology, matching the other paginated tools.

## Test changes

- `tests/tools/get-palette-nodes.test.js` — update test cases to use `offset`/`limit` instead of `page`/`pageSize`
- Verify that `offset=0, limit=50` produces the same result as `page=1, pageSize=50`

## Files affected

- `src/server.js` — input schema + tool description (get-palette-nodes section)
- `src/tools/get-palette-nodes.js` — handler logic
- `tests/tools/get-palette-nodes.test.js` — test cases

## Risk

**Breaking change**: Any client currently calling `get-palette-nodes` with `page`/`pageSize` will receive Zod validation errors. Mitigation: this is a clear error message from Zod, and the fix is trivial for clients. Since this is a development MCP server (not a public API with external consumers), breaking changes are acceptable.
