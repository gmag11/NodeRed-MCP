---
name: nodered-patterns
description: >-
  Recipe book of common Node-RED flow patterns: HTTP endpoints, MQTT subscribers, timers,
  message routing, data transformation, error handling, and modularization.
tools:
  - create-flow
  - create-node
  - update-node
  - connect-nodes
  - disconnect-nodes
  - import-flow
  - export-flow
  - inject-message
  - read-debug-messages
  - get-flow-diagram
  - get-node-type-detail
---

# Node-RED Patterns & Recipes

Ready-to-use flow patterns. Each recipe lists the nodes, key properties, and wiring calls. Copy the pattern, adapt properties to your use case, and wire exactly as shown.

> **⚠️ Staging reminder:** All create-node/connect-nodes calls stage changes locally. After building any pattern, call `deploy()` to push to Node-RED. Then use `inject-message` + `read-debug-messages` to test.

> **Prerequisites:** Read `nodered-fundamentals` first for core vocabulary. Use `nodered-flow-builder` for the step-by-step build workflow.

---

## HTTP Endpoint

**Use when**: You need a REST API endpoint that receives requests and returns JSON.

**Nodes**: `http in` → `function` → `http response`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| http in | `url` | `"/api/resource"` |
| http in | `method` | `"get"` (or post/put/delete) |
| function | `func` | `"msg.payload = { result: 'ok', data: msg.payload };\nreturn msg;"` |
| function | `outputs` | `1` |
| http response | `statusCode` | `200` |

**Wiring**:
```
connect-nodes(fromNodeId: "<httpInId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<httpRespId>")
```

**Import shortcut**: `import-flow` from `examples/http-endpoint.json`

> Set `msg.statusCode` in the function node to override the response status. Set `msg.headers` for custom headers.

---

## HTTP GET Request

**Use when**: You need to fetch data from an external API.

**Nodes**: `inject` → `http request` → `function` (optional) → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| inject | `payloadType` | `"str"` |
| inject | `payload` | `""` |
| http request | `method` | `"GET"` |
| http request | `url` | `"https://api.example.com/data"` |
| http request | `ret` | `"obj"` (parsed JSON) |
| function (opt) | `func` | Extract/transform fields from response |

**Wiring**:
```
connect-nodes(fromNodeId: "<injectId>", outputPort: 0, toNodeId: "<httpReqId>")
connect-nodes(fromNodeId: "<httpReqId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<debugId>")
```

**Variations**: Replace inject with an `http in` to proxy API requests. Set `url` to `"{{msg.url}}"` for dynamic URLs. Use `ret: "txt"` for plain text responses.

---

## MQTT Subscriber

**Use when**: You need to receive messages from an MQTT broker and process them.

**Nodes**: `mqtt in` → `function` → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| mqtt in | `topic` | `"sensors/+/temperature"` |
| mqtt in | `qos` | `"2"` |
| mqtt in | `broker` | MQTT broker config node ID |
| function | `func` | Parse/validate/transform payload |
| debug | `complete` | `"payload"` |

**Wiring**:
```
connect-nodes(fromNodeId: "<mqttInId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<debugId>")
```

**Import shortcut**: `import-flow` from `examples/mqtt-subscriber.json`

> The broker config node is created automatically when you set the `broker` property with a broker host/port in `create-node` properties. MQTT topics support `+` (single-level) and `#` (multi-level) wildcards.

> **⚠️ Credential privacy**: `get-config-nodes` and `get-node-detail` will NOT show MQTT credentials (username/password) — Node-RED strips them from API responses. To set credentials, use `update-node` on the mqtt-broker config node with: `properties: { credentials: { username: "user", password: "pass" } }`. You cannot read credentials back; to verify they are set, check if the broker connection succeeds.

---

## Timer-Triggered Flow

**Use when**: You need a flow that runs on a schedule (every N seconds, cron, or once at startup).

**Nodes**: `inject` → `function` → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| inject | `repeat` | `"60"` (seconds) or `""` for manual |
| inject | `crontab` | `"*/5 * * * *"` (cron) |
| inject | `once` | `true` (fire once at start) |
| function | `func` | Your scheduled logic |

**Wiring**:
```
connect-nodes(fromNodeId: "<injectId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<debugId>")
```

**Import shortcut**: `import-flow` from `examples/timer-flow.json`

**Schedule options**:
- **Interval**: Set `repeat` to seconds (e.g., `"300"` = every 5 min)
- **Cron**: Set `crontab` (e.g., `"0 8 * * 1-5"` = weekdays at 8am)
- **Manual only**: Leave `repeat` and `crontab` empty

---

## Message Routing

**Use when**: You need to route messages to different outputs based on conditions.

**Nodes**: `inject` → `switch` → [N outputs] → `debug` × N

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| switch | `property` | `"payload"` |
| switch | `rules` | Array of condition objects |
| switch | `checkall` | `"false"` (stop at first match) |

**Example — route by type**:
```javascript
// Switch rules:
rules: [
  { t: "eq", v: "alarm", vt: "str" },       // Output port 0
  { t: "eq", v: "warning", vt: "str" },      // Output port 1
  { t: "eq", v: "info", vt: "str" }          // Output port 2
]
```

**Wiring** (3 outputs, 0-indexed ports):
```
connect-nodes(fromNodeId: "<switchId>", outputPort: 0, toNodeId: "<alarmDebugId>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 1, toNodeId: "<warnDebugId>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 2, toNodeId: "<infoDebugId>")
```

> Each rule maps to an output port by index. Rule 0 → port 0, rule 1 → port 1, etc. Add `{ t: "else" }` as a catch-all rule.

---

## Data Transformation

**Use when**: You need to reshape, rename, or compute message properties.

**Decision guide**: Use `change` for simple operations (set/move/delete properties). Use `function` for logic (conditions, loops, external calls).

### change node (simple)
| Property | Value |
|----------|-------|
| `rules` | `[{ t: "set", p: "payload.formatted", pt: "msg", to: "{{payload.name}} - {{payload.id}}", tot: "str" }]` |

### function node (complex)
```javascript
// Compute derived fields, filter, aggregate
if (!msg.payload.items) return null;
msg.payload.total = msg.payload.items.reduce((s, i) => s + i.price, 0);
msg.payload.count = msg.payload.items.length;
return msg;
```

**When to use each**:
- **change**: Set/delete/move a property, simple Mustache formatting
- **function**: Conditional logic, loops, external API calls, complex math
- **template**: Simple text formatting with `{{ }}` placeholders

---

## Error Handler

**Use when**: You need to catch and handle errors from any node on a flow tab.

**Nodes**: `catch` → `function` (log/notify) → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| catch | `scope` | `[]` (all nodes on tab) or `["<nodeId>", ...]` |
| catch | `uncaught` | `false` |
| function | `func` | Error processing/logging |

**Wiring**:
```
connect-nodes(fromNodeId: "<catchId>", outputPort: 0, toNodeId: "<functionId>")
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<debugId>")
```

**Import shortcut**: `import-flow` from `examples/error-handler.json`

**Error message structure** (available as `msg`):
```javascript
{
  payload: {
    message: "Error description",
    source: { id: "nodeId", type: "nodeType", name: "nodeName" }
  },
  error: { message: "...", stack: "..." }
}
```

> Place one catch node per tab. Scope it broadly (empty array = all nodes) unless you have specific error routing needs. Wire it to a debug node at minimum — uncaught errors are silently swallowed otherwise.

---

## Rate Limiting

**Use when**: You need to limit the rate of messages passing through a flow (protect downstream APIs, prevent burst overload).

**Nodes**: `inject` (source) → `delay` → `function` → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| delay | `pauseType` | `"rate"` |
| delay | `rate` | `1` (messages per window) |
| delay | `nbRateUnits` | `1` |
| delay | `rateUnits` | `"second"` |
| delay | `drop` | `true` (drop intermediate) or `false` (queue) |

**Wiring**: Standard sequential wiring.

**Common rate configurations**:
- 1 msg/sec: `rate: 1, rateUnits: "second"`
- 100 msgs/min: `rate: 100, nbRateUnits: 1, rateUnits: "minute"`
- 1 msg/sec, queue overflow: `drop: false` (messages wait in queue)
- 1 msg/sec, discard overflow: `drop: true` (intermediate messages lost)

---

## Join Streams

**Use when**: You need to combine messages from multiple sources into a single output.

**Nodes**: `inject` (2+) → ... → `join` → `function` → `debug`

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| join | `mode` | `"custom"` |
| join | `build` | `"merged"` (merge objects), `"array"` (collect), `"string"` (concatenate) |
| join | `key` | `"topic"` (group by topic) |
| join | `timeout` | `5` (seconds to auto-send partial) |

**Wiring** — all source branches converge on the single join node input:
```
connect-nodes(fromNodeId: "<source1Id>", outputPort: 0, toNodeId: "<joinId>")
connect-nodes(fromNodeId: "<source2Id>", outputPort: 0, toNodeId: "<joinId>")
connect-nodes(fromNodeId: "<joinId>", outputPort: 0, toNodeId: "<functionId>")
```

> Set the same `msg.topic` on all messages being joined. The join node groups by `key` property. Use `mode: "auto"` when paired with a split node upstream.

---

## Retry with Backoff

**Use when**: External API calls may fail transiently and should be retried with increasing delays.

**Nodes**: `inject` → `function` (attempt) → `switch` (check result) → output (port 0, success) OR → `delay` → loop back (port 1, retry)

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| function (attempt) | `func` | Attempt API call, increment retry counter |
| switch | `rules` | Check `msg.payload.success` or status code |
| delay | `pauseType` | `"delay"` |
| delay | `timeout` | Exponential backoff via `msg.delay` |

**Function body** (attempt node):
```javascript
msg.attempts = (msg.attempts || 0) + 1;
const MAX = 5;
// ... make API call, set msg.payload ...
if (!msg.payload.success && msg.attempts < MAX) {
    msg.delay = Math.pow(2, msg.attempts) * 1000; // 2s, 4s, 8s...
    msg.topic = "retry";
} else {
    msg.topic = msg.payload.success ? "success" : "exhausted";
}
return msg;
```

**Wiring** — loop pattern:
```
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<switchId>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 0, toNodeId: "<successDebugId>")
connect-nodes(fromNodeId: "<switchId>", outputPort: 1, toNodeId: "<delayId>")
connect-nodes(fromNodeId: "<delayId>", outputPort: 0, toNodeId: "<functionId>")  // LOOP
```

> ⚠️ Always include a max retry count to prevent infinite loops. Use exponential backoff (`Math.pow(2, n) * 1000`) to space retries.

---

## Cross-Tab Reuse with Link Nodes

**Use when**: You need to share logic across multiple flow tabs without duplicating nodes.

**Nodes**:
- **Producer tab**: source → `link out`
- **Consumer tab**: `link in` → function → debug
- **Request-reply**: `link call` (producer) → ... → `link out` (response) ← `link in` (consumer request)

**Key properties**:
| Node | Property | Value |
|------|----------|-------|
| link out | `links` | `["shared-bus-name"]` |
| link in | `links` | `["shared-bus-name"]` |
| link call | `links` | `["shared-bus-name"]` |
| link call | `linkType` | `"dynamic"` |

**Pattern — pub/sub across tabs**:
1. Create `link out` on producer tab with `links: ["data-feed"]`
2. Create `link in` on each consumer tab with `links: ["data-feed"]`
3. All link in nodes receive every message from the link out

**Pattern — request-reply**:
1. Producer: `link call` with `links: ["api"]` → sends, waits for response
2. Consumer: `link in` with `links: ["api"]` → processes → `link out` responds

> Link nodes connect by name, not wires. No `connect-nodes` calls needed between tabs. This is the cleanest way to modularize flows without subflows.
