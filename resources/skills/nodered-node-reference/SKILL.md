---
name: nodered-node-reference
description: >-
  Categorized reference of Node-RED built-in core node types, key properties,
  and a deep-dive into the function node's APIs, return semantics, and async patterns.
tools:
  - create-node
  - update-node
  - get-node-detail
  - get-node-type-detail
  - get-palette-nodes
---

# Node-RED Node Reference

Categorized catalog of built-in core node types with key properties for `create-node` / `update-node`, plus a deep-dive into the **function node**.

**How to use this reference:**
- Look up a node type by category to find its `type` string and required/optional `properties`.
- For node types NOT listed here (third-party, custom), use `get-node-type-detail` to retrieve the full parameter schema before calling `create-node`.
- JSON example files in `examples/` show working node configurations you can import with `import-flow`.

**⚠️ CREDENTIAL PRIVACY — read before working with config nodes:**
- **Credential values (passwords, API keys) are NEVER exposed** by the API. `get-flow-nodes` and `get-config-nodes` will NOT include credential fields at all.
- **A missing `credentials` field does NOT mean no credentials are set** — it means they are hidden for security. This is by design.
- **To check what credential fields exist on a config node**: Use `get-node-detail`. It returns a `_credentials` object like `{ user: "test67", has_password: true }` — showing field names and whether password-type fields are set. Password VALUES are never shown, only their presence/absence.
- **To set/update credentials on config nodes** (like `mqtt-broker`, `http-proxy`, `tls-config`), place them inside a `credentials` object: `create-node`/`update-node` with `properties: { credentials: { user: "u", password: "p" } }`. The tools auto-detect and nest credential fields correctly.
- **Partial updates work**: send only the credential fields you want to change — e.g., `credentials: { password: "newpass" }` changes only the password, leaving `user` unchanged.

---

## Common Node Properties

All node types share these universal fields. Use `update-node` to modify them and `get-node-detail` to read them.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display label shown on the node in the editor |
| `info` | string | **Description** field in the Node-RED editor UI. Rich text describing what the node does. When a user says "add a description to this node" or "describe what this node does", they mean setting `info`. Read with `get-node-detail`, set with `update-node` or `create-node` via `properties: { info: "my description" }`. |

Most node types also have type-specific properties documented in the sections below.

---

## Common Nodes

### inject
`type: "inject"` — Manually or periodically triggers a message into a flow.

> **⚠️ CRITICAL — ALL fields below are mandatory in `create-node`.**
> Omitting any of these fields causes **red triangle errors** in the Node-RED editor.
> Even fields with empty defaults (`""`, `false`, `[]`) MUST be explicitly set.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | `""` | Label on the node |
| `payload` | string | `""` | Value to inject (string, number, JSON, timestamp, etc.) |
| `payloadType` | string | `"str"` | `"str"`, `"num"`, `"json"`, `"bool"`, `"date"`, `"null"`, `"flow"`, `"global"` |
| `topic` | string | `""` | msg.topic value |
| `repeat` | string | `""` | Cron or interval string (empty = manual only) |
| `once` | boolean | `false` | Inject once on start (only with repeat) |
| `onceDelay` | string | `""` | Delay in seconds before first inject |
| `crontab` | string | `""` | Cron expression (alternative to repeat interval) |
| `props` | array | `[{p:"payload"},{p:"topic",vt:"str"}]` | Property schema for the inject dialog. Must be present. |

### Full Node Configuration Examples

These are the `properties` objects you pass to `create-node` or `update-node`. Extracted from real Node-RED nodes.

**Minimal example — manual trigger with string payload, all required defaults:**

```json
{
  "type": "inject",
  "name": "",
  "payload": "",
  "payloadType": "str",
  "topic": "",
  "repeat": "",
  "once": false,
  "onceDelay": "",
  "crontab": "",
  "props": [
    { "p": "payload" },
    { "p": "topic", "vt": "str" }
  ]
}
```

> **⚠️ Note:** The 6 fields after `payloadType` (`topic`, `repeat`, `once`, `onceDelay`, `crontab`, `props`) are NOT optional. Every one of them must be present, even with empty defaults. Omitting any causes a red triangle error in the editor.

**Full example — JSON payload, scheduled every 5 minutes, with docs:**

```json
{
  "type": "inject",
  "name": "Sensor trigger",
  "payload": "{\"sensor\":\"temp\",\"value\":22.5}",
  "payloadType": "json",
  "topic": "sensors/temperature",
  "repeat": "300",
  "once": true,
  "onceDelay": "0.5",
  "crontab": "",
  "props": [
    { "p": "payload" },
    { "p": "topic", "vt": "str" },
    { "p": "payloadType" },
    { "p": "repeat" },
    { "p": "crontab" },
    { "p": "once" },
    { "p": "onceDelay" }
  ],
  "info": "Injects a temperature reading every 5 minutes. Fires once on deploy after 0.5s delay."
}
```

**What each field does in this example:**

| Field | Value | Effect |
|-------|-------|--------|
| `payload` | `'{"sensor":"temp",...}'` | JSON object string sent on each inject |
| `payloadType` | `"json"` | Node-RED parses payload into a JS object before sending |
| `repeat` | `"300"` | Triggers every 300 seconds (5 min) |
| `once` | `true` | Triggers once on deploy, then starts the repeat cycle |
| `onceDelay` | `"0.5"` | First inject fires 0.5 seconds after deploy |
| `props` | (array of 7 objects) | Defines the fields shown in the inject dialog in the editor |

> **`props` explained:** Each `{ p: "fieldname" }` entry adds a row to the inject node's edit dialog. The entry `{ p: "topic", vt: "str" }` sets the value type selector for that field. For `create-node`, you only need the minimum set `[{p:"payload"},{p:"topic",vt:"str"}]` — the Node-RED editor may expand it on save.

### debug
`type: "debug"` — Outputs messages to the debug sidebar (readable via `read-debug-messages`).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `active` | boolean | Enable/disable debug output |
| `complete` | string | `"false"` = full message object (default). Or a property path like `"payload"` to show only that property. |
| `tosidebar` | boolean | Also send to debug sidebar |
| `console` | boolean | Also log to Node-RED console |
| `tostatus` | boolean | Also show on node status (under the node) |
| `statusVal` | string | Property to show in status (when `tostatus` is true) |
| `statusType` | string | Status type: `"auto"` (auto-detect type), `"msg"` (message property) |

> **Note:** `complete: "false"` (the string `"false"`, not boolean `false`) means "show full message object". Set it to `"payload"` or any other property path to show only that property.

### complete
`type: "complete"` — Triggers when another node completes (error-free). Used for sequential flows.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `scope` | array | Array of node IDs to watch (empty = all on tab) |

### catch
`type: "catch"` — Catches errors thrown by nodes on the same tab.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `scope` | array | Array of node IDs to catch errors from (empty = all on tab) |
| `uncaught` | boolean | If true, only catch errors not handled by other catch nodes |

### status
`type: "status"` — Triggers when a node's status changes (e.g., connected/disconnected).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `scope` | array | Array of node IDs to watch (empty = all on tab) |

### link in / link out / link call
`type: "link in"` / `type: "link out"` / `type: "link call"` — Cross-tab message passing.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `links` | array | Link group names (all link nodes with matching name connect) |
| `linkType` | string | For link call: determines response behavior |

### comment
`type: "comment"` — Text annotation on the canvas. Not a functional node.

**⚠️ CRITICAL — `name` vs `info`:**
- **`name`** = **short LABEL** visible on the canvas (1-3 words max, e.g. `"🧪 Demo MCP"`). NEVER put multi-line explanations here — it renders poorly in the editor.
- **`info`** = **detailed DESCRIPTION** (tooltip on hover). Put pipeline documentation, notes, and full explanations here. This is the correct field for long-form content. Supports html or markdown formatting.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Short label shown on canvas. Keep it concise (1-3 words). |
| `info` | string | Detailed description (tooltip). Use for documentation and explanations. |

---

## Logic & Transform Nodes

### switch
`type: "switch"` — Routes messages to different outputs based on rules.

**⚠️ CRITICAL — Mandatory fields for correct rendering:**
- **`outputs`** (number): MUST be set and MUST equal the number of rules. If omitted, the Node-RED editor defaults to 1 visible output port, hiding any wires connected to ports 2+. This causes the node to appear disconnected from downstream nodes even though `wires` contains the connections. Set `outputs` to `rules.length`.
- **`repair`** (boolean): Should be explicitly set to `false` (or `true` to forward unmatched messages to a catch node). Omitting this field can cause rendering inconsistencies.
- **`checkall`** (string, NOT boolean): Node-RED expects `"true"` or `"false"` as strings. Despite being conceptually boolean, the value must be a JSON string.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `property` | string | Property to test (e.g., `"payload"`, `"topic"`) |
| `propertyType` | string | How to interpret property: `"msg"`, `"flow"`, `"global"`, `"env"` |
| `rules` | array | Array of `{ t: <operator>, v: <value>, vt: <valueType> }`. Each rule maps to output port `index`. See operator reference below. |
| `checkall` | string | `"true"` = evaluate all rules (multiple outputs possible); `"false"` = stop at first match (single output). **Must be string, not boolean.** |
| `outputs` | number | **REQUIRED.** Number of output ports. Must match `rules.length`. Without this, the editor shows only 1 port. |
| `repair` | boolean | **REQUIRED.** Send unmatched messages to a catch node. Default `false`. Set explicitly. |

**Switch rule operators (`t` field):**

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal to | `{ t: "eq", v: "hello", vt: "str" }` |
| `neq` | Not equal to | `{ t: "neq", v: "0", vt: "num" }` |
| `lt` | Less than | `{ t: "lt", v: "15", vt: "num" }` |
| `lte` | Less than or equal | `{ t: "lte", v: "100", vt: "num" }` |
| `gt` | Greater than | `{ t: "gt", v: "0", vt: "num" }` |
| `gte` | Greater than or equal | `{ t: "gte", v: "30", vt: "num" }` |
| `btwn` | Between (inclusive) | `{ t: "btwn", v: "10", vt: "num", v2: "20", vt2: "num" }` |
| `cont` | Contains substring | `{ t: "cont", v: "error", vt: "str" }` |
| `regex` | Matches regex | `{ t: "regex", v: "^\\d{3}$", vt: "str" }` |
| `true` | Boolean true | `{ t: "true" }` |
| `false` | Boolean false | `{ t: "false" }` |
| `null` | Is null | `{ t: "null" }` |
| `nnull` | Is not null | `{ t: "nnull" }` |
| `istype` | Is type | `{ t: "istype", v: "string" }` (types: "string", "number", "boolean", "object", "array", "buffer", "null", "undefined") |
| `empty` | Is empty | `{ t: "empty" }` |
| `nempty` | Is not empty | `{ t: "nempty" }` |
| `hask` | Has key | `{ t: "hask", v: "temperature", vt: "str" }` |
| `jsonata_exp` | JSONata expression | `{ t: "jsonata_exp", v: "payload.temp > 30", vt: "str" }` |
| `otherwise` | Catch-all (always matches) | `{ t: "otherwise" }` — **Use with caution: may not work in all Node-RED versions.** Prefer explicit `{ t: "lt", v: "15", vt: "num" }` over `otherwise` for the last rule. |

**⚠️ `otherwise` operator caveat:** The `otherwise` operator may throw `"operators[rule.t] is not a function"` in certain Node-RED versions. When in doubt, replace `{ t: "otherwise" }` with an explicit inverse rule (e.g., if previous rules check `gte 30` and `gte 15`, the last rule should be `lt 15`).

**Best practices for `switch` node:**
- Always set `outputs` to `rules.length`.
- Always set `repair` explicitly (usually `false`).
- With `checkall: "false"`, rules are evaluated top-to-bottom and the first match wins. Ensure rules are ordered from most specific to least specific.
- For numeric ranges, use `lte`/`gte`/`lt`/`gt` operators in descending or ascending order, ensuring no overlaps when `checkall: "false"`.
- For `btwn` (between), provide both `v`/`vt` (lower bound) and `v2`/`vt2` (upper bound).

### Full Node Configuration Examples

These are the `properties` objects you pass to `create-node` or `update-node`. Extracted from real Node-RED nodes.

**Minimal example — single rule, single output:**

```json
{
  "type": "switch",
  "name": "",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    { "t": "eq", "v": "pass", "vt": "str" }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1
}
```

**Full example — 6 rules, all outputs labeled and wired:**

```json
{
  "type": "switch",
  "name": "Switch example",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    { "t": "eq", "v": "pass", "vt": "str" },
    { "t": "eq", "v": "fail", "vt": "str" },
    { "t": "gt", "v": "1", "vt": "str" },
    { "t": "lt", "v": "-1", "vt": "str" },
    { "t": "null" },
    { "t": "cont", "v": "text", "vt": "str" }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 6,
  "outputLabels": ["pass", "fail", "gt 1", "lt -1", "null", "cont text"],
  "info": "Doc"
}
```

**What each rule does in this example (with `checkall: "false"` — first match wins):**

| Output | Rule | Matches when |
|--------|------|-------------|
| 0 | `eq "pass"` | `msg.payload === "pass"` |
| 1 | `eq "fail"` | `msg.payload === "fail"` |
| 2 | `gt 1` | `msg.payload > 1` (string-compared, use `vt: "num"` for numeric) |
| 3 | `lt -1` | `msg.payload < -1` |
| 4 | `null` | `msg.payload` is `null` or `undefined` |
| 5 | `cont "text"` | `msg.payload` contains substring `"text"` |

> **⚠️ vt types matter:** The examples use `vt: "str"` for string comparison. For numeric comparisons, use `vt: "num"`. The operator `null` has no `v`/`vt` fields — just `{ "t": "null" }`.

### change
`type: "change"` — Set, change, delete, or move message properties.

**⚠️ Legacy fields — still REQUIRED by `create-node`:** `action`, `property`, `from`, `to`, and `reg` appear in Node-RED API responses. Although the editor ignores them for runtime behavior, they are **mandatory for `create-node`** — the Node-RED editor will show a red triangle on the node if ANY of these fields are absent. Set them to their default values:

| Legacy field | Required default value |
|-------------|----------------------|
| `action` | `""` (empty string) |
| `property` | `""` (empty string) |
| `from` | `""` (empty string) |
| `to` | `""` (empty string) |
| `reg` | `false` |

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `rules` | array | Array of rule objects. Each rule has its own fields depending on `t` (type). See table below. |
| `info` | string | **Description** field in the Node-RED editor UI. Optional. |

**Rule types and their fields:**

| `t` (type) | Required fields | Optional fields | Description |
|-------------|----------------|-----------------|-------------|
| `"set"` | `p`, `pt`, `to`, `tot` | — | Set a property to a value |
| `"change"` | `p`, `pt`, `from`, `fromt`, `to`, `tot` | — | Search and replace within a string property. Set `fromt: "re"` to treat `from` as a regex pattern. |
| `"delete"` | `p`, `pt` | — | Delete a property from the message |
| `"move"` | `p`, `pt`, `to`, `tot` | — | Move (rename) a property |

**Common rule fields:**

| Field | Type | Description |
|-------|------|-------------|
| `t` | string | Rule type: `"set"`, `"change"`, `"delete"`, or `"move"` |
| `p` | string | Target property name (e.g., `"payload"`, `"topic"`, `"headers.x-auth"`) |
| `pt` | string | Property scope: `"msg"`, `"flow"`, `"global"`, `"env"` |
| `to` | string | Value to set/move to (for `set` and `move`) |
| `tot` | string | Value type of `to`: `"str"`, `"num"`, `"json"`, `"bool"`, `"template"`, `"jsonata"` |
| `from` | string | Search string (for `change` — replaces occurrences of this) |
| `fromt` | string | Type of `from`: `"str"`, `"num"`, `"re"` (regex pattern) |
| `reg` | boolean | **⚠️ DEPRECATED — do NOT use.** The top-level `reg` field is a legacy leftover. Regex search/replace is controlled by `fromt: "re"` on the individual rule. |

### Full Node Configuration Examples

These are the `properties` objects you pass to `create-node` or `update-node`. Extracted from real Node-RED nodes.

**Minimal example — set payload to a string:**

```json
{
  "type": "change",
  "name": "",
  "rules": [
    { "t": "set", "p": "payload", "pt": "msg", "to": "123", "tot": "str" }
  ]
}
```

> **Note:** `name` can be `""` (empty string). The legacy fields (`action`, `property`, `from`, `to`, `reg`) are shown by the API but can be omitted in `create-node`.

**Full example — set, change, delete, regex change, with documentation:**

```json
{
  "type": "change",
  "name": "Change example",
  "rules": [
    { "t": "set", "p": "payload", "pt": "msg", "to": "123", "tot": "str" },
    { "t": "change", "p": "payload", "pt": "msg", "from": "45", "fromt": "str", "to": "54", "tot": "str" },
    { "t": "delete", "p": "topic", "pt": "msg" },
    { "t": "change", "p": "payload", "pt": "msg", "from": "\\d+", "fromt": "re", "to": "#", "tot": "str" }
  ],
  "info": "Documentation"
}
```

**What each rule does in this example:**

| Rule # | Action | Detail |
|--------|--------|--------|
| 1 | **set** | Sets `msg.payload` to the string `"123"` |
| 2 | **change** | Replaces all occurrences of `"45"` with `"54"` in `msg.payload` |
| 3 | **delete** | Removes `msg.topic` from the message |
| 4 | **change (regex)** | Replaces all digit sequences (`\d+`) in `msg.payload` with `#`. Regex mode is activated by `fromt: "re"`. |

### range
`type: "range"` — Scale a numeric value from one range to another.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `action` | string | `"scale"` (linear map), `"clamp"`, `"rollover"`, `"scale and limit"` |
| `property` | string | Input property (default `"payload"`) |
| `minin` | number | Input range minimum |
| `maxin` | number | Input range maximum |
| `minout` | number | Output range minimum |
| `maxout` | number | Output range maximum |
| `round` | boolean | Round result to integer |

### template
`type: "template"` — Set a property using Mustache templates.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `field` | string | Property to set (default `"payload"`) |
| `fieldType` | string | `"msg"`, `"flow"`, `"global"` |
| `template` | string | Mustache template (e.g., `"Hello {{payload.name}}"`) |
| `syntax` | string | `"mustache"`, `"plain"`, `"json"` |
| `output` | string | `"str"`, `"json"`, `"yaml"`, `"plain"` |

### filter (RBE)
`type: "rbe"` — Report By Exception. Passes messages only when a value changes.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `func` | string | `"rbe"` (value change), `"deadband"` (numeric band), `"narrowband"`, `"rbei"` (ignore initial) |
| `gap` | number | Deadband threshold (for deadband/narrowband modes) |
| `property` | string | Property to monitor |
| `start` | string | Initial value |

---

## Flow Control Nodes

### delay
`type: "delay"` — Delays messages by a fixed time, rate-limits, or waits for a reset.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `pauseType` | string | `"delay"` (fixed), `"rate"` (rate limit), `"delayv"` (variable from property), `"timed"` (hourly/daily) |
| `timeout` | number | Delay in ms (for delay/delayv) |
| `timeoutUnits` | string | `"milliseconds"`, `"seconds"`, `"minutes"`, `"hours"`, `"days"` |
| `rate` | number | Messages per time unit (for rate mode) |
| `rateUnits` | string | `"second"`, `"minute"`, `"hour"`, `"day"` |
| `nbRateUnits` | number | Count for rate window |
| `drop` | boolean | Drop intermediate messages (rate mode) |

### trigger
`type: "trigger"` — Sends a message, then optionally a second message after a timeout. Useful for debouncing and watchdog timers.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `op1` | string | First output value (sent immediately) |
| `op1Type` | string | Type of first output |
| `op2` | string | Second output value (sent after timeout) |
| `op2Type` | string | Type of second output |
| `duration` | number | Timeout between outputs (ms) |
| `extend` | boolean | Extend timer on new input (re-triggerable) |
| `reset` | string | Reset condition |

### split
`type: "split"` — Splits a message into a sequence of messages (array → individual, string → lines, object → key/value pairs).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `splt` | string | Split mode: `"\\n"` (lines), `"str"` (fixed length), `"len"` (array chunks) |
| `spltType` | string | Alternative: `"str"`, `"arr"`, `"obj"`, `"bin"` |
| `arraySplt` | number | Chunk size for array split |
| `stream` | boolean | Stream mode: rebuild before splitting |

### join
`type: "join"` — Joins sequences of messages into a single message (counterpart to split).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `mode` | string | `"auto"` (paired with split), `"custom"` (manual config) |
| `build` | string | `"array"`, `"string"`, `"merged"`, `"segmented"` |
| `property` | string | Property to join (default `"payload"`) |
| `key` | string | Key property for grouping messages |
| `joiner` | string | Separator string (string mode) |
| `timeout` | number | Timeout to auto-send partial batches |

### sort
`type: "sort"` — Sorts messages by a property value.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `target` | string | Property to sort by |
| `targetType` | string | `"msg"`, `"flow"`, `"global"` |
| `order` | string | `"ascending"` or `"descending"` |
| `as_num` | boolean | Compare as numbers |

### batch
`type: "batch"` — Groups messages into batches by count, interval, or both.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `mode` | string | `"count"`, `"interval"`, `"concat"` (array concat on topic match) |
| `count` | number | Messages per batch |
| `interval` | number | Time window between batches |
| `overlap` | number | Overlap between batches |

---

## Network Nodes

### http in
`type: "http in"` — Creates an HTTP endpoint. Starts a message when a request arrives.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `url` | string | URL path (e.g., `"/api/data"`) |
| `method` | string | **⚠️ LOWERCASE only.** `"get"`, `"post"`, `"put"`, `"delete"`, `"patch"` — **Do NOT use uppercase** (`"GET"` does not work). Contrast: `http request` uses uppercase. |

**⚠️ CRITICAL — method must be lowercase:** The `http in` node does NOT accept `"GET"` (uppercase). If you use `"GET"` the endpoint registers but never responds (404 errors). Always use `"get"`. The `http request` node DOES use uppercase (`"GET"`, `"POST"`, etc.) — do not confuse the two.

**Response:** Must be paired with an `http response` node. `msg.req` and `msg.res` are available. Set `msg.payload` for the response body, `msg.statusCode` for status, and `msg.headers` for response headers.

### http response
`type: "http response"` — Sends an HTTP response. Must be wired after an `http in` node.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `statusCode` | number | Default status code |

### http request
`type: "http request"` — Makes an outbound HTTP request.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `method` | string | `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"PATCH"`, `"HEAD"` |
| `url` | string | Target URL (can use `{{msg.url}}` for dynamic) |
| `ret` | string | `"txt"`, `"obj"` (parsed JSON), `"bin"` (Buffer) |
| `tls` | string | TLS config node ID (for HTTPS with custom certs) |
| `paytoqs` | boolean | Append payload as query string (GET only) |

### websocket in / websocket out
`type: "websocket in"` / `type: "websocket out"` — WebSocket client or server.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `server` | string | WebSocket config node ID (shared between in/out) |
| `client` | string | Client config node ID (for client mode) |

### tcp in / tcp out
`type: "tcp in"` / `type: "tcp out"` — Raw TCP socket communication.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `server` | string | TCP config node ID |
| `host` | string | Host (client mode) |
| `port` | number | Port |
| `datamode` | boolean | Output as stream/Buffer |
| `ret` | string | Encoding (e.g., `"utf8"`) |

### udp in / udp out
`type: "udp in"` / `type: "udp out"` — UDP datagram communication.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `group` | string | Multicast group |
| `port` | number | Local port |
| `iface` | string | Network interface |
| `outport` | number | Output port (udp out) |
| `outhost` | string | Output host (udp out) |

### mqtt in / mqtt out
`type: "mqtt in"` / `type: "mqtt out"` — MQTT publish/subscribe.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `broker` | string | MQTT broker config node ID |
| `topic` | string | Topic to subscribe/publish |
| `qos` | string | `"0"`, `"1"`, `"2"` |
| `datatype` | string | `"auto-detect"`, `"utf8"`, `"json"`, `"buffer"` |
| `rh` | boolean | Retain flag (mqtt out only) |

---

## Data Parsing Nodes

### json
`type: "json"` — Converts between JSON string and JavaScript object.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `property` | string | Property to convert (default `"payload"`) |
| `action` | string | `"obj"` (string→object), `"str"` (object→string) |
| `pretty` | boolean | Pretty-print output |

### xml
`type: "xml"` — Converts between XML string and JavaScript object.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `property` | string | Property to convert |
| `attr` | string | Attribute prefix (default `"$"`) |
| `chr` | string | Character data key (default `"_"`) |

### yaml
`type: "yaml"` — Converts between YAML string and JavaScript object.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `property` | string | Property to convert |

### csv
`type: "csv"` — Converts between CSV string and JavaScript object/array.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `sep` | string | Column separator (default `","`) |
| `hdrin` | boolean | First row is header |
| `hdrout` | string | `"all"`, `"none"`, `"once"` |
| `skip` | number | Lines to skip |
| `charset` | string | Character encoding |

### html
`type: "html"` — Extracts data from HTML using CSS selectors.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `property` | string | Property containing HTML |
| `tag` | string | CSS selector (e.g., `"div.content p"`) |
| `ret` | string | `"text"`, `"html"` (innerHTML), `"attr"` |
| `as` | string | `"single"` or `"multi"` (array) |
| `attr` | string | Attribute name (when ret is "attr") |

---

## Storage & Exec Nodes

### file
`type: "file"` — Reads a file and sends contents as payload. Can also append to a file.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `filename` | string | File path |
| `action` | string | `"read"` (str/Buffer), `"append"` |
| `outputType` | string | `"utf8"` or `"buffer"` |
| `deleteAfterRead` | boolean | Delete file after reading |

### file in
`type: "file in"` — Watches a file and triggers on change. Alternative to `watch`.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `filename` | string | File path |
| `format` | string | `"lines"`, `"stream"`, `"object"` |
| `outputType` | string | `"utf8"` or `"buffer"` |

### watch
`type: "watch"` — Watches a directory for file changes.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `files` | string | Directory path |
| `recursive` | boolean | Watch subdirectories |

### exec
`type: "exec"` — Runs a system command and returns its output.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `command` | string | Command to run |
| `addpay` | boolean | Append msg.payload as arguments |
| `append` | string | Extra arguments |
| `useSpawn` | boolean | Use spawn (streaming) instead of exec |
| `timer` | number | Timeout (seconds) |
| `winHide` | boolean | Hide window (Windows) |

---

## Config Nodes (Shared Resources)

Config nodes hold reusable settings (broker connections, TLS certificates, proxy settings) shared across flow nodes. They are NOT wired into flows — regular nodes reference them by ID.

**⚠️ Credential privacy**: Node-RED **never** exposes credential values via the API. `get-node-detail` will NOT show `username`, `password`, `key`, `cert`, etc. — even if configured. A missing `credentials` field does NOT mean credentials are absent.

**To create/update credentials**, always use a `credentials` sub-object:
```
create-node / update-node properties: { ..., credentials: { username: "u", password: "p" } }
```

### mqtt-broker
`type: "mqtt-broker"` — MQTT connection settings shared by `mqtt in` and `mqtt out` nodes.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `broker` | string | MQTT server hostname |
| `port` | string | MQTT server port |
| `usetls` | boolean | Enable TLS |
| `clientid` | string | Client ID (auto-generated if empty) |
| `keepalive` | string | Keep-alive interval (seconds) |
| `cleansession` | boolean | Clean session flag |

**Credentials** (send inside `credentials: { ... }` — NOT at top level):
| Field | Type | Description |
|-------|------|-------------|
| `username` | string | MQTT username |
| `password` | string | MQTT password |

### http-proxy
`type: "http-proxy"` — HTTP proxy settings shared by `http request` node.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `url` | string | Proxy URL (e.g., `http://proxy.example.com:8080`) |
| `noproxy` | string | Bypass proxy for these hosts |

**Credentials** (send inside `credentials: { ... }`):
| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Proxy username |
| `password` | string | Proxy password |

### tls-config
`type: "tls-config"` — TLS/SSL certificate configuration shared by nodes that need secure connections.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `servername` | string | Expected server name (SNI) |
| `verifyservercert` | boolean | Verify server certificate |

**Credentials** (send inside `credentials: { ... }`):
| Field | Type | Description |
|-------|------|-------------|
| `cert` | string | Client certificate (PEM) |
| `key` | string | Client private key (PEM) |
| `ca` | string | CA certificate (PEM) |
| `passphrase` | string | Private key passphrase |

### websocket-listener / websocket-client
`type: "websocket-listener"` / `type: "websocket-client"` — WebSocket server/client config shared by `websocket in` and `websocket out` nodes.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Label |
| `path` | string | URL path (listener) or full URL (client) |
| `wholemsg` | string | Send entire msg object (not just payload) |

**Credentials** (send inside `credentials: { ... }`):
| Field | Type | Description |
|-------|------|-------------|
| `username` | string | Auth username (if using auth) |
| `password` | string | Auth password (if using auth) |

---

## Function Node — Deep Dive

The function node (`type: "function"`) is the most powerful node — it runs arbitrary JavaScript for each incoming message.

### Setting Code via MCP

Use the `func` property in `create-node` or `update-node` to set the function body:

```
properties: { func: "msg.payload = msg.payload * 2;\nreturn msg;" }
```

Set the number of output ports with `outputs`:

```
properties: { outputs: 3 }
```

> **Tip:** Use `get-node-detail` to read a function node's current code. It returns the full `func` field.

### Full Node Configuration Examples

These are the `properties` objects you pass to `create-node` or `update-node`. They represent **real, working** node configurations as exposed by the Node-RED API.

**Minimal example — single output, pass-through:**

```json
{
  "type": "function",
  "name": "function 1",
  "func": "\nreturn msg;",
  "outputs": 1,
  "timeout": 0,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": []
}
```

> **⚠️ CRITICAL — do NOT omit default fields.** Even though these are Node-RED defaults, the MCP `create-node` does NOT auto-populate them. You MUST set them explicitly, or the Node-RED editor will show red triangle errors on the node.
>
> **Minimum `create-node` properties for a function node with 1 output:**
> ```js
> {
>   name: "myFunction",
>   func: "return msg;",
>   outputs: 1,
>   noerr: 0,
>   initialize: "",
>   finalize: "",
>   libs: []
> }
> ```
>
> **Minimum for 2 outputs:** same, with `outputs: 2`.

**Full example — all available properties:**

```json
{
  "type": "function",
  "name": "Function example",
  "func": "const output1 = 1;\nconst output2 = \"text\";\nconst msg1 = {\n    \"payload\": output1\n};\nconst msg2 = {\n    \"payload\": output2\n};\nreturn [msg1, msg2];",
  "outputs": 2,
  "timeout": 0,
  "noerr": 0,
  "initialize": "// Code added here will be run once\n// whenever the node is started.\n// This is optional\nnode.warn(\"this is the start\");",
  "finalize": "// Code added here will be run when the\n// node is being stopped or re-deployed.\n// This is optional\nnode.warn(\"this is the end\");",
  "libs": [{ "var": "uuidv4", "module": "uuidv4" }],
  "inputLabels": ["input label"],
  "outputLabels": ["output 1 label", "output 2 label"],
  "info": "This is the documentation of this function node"
}
```

**Optional fields explained:**

| Field | Type | Optional | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display label on the node |
| `func` | string | **No** | JavaScript body. Plain string, `\n` for line breaks. |
| `outputs` | number | **No** | Number of output ports. Must match array length in `return [a, b, ...]`. |
| `timeout` | number | Yes | Seconds before the function is killed (0 = no timeout). |
| `noerr` | number | Yes | If `1`, errors thrown inside `func` are NOT caught by catch nodes (0 = caught). |
| `initialize` | string | Yes | Code run once when the node starts. Use for setup (connections, config loading). |
| `finalize` | string | Yes | Code run when the node stops or re-deploys. Use for cleanup (close connections). |
| `libs` | array | Yes | Array of `{ "var": "<name>", "module": "<npm-package>" }`. Loads npm modules into the function scope. Node-RED must have the package installed. |
| `inputLabels` | array | Yes | Labels for input ports shown in the editor. One string per input. |
| `outputLabels` | array | Yes | Labels for output ports shown in the editor. One string per output. |
| `info` | string | Yes | **Description** field in the Node-RED editor UI. Rich text documentation for the node. |

### Available Globals

Inside the function body, these globals are available:

| Global | Description |
|--------|-------------|
| `msg` | The incoming message object |
| `node` | The function node instance (`node.id()`, `node.name()`) |
| `context` | Node-scoped key-value store |
| `flow` | Flow-scoped key-value store |
| `global` | Global-scoped key-value store |
| `env` | Flow environment variables helper |
| `RED` | Node-RED runtime (advanced: `RED.util.cloneMessage()`, `RED.nodes.getNode()`) |

### Return Semantics

The function node's behavior depends on what you return:

| Return Value | Behavior |
|-------------|----------|
| `return msg;` | Send `msg` to output 0 |
| `return [msg1, msg2];` | Send `msg1` to output 0, `msg2` to output 1 |
| `return [msg1, null, msg3];` | Send `msg1` to output 0, nothing to output 1, `msg3` to output 2 |
| `return null;` | Send nothing (stop the message) |
| No return | Same as `return null;` |
| Single element array `return [msg];` | Send `msg` to output 0 |

### Context API

Within a function node, you can **read AND write** context at all three scopes:

```javascript
// Node scope (this node only)
const count = context.get("count") || 0;
context.set("count", count + 1);

// Flow scope (all nodes on this tab)
const config = flow.get("config") || {};
config.updated = Date.now();
flow.set("config", config);

// Global scope (entire instance)
const users = global.get("users") || [];
users.push(msg.payload.username);
global.set("users", users);
```

> **Contrast with MCP:** The MCP `get-context` tool can only **read** context; `delete-context` can **delete**. The Admin API does not support writing context. Use a function node as shown above when you need to write context values.

### Async Patterns

For asynchronous operations (HTTP requests, file I/O, database queries), use the callback pattern:

```javascript
// Pattern 1: node.send()
doAsyncWork(msg, (err, result) => {
    if (err) { node.error(err, msg); return; }
    msg.payload = result;
    node.send(msg);
});
return; // MUST return after calling async

// Pattern 2: done() (requires Outputs: 1)
doAsyncWork(msg, (err, result) => {
    if (err) { node.error(err, msg); return; }
    msg.payload = result;
    node.send(msg);
    done();
});

// Pattern 3: Promise with async/await
(async () => {
    try {
        const result = await doAsyncWork(msg);
        msg.payload = result;
        node.send(msg);
    } catch (err) {
        node.error(err, msg);
    }
})();
return;

// Pattern 4: Multiple async outputs
doAsync1(msg, (err, r1) => {
    doAsync2(msg, (err, r2) => {
        node.send([{payload: r1}, {payload: r2}]);
    });
});
return;
```

**Critical rule:** Always `return;` after calling an async function. Without it, the function node will continue to the end and the closure runs after, causing unpredictable behavior.

### Logging & Errors

```javascript
// Logging (visible in Node-RED console, not in debug sidebar)
node.log("Processing message from " + msg.topic);
node.warn("Unexpected payload type: " + typeof msg.payload);
node.trace("msg._msgid: " + msg._msgid); // Debug-level

// Error handling
if (!msg.payload) {
    node.error("Empty payload", msg);  // Caught by catch nodes
    return null;
}

// Throwing inside catch
try {
    JSON.parse(msg.payload);
} catch (e) {
    node.error("Invalid JSON: " + e.message, msg);
    return null;
}
```

`node.error("message", msg)` sends the error to catch nodes. Always pass `msg` as the second argument so the catch node can access the original message.

### Inline Code Examples

**Transform payload:**
```javascript
msg.payload = msg.payload.toUpperCase();
return msg;
```

**Filter messages:**
```javascript
if (msg.payload.temperature > 30) {
    return msg;  // Pass through
}
return null;  // Drop
```

**Add metadata:**
```javascript
msg.topic = "sensor/" + msg.payload.deviceId;
msg.timestamp = Date.now();
return msg;
```

**Count and tag:**
```javascript
const count = context.get("count") || 0;
context.set("count", count + 1);
msg.payload = { index: count, data: msg.payload };
return msg;
```

**Route to multiple outputs (3 outputs configured):**
```javascript
if (msg.payload.type === "alarm") {
    return [msg, null, null];  // Output 0 only
} else if (msg.payload.type === "warning") {
    return [null, msg, null];  // Output 1 only
}
return [null, null, msg];  // Output 2 (info)
```
