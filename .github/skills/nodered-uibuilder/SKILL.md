---
name: nodered-uibuilder
version: "7.7.3"
description: >-
  Architecture and communication patterns for node-red-contrib-uibuilder v7.7.3,
  a versatile bridge between Node-RED flows and custom web frontends.
  Covers the single-node bridge model, filesystem-based frontend structure,
  Socket.IO bidirectional messaging, framework integration patterns
  (Vue, React, Svelte, vanilla JS), and common recipes. Docs:
  https://totallyinformation.github.io/node-red-contrib-uibuilder/
tools:
  - install-node
  - create-node
  - update-node
  - get-node-type-detail
  - get-node-detail
  - inject-message
  - read-debug-messages
  - refresh-staging
  - deploy
---

# Node-RED UIBuilder — Architecture & Patterns

Comprehensive reference for **node-red-contrib-uibuilder** v7.7.3, a versatile bridge that connects Node-RED flows to custom web frontends via Socket.IO. Unlike Dashboard 2.0 (widget-based), uibuilder gives you a single Node-RED node that acts as a bidirectional bridge to a **full web application** stored on the filesystem. You write the frontend code yourself using any framework — uibuilder handles the real-time communication.

> **⚠️ Staging reminder:** All create-node/update-node calls stage changes locally. After adding or configuring a uibuilder node, call `deploy()` to push to Node-RED. The uibuilder node serves frontend files only after deploy.

> **Prerequisites:** Read `nodered-fundamentals` first for core vocabulary. The frontend code is edited outside the MCP domain — MCP tools manage only the Node-RED side (the uibuilder node itself). Use the Node-RED editor or a local file editor to modify frontend files.

> **Frontend scope:** This skill covers the bridge layer — Node-RED communication patterns and the `msg._ui` protocol. For full frontend framework tutorials (Vue, React, Svelte), consult the official docs at https://totallyinformation.github.io/node-red-contrib-uibuilder/.

---

## Architecture

UIBuilder uses a **single-node bridge** model. One `uibuilder` node in Node-RED connects to one web application via Socket.IO:

```
┌─────────────────────────────────────────────────────────┐
│                   Node-RED Runtime                       │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ inject/  │───▶│  uibuilder   │◀───│ function/debug│  │
│  │ sensor   │    │    node      │    │ (process      │  │
│  │          │◀───│              │───▶│  responses)   │  │
│  └──────────┘    └──────┬───────┘    └───────────────┘  │
│                         │                                │
│                    Socket.IO                             │
│                    (websocket)                           │
└─────────────────────────┼───────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │    Frontend App       │
              │  (on filesystem)      │
              │                       │
              │  ~/.node-red/         │
              │    uibuilder/         │
              │      <url>/           │
              │        src/           │
              │          index.html   │
              │          index.js     │
              │          index.css    │
              └───────────────────────┘
```

**Key architectural points:**
- **One uibuilder node = one web app.** Each node serves its own URL path and has its own frontend directory.
- **Frontend lives on the filesystem** at `~/.node-red/uibuilder/<url>/src/`. This is where `index.html`, `index.js`, and `index.css` live.
- **Communication is bidirectional.** NR flows send data to the frontend via Socket.IO. The frontend sends data back to NR flows via Socket.IO.
- **MCP handles ONLY the Node-RED side.** You create/configure the uibuilder node with MCP tools. The frontend code is written separately outside the MCP domain.
- **No build step required.** The uibuilder library (`uibuilder.esm.js` or `uibuilder.iife.js`) is served directly to the browser. You can use any framework or none at all.

**Supported frameworks (all optional):** Vanilla JavaScript, Vue.js, React, Svelte, and any other framework that can run in a browser. UIBuilder is framework-agnostic.

---

## Setup & Configuration

### Installation

Install the uibuilder package via MCP:
```
install-node(packageName: "node-red-contrib-uibuilder")
```

### Creating a UIBuilder Node

```
create-node(type: "uibuilder", name: "My Web App", properties: {
  url: "my-app",
  name: "My Web App"
})
```

After deploy, uibuilder creates the frontend directory at `~/.node-red/uibuilder/my-app/src/` with template files.

### Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | URL path for the frontend. Access at `http://<host>:1880/uibuilder/<url>/`. Also the directory name under `~/.node-red/uibuilder/` |
| `name` | string | Display name for the node in the Node-RED editor |
| `topic` | string | Default `msg.topic` for messages emitted by this node |
| `forwardInputMessages` | boolean | If true, incoming messages on the input are forwarded to the frontend automatically |

### UIBuilder Node I/O

- **Input (left port):** Messages sent here are forwarded to the frontend via Socket.IO (if `forwardInputMessages` is true). You can also construct `msg._ui` commands here.
- **Output (right port):** Messages sent from the frontend via `uibuilder.send()` appear here as standard Node-RED `msg` objects. Wire this to function/debug nodes to process.

### Frontend Directory Structure

After deploy with a new `url`, uibuilder creates:
```
~/.node-red/uibuilder/<url>/
├── src/
│   ├── index.html    ← Main HTML file (edit this)
│   ├── index.js      ← Your frontend JavaScript (edit this)
│   └── index.css     ← Your styles (edit this)
├── package.json
└── ...
```

The `index.html` auto-loads the uibuilder client library. You edit the files in `src/` to build your UI.

---

## Communication Patterns

### Node-RED → Frontend (msg._ui Protocol)

The `msg._ui` protocol is the standard way to control the frontend DOM from Node-RED. Set `msg._ui` to an array of command objects. Each command has a `method` and method-specific parameters.

**Common _ui methods:**

| Method | Required Fields | Description |
|--------|----------------|-------------|
| `addToDom` | `selector`, `data` | Insert HTML/content into the DOM at the specified CSS selector. Optional: `position` (`"last"`, `"first"`, `"before"`, `"after"`) |
| `update` | `selector`, `data` | Replace the inner content of the element at the CSS selector |
| `remove` | `selector` | Remove the element at the CSS selector from the DOM |
| `notify` | `data` | Show a browser notification. `data` can be string message or `{ message, type, timeout }` |
| `navigate` | `data` | Navigate to a URL. `data` is the URL string |

**Example — add content to the page:**
```javascript
msg._ui = [
  {
    method: "addToDom",
    selector: "#output",
    data: "<div class='alert'>Temperature: 23.5°C</div>",
    position: "last"
  }
]
return msg;
// Send this from any node (function, inject, etc.) to the uibuilder node's input
```

**Example — update existing element:**
```javascript
msg._ui = [
  {
    method: "update",
    selector: "#status",
    data: "System running — last update: " + new Date().toLocaleTimeString()
  }
]
return msg;
```

**Example — show notification:**
```javascript
msg._ui = [
  {
    method: "notify",
    data: {
      message: "⚠️ Alert: Temperature exceeds threshold",
      type: "warning",
      timeout: 5000
    }
  }
]
return msg;
```

**Example — multiple commands:**
```javascript
msg._ui = [
  { method: "update", selector: "#temp", data: "23.5°C" },
  { method: "update", selector: "#humidity", data: "65%" },
  { method: "addToDom", selector: "#log", data: "<li>Reading recorded</li>", position: "first" }
]
return msg;
```

**Wiring pattern — NR → frontend:**
```
inject/function → [construct msg._ui] → uibuilder node (input)
```

### Frontend → Node-RED (uibuilder.send)

The frontend sends messages back to Node-RED using the `uibuilder.send()` function. Messages arrive at the uibuilder node's **output port** as standard `msg` objects.

**Minimal frontend JavaScript (vanilla JS, in index.js):**
```javascript
// Listen for messages from Node-RED
uibuilder.onChange('msg', function(msg) {
    console.log('Received from NR:', msg);
    
    // Do something with the data
    document.getElementById('output').innerHTML = 
        '<pre>' + JSON.stringify(msg, null, 2) + '</pre>';
});

// Send a message to Node-RED
function sendToNR(data) {
    uibuilder.send({
        topic: 'user-action',
        payload: data
    });
}

// Example: send on button click
document.getElementById('myButton').addEventListener('click', function() {
    sendToNR({ action: 'button_clicked', timestamp: Date.now() });
});
```

**Receiving in Node-RED:**
```
uibuilder node (output) → function/debug → ...
// msg.payload = { action: 'button_clicked', timestamp: 1234567890 }
// msg.topic = 'user-action'
```

**Wiring pattern — frontend → NR:**
```
uibuilder node (output port) → function (process user data) → ...
```

### Standard Messages from UIBuilder

UIBuilder automatically sends certain messages to the frontend on connection:
- **`msg.topic: 'uibuilder/connected'`** — Sent when the Socket.IO connection is established. Contains client info.
- **`msg.topic: 'uibuilder/disconnected'`** — Sent when the connection is lost.

These can be used to show connection status in the UI.

---

## Framework Integration

UIBuilder works with any frontend framework. The key is that the uibuilder client library (`uibuilder.esm.js` for ES modules or `uibuilder.iife.js` for script tags) must be loaded before your framework code.

### Vanilla JavaScript (No Framework)

The simplest setup. The uibuilder client is auto-loaded in the template `index.html`:

```html
<!-- index.html — vanilla JS template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>My UIBuilder App</title>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <div id="app">
        <h1>Node-RED Data</h1>
        <div id="output"></div>
        <button id="sendBtn">Send to NR</button>
    </div>
    
    <!-- uibuilder client (IIFE version) -->
    <script src="../uibuilder/vendor/socket.io/socket.io.min.js"></script>
    <script src="../uibuilder/uibuilder.iife.min.js"></script>
    <script src="./index.js"></script>
</body>
</html>
```

### Vue.js

Use the ESM version of the uibuilder client. The uibuilder client library detects Vue if `window.Vue` is available.

```javascript
// In your Vue app's entry point
import '../uibuilder/uibuilder.esm.min.js';  // load first

// Check if Vue is detected
if (uibuilder.get('isVue')) {
    console.log('Vue version:', uibuilder.get('vueVersion'));
}

// Use uibuilder within Vue components
export default {
    mounted() {
        uibuilder.onChange('msg', (msg) => {
            this.serverData = msg.payload;
        });
    },
    methods: {
        sendToNR() {
            uibuilder.send({ topic: 'vue-event', payload: this.formData });
        }
    }
}
```

### React

Load the uibuilder client as a module:

```javascript
// In your React app
import '../uibuilder/uibuilder.esm.min.js';

function App() {
    useEffect(() => {
        uibuilder.onChange('msg', (msg) => {
            console.log('Data from NR:', msg);
        });
        
        return () => {
            // cleanup if needed
        };
    }, []);
    
    const handleClick = () => {
        uibuilder.send({ topic: 'react-event', payload: { clicked: true } });
    };
    
    return <button onClick={handleClick}>Send to NR</button>;
}
```

### Svelte

```javascript
// In your Svelte component
import '../uibuilder/uibuilder.esm.min.js';
import { onMount } from 'svelte';

let serverData = '';

onMount(() => {
    uibuilder.onChange('msg', (msg) => {
        serverData = msg.payload;
    });
});

function sendToNR() {
    uibuilder.send({ topic: 'svelte-event', payload: { value: serverData } });
}
```

> **Official framework guides:** The snippets above are minimal connection examples. For full integration guides, build tooling setup, and best practices for each framework, see the official documentation: https://totallyinformation.github.io/node-red-contrib-uibuilder/#/ui-frameworks/README

---

## Recipes

### Recipe: Real-Time Data Display

**Goal:** Display live sensor data pushed from Node-RED to a web page.

**NR Side:**
1. Install and create uibuilder node:
```
install-node(packageName: "node-red-contrib-uibuilder")
uibId = create-node(type: "uibuilder", name: "Live Data", properties: { url: "live-data" })
```
2. Create an inject to simulate sensor data:
```
injectId = create-node(type: "inject", name: "Sensor", properties: {
  payload: "23.5",
  payloadType: "num",
  topic: "temperature",
  repeat: "2"
})
```
3. Wire inject → uibuilder:
```
connect-nodes(fromNodeId: injectId, outputPort: 0, toNodeId: uibId)
deploy()
```

**Frontend Side (edit `~/.node-red/uibuilder/live-data/src/index.js`):**
```javascript
uibuilder.onChange('msg', function(msg) {
    document.getElementById('temp').textContent = msg.payload + '°C';
    document.getElementById('time').textContent = new Date().toLocaleTimeString();
});
```

**Frontend HTML (`index.html`):**
```html
<h1>Live Sensor Data</h1>
<p>Temperature: <span id="temp">--</span></p>
<p>Last update: <span id="time">--</span></p>
```

Access at `http://<host>:1880/uibuilder/live-data/`.

### Recipe: Form Submission to NR and Response Back

**Goal:** User submits a form on the web page, NR processes it, and sends a confirmation back.

**NR Side:**
1. Create uibuilder node (as above).
2. Create a function to process form data:
```
fnId = create-node(type: "function", name: "Process Form", properties: {
  func: "// msg.payload from frontend = { name: '...', message: '...' }\nconst data = msg.payload;\n\n// Process the data (e.g., save to DB, send email)\nconst success = data.name && data.message;\n\n// Send response back to the frontend\nmsg._ui = [{\n  method: 'update',\n  selector: '#response',\n  data: success \n    ? '<div class=\"success\">Thank you, ' + data.name + '!</div>'\n    : '<div class=\"error\">Please fill all fields.</div>'\n}];\nreturn msg;",
  outputs: 1
})
```
3. Wire: uibuilder output → function → uibuilder input:
```
connect-nodes(fromNodeId: uibId, outputPort: 0, toNodeId: fnId)
connect-nodes(fromNodeId: fnId, outputPort: 0, toNodeId: uibId)
deploy()
```

**Frontend Side (`index.js`):**
```javascript
document.getElementById('submitBtn').addEventListener('click', function() {
    const name = document.getElementById('name').value;
    const message = document.getElementById('message').value;
    
    uibuilder.send({
        topic: 'form-submission',
        payload: { name: name, message: message }
    });
});

// Listen for response from NR
uibuilder.onChange('msg', function(msg) {
    if (msg._ui) {
        // _ui commands update the DOM automatically
        // The #response div will show success/error
    }
});
```

**Frontend HTML:**
```html
<input id="name" placeholder="Your name">
<textarea id="message" placeholder="Your message"></textarea>
<button id="submitBtn">Send</button>
<div id="response"></div>
```

### Recipe: NR as WebSocket Relay for External Data

**Goal:** Receive data from an external WebSocket/MQTT source, relay it to all connected frontend clients in real time.

**NR Side:**
1. Create uibuilder node:
```
uibId = create-node(type: "uibuilder", name: "Relay", properties: { url: "relay" })
```
2. Wire external data source → function → uibuilder input:
```
// External source (mqtt in, http request, etc.) → function
connect-nodes(fromNodeId: "<sourceId>", outputPort: 0, toNodeId: "<fnId>")
connect-nodes(fromNodeId: "<fnId>", outputPort: 0, toNodeId: uibId)
```
3. Function node to format data for frontend:
```javascript
// Format the incoming data for frontend display
msg._ui = [
  { method: "addToDom", selector: "#feed", data: "<li>" + JSON.stringify(msg.payload) + "</li>", position: "first" }
];
return msg;
```
4. Deploy.

**Frontend Side (`index.html`):**
```html
<h1>Live Data Feed</h1>
<ul id="feed"></ul>
```

All connected clients receive the relayed data in real time.

---

## References

- **Official Documentation:** https://totallyinformation.github.io/node-red-contrib-uibuilder/
- **Quick Start Guide:** https://totallyinformation.github.io/node-red-contrib-uibuilder/#/quick-start
- **Frontend Client Docs (functions):** https://totallyinformation.github.io/node-red-contrib-uibuilder/#/client-docs/functions
- **Controlling from Node-RED:** https://totallyinformation.github.io/node-red-contrib-uibuilder/#/client-docs/controlling-from-nr
- **Zero-code UI Elements:** https://totallyinformation.github.io/node-red-contrib-uibuilder/#/zero-code-elements/
- **GitHub Repository:** https://github.com/TotallyInformation/node-red-contrib-uibuilder
- **npm Package:** `node-red-contrib-uibuilder` (documented at v7.7.3)

> **Version note:** This skill documents `node-red-contrib-uibuilder` v7.7.3. The `msg._ui` protocol and client API are stable but may have additions in newer versions. For the latest API details, consult the official docs.
