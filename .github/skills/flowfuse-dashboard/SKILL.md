---
name: flowfuse-dashboard
version: "1.30.2"
description: >-
  Reference for @flowfuse/node-red-dashboard (Dashboard 2.0) v1.30.2, the officially
  recommended Node-RED dashboard. Covers widget catalog with properties,
  config nodes (ui-base, ui-page, ui-group), wiring patterns, and common
  dashboard recipes. Docs: https://dashboard.flowfuse.com/
tools:
  - install-node
  - create-node
  - update-node
  - get-node-type-detail
  - get-palette-nodes
  - get-node-detail
  - connect-nodes
  - inject-message
  - get-config-nodes
  - refresh-staging
  - deploy
---

# FlowFuse Dashboard 2.0 Reference

Comprehensive reference for building dashboards with **@flowfuse/node-red-dashboard** (Dashboard 2.0), the officially recommended successor to the obsolete `node-red-dashboard` v1. **Documented version: v1.30.2**.

> **⚠️ Staging reminder:** All create-node/connect-nodes calls stage changes locally. After building any dashboard, call `deploy()` to push to Node-RED. **NEVER skip deploy** — undeployed edits are not active.

> **Prerequisites:** Read `nodered-fundamentals` first for core vocabulary. Use `nodered-flow-builder` for the step-by-step build workflow. See `nodered-flow-layout` for node positioning rules.

> **Widget discovery:** For any widget NOT listed in the deep-reference section below, or to verify current property values, use `get-palette-nodes` to list available Dashboard 2.0 types and `get-node-type-detail` to retrieve the full property schema.

---

## Concepts & Architecture

Dashboard 2.0 is a **widget-based** dashboard system. Each UI element (button, chart, gauge, form, etc.) is a standard Node-RED node that you create with `create-node` and wire with `connect-nodes` on the flow canvas. There is no separate UI editor — the dashboard layout is defined entirely by the node hierarchy.

**Key differences from obsolete v1:**
- Package name is `@flowfuse/node-red-dashboard` (NOT `node-red-dashboard`)
- Uses Vue 3 / Vuetify 3 under the hood (v1 used AngularJS)
- Config nodes are regular Node-RED config nodes (not a separate UI setup tab)
- Supports multi-tenancy via `msg._client` for per-user data (see Multi-Tenancy section in the official docs)
- The Dashboard 2.0 sidebar in the Node-RED editor lets you manage pages, groups, themes, and widget ordering visually

**Design patterns:**
- **Single Source of Truth:** All users see the same data (default). Wire a sensor to a gauge — everyone sees the same reading.
- **Multi-Tenancy:** Each user sees their own data. Toggle "Accept Client Data" in the Dashboard 2.0 sidebar for specific widget types. Use `msg._client` to target specific connections.

---

## Config Nodes

Dashboard 2.0 uses three config nodes that define the dashboard structure. **Creation order matters** because each references the previous one:

```
ui-base (theme, app settings)
  └── ui-page (navigation entry, layout type)
        └── ui-group (widget container, width)
              └── widgets (ui-button, ui-chart, etc.)
```

### ui-base (`type: "ui-base"`)

Defines global dashboard settings: base URL path, app icon, navigation style, theme mode.

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | Base URL endpoint (default: `"/dashboard"`) |
| `name` | string | Dashboard site name shown in browser tab |
| `appIcon` | string | URL to square icon image (192-512px), shown in browser tab and PWA |
| `sideNavigationStyle` | string | `"default"` (collapsing), `"fixed"`, `"icons"` (collapse to icons), `"over"` (appear over content), `"none"` (always hide) |
| `headerStyle` | string | `"default"` (scrolls away), `"fixed"` (always visible), `"hidden"` (no title bar) |
| `headerContent` | string | `"pageName"`, `"dashboardName"`, `"dashboardNamePageName"`, `"none"` |
| `includePagePathInLabel` | boolean | Show page path alongside name in sidebar |
| `allowInstall` | boolean | Enable PWA install prompt |
| `theme` | string | Theme config node ID for default theme |

**Creation:**
```
create-node(type: "ui-base", name: "My Dashboard", properties: { path: "/dashboard", sideNavigationStyle: "default" })
```

### ui-page (`type: "ui-page"`)

Represents a navigable page in the dashboard sidebar. Must reference a `ui-base` node.

| Property | Type | Description |
|----------|------|-------------|
| `ui` | string | Config node ID of the parent `ui-base` |
| `path` | string | URL path extending the base (e.g., `"/page1"`) |
| `name` | string | Page display name in sidebar |
| `icon` | string | Material Design icon name (without `mdi-` prefix) |
| `theme` | string | Theme config node ID for page-specific theme |
| `layout` | string | `"grid"` (default), `"fixed"`, `"notebook"`, `"tabs"` |
| `defaultState` | object | `{ visibility: "visible"|"hidden", interactivity: "enabled"|"disabled" }` |

**Creation:**
```
create-node(type: "ui-page", name: "Home", properties: { ui: "<uiBaseId>", path: "/home", icon: "home", layout: "grid" })
```

### ui-group (`type: "ui-group"`)

A container for widgets on a page. Must reference a `ui-page` node. Widgets reference their parent `ui-group`.

| Property | Type | Description |
|----------|------|-------------|
| `page` | string | Config node ID of the parent `ui-page` |
| `name` | string | Group label shown in the dashboard |
| `width` | number | Width in grid columns (1-12, grid layout) or fixed px units |
| `height` | number | Minimum height in px |
| `type` | string | `"default"` (always visible) or `"dialog"` (triggered by `ui-control`) |
| `class` | string | Custom CSS class(es) |
| `defaultState` | object | `{ visibility: "visible"|"hidden", interactivity: "enabled"|"disabled" }` |

**Creation:**
```
create-node(type: "ui-group", name: "Controls", properties: { page: "<uiPageId>", width: 6, height: 200 })
```

**Note:** If you create a widget without specifying a `group`, Dashboard 2.0 auto-creates a default base, page, and group for you. However, for predictable layouts, always create config nodes explicitly.

---

## Widget Catalog — Complete List

Every available Dashboard 2.0 widget with its `type` string for `create-node`. The list is ordered by category.

### Display Widgets

| Type | Description |
|------|-------------|
| `ui-text` | Displays text/HTML updated via `msg.payload`. Supports HTML formatting, JSONata value formatting |
| `ui-markdown` | Renders Markdown content sent via `msg.payload` |
| `ui-template` | Full Vue 3 component — custom HTML/CSS/JS, access to `msg` via `this.msg`. Use for custom charts, layouts, embedded content |
| `ui-table` | Tabular data display with sorting, pagination, search, cell types (text, link, button, color, progress, sparkline, image) |
| `ui-notification` | Toast notification popup with configurable position, timeout, color, dismiss/confirm buttons |
| `ui-audio` | Audio playback widget. Send URL in `msg.payload` to play |
| `ui-iframe` | Embeds an external URL in an iframe |
| `ui-led` | LED indicator light — sends boolean state from `msg.payload` |
| `ui-map` | Map display widget |

### Input / Control Widgets

| Type | Description |
|------|-------------|
| `ui-button` | Clickable button. Emits `msg.payload` on click. Supports icon, color, pointer events |
| `ui-button-group` | Group of buttons that emit the clicked button's value |
| `ui-switch` | Toggle switch — emits on/off payload values |
| `ui-slider` | Numeric slider with min/max/step. Emits value as user slides |
| `ui-number-input` | Numeric text input field |
| `ui-text-input` | Free-form text input field |
| `ui-dropdown` | Dropdown select (single or multi-select). Options as array of `{label, value}` |
| `ui-radio-group` | Radio button group |
| `ui-date-picker` | Date selection widget |
| `ui-file-input` | File upload widget |
| `ui-form` | Multi-field form with submit/cancel buttons. Emits form data as object |
| `ui-control` | Page/group visibility control — show/hide/enable/disable groups or navigate pages |
| `ui-event` | Emits events on page load/view. Used for multi-tenancy patterns |

### Data Visualization Widgets

| Type | Description |
|------|-------------|
| `ui-chart` | Multi-type chart (line, bar, scatter, pie/doughnut, histogram). Based on eCharts |
| `ui-gauge` | Gauge display (half, 3/4, tile, battery, water tank types with segments) |
| `ui-progress` | Progress bar — value 0-100 via `msg.payload` |

### Layout Widgets

| Type | Description |
|------|-------------|
| `ui-spacer` | Adds vertical space between widgets in a group |

> **Discovery tip:** Widget catalogs grow over releases. Use `get-palette-nodes` filtered for `@flowfuse/node-red-dashboard` to get the current list. Use `get-node-type-detail` on any type to get its full property schema.

---

## Deep Reference — Top 10 Widgets

Full property tables and wiring examples for the most commonly used widgets.

### ui-button

`type: "ui-button"` — Clickable button that emits `msg.payload` when clicked.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Button text |
| `icon` | string | Material Design icon name (without `mdi-` prefix) |
| `iconPosition` | string | `"left"` or `"right"` |
| `color` | string | Button background color (CSS color or hex) |
| `textColor` | string | Button text color |
| `iconColor` | string | Icon color |
| `payload` | string | Value emitted as `msg.payload` when clicked |
| `payloadType` | string | `"str"`, `"num"`, `"json"`, `"bool"` |
| `topic` | string | `msg.topic` value on click |
| `emulateClick` | boolean | If true, incoming `msg` triggers a click emit |

**Wiring example — button triggers a flow:**
```
// Create
create-node(type: "ui-button", name: "Start Process", properties: {
  group: "<uiGroupId>",
  label: "Start",
  icon: "play",
  color: "green",
  payload: "start",
  payloadType: "str"
})

// Wire: button → function (process)
connect-nodes(fromNodeId: "<buttonId>", outputPort: 0, toNodeId: "<functionId>")
```

**Data OUT (button click):** The button outputs `msg.payload` = the configured payload value. Wire the button's output to a function/switch node.

**Data IN (emulate click):** Send any `msg` to the button's input to programmatically trigger a click (if `emulateClick: true`). The button will emit its configured payload on its output.

**Dynamic updates via msg.ui_update:**
```javascript
msg.ui_update = {
  label: "Stop",
  icon: "stop",
  color: "red"
}
// Send to button's input to change appearance at runtime
```

### ui-chart

`type: "ui-chart"` — Multi-type chart supporting line, bar, scatter, pie/doughnut, and histogram.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Chart title |
| `chartType` | string | `"line"`, `"bar"`, `"scatter"`, `"pie"`, `"doughnut"` |
| `xAxisType` | string | `"timescale"`, `"linear"`, `"categorical"`, `"bins"` |
| `series` | string/array | Series grouping: `"msg.topic"`, `"key"` with key name, or JSON array of keys |
| `x` | string | Key in data for x-axis value. Leave blank for auto-timestamp on timescale |
| `y` | string | Key in data for y-axis value. Leave blank for `msg.payload` |
| `action` | string | `"append"` (add to existing) or `"replace"` (clear then add) |
| `showLegend` | boolean | Show chart legend |
| `pointShape` | string | `"circle"`, `"triangle"`, `"rect"`, `"diamond"`, etc. (line/scatter) |
| `pointRadius` | number | Point radius in px |
| `xAxisFormat` | string | Time format string (e.g., `"{HH}:{mm}:{ss}"`, `"{yyyy}-{M}-{d}"`) |
| `xAxisLimit` | number | Max data points or time limit before pruning old data (0 = unlimited) |
| `interpolation` | string | Line interpolation: `"linear"`, `"step"`, `"bezier"`, `"cubic"`, `"cubic-mono"` |

**Wiring example — live sensor chart:**
```
// Create chart
create-node(type: "ui-chart", name: "Temperature", properties: {
  group: "<uiGroupId>",
  label: "Temperature Over Time",
  chartType: "line",
  xAxisType: "timescale",
  series: "msg.topic",
  action: "append",
  xAxisLimit: 300  // keep last 300 data points
})

// Wire: inject (sensor) → chart
connect-nodes(fromNodeId: "<injectId>", outputPort: 0, toNodeId: "<chartId>")
```

**Data format for line chart:**
```javascript
// Simple value — auto-timestamp
msg.payload = 23.5
msg.topic = "Sensor A"

// Object with explicit timestamp and value
msg.payload = { time: Date.now(), value: 23.5 }
// With chart config: x → key "time", y → key "value"
```

**Data format for bar chart:**
```javascript
// Array of objects
msg.payload = [
  { category: "A", value: 10 },
  { category: "B", value: 25 },
  { category: "C", value: 15 }
]
// Config: x → "category", y → "value", xAxisType: "categorical"
```

**Clearing chart data:** Send `msg.payload = []` to clear all data.

**Dynamic chart options via msg.ui_update:**
```javascript
msg.ui_update = {
  chartOptions: {
    title: { textStyle: { fontSize: 20 } },
    yAxis: { position: "right" }
  }
}
// Full eCharts option object supported — changes are additive
```

### ui-gauge

`type: "ui-gauge"` — Gauge display with multiple visual types and color-coded segments.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Label above the gauge |
| `gtype` | string | `"gauge-tile"`, `"gauge-battery"`, `"gauge-tank"`, `"gauge-half"`, `"gauge-34"` |
| `gstyle` | string | `"needle"` or `"rounded"` (for half/34 gauges) |
| `value` | string/expression | Value source: `msg.payload`, `msg.<property>`, JSONata expression, or static |
| `min` | number | Minimum value |
| `max` | number | Maximum value |
| `segments` | array | `[{ color: "#hex", from: number }]` — color bands on the arc |
| `prefix` | string | Text before the value (half/34 only) |
| `suffix` | string | Text after the value (half/34 only) |
| `units` | string | Small units text below the value (half/34 only) |
| `icon` | string | Material Design icon below the value (half/34 only) |
| `alwaysShowLabel` | boolean | Always show label on tile gauges |
| `floatingLabelPosition` | string | `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"` (tile only) |

**Wiring example — real-time value display:**
```
// Create gauge
create-node(type: "ui-gauge", name: "CPU Usage", properties: {
  group: "<uiGroupId>",
  label: "CPU",
  gtype: "gauge-half",
  gstyle: "rounded",
  min: 0,
  max: 100,
  units: "%",
  segments: [
    { color: "#4caf50", from: 0 },
    { color: "#ff9800", from: 60 },
    { color: "#f44336", from: 80 }
  ]
})

// Wire: inject (sensor) → gauge
connect-nodes(fromNodeId: "<injectId>", outputPort: 0, toNodeId: "<gaugeId>")
```

**Data IN:** Send numeric `msg.payload` to update the gauge value. Use JSONata on the `value` property to format (e.g., `$round(payload, 1)` for 1 decimal).

**Dynamic updates via msg.ui_update:**
```javascript
msg.ui_update = {
  label: "Memory",
  min: 0,
  max: 64,
  units: "GB",
  segments: [{ color: "#2196f3", from: 0 }]
}
```

### ui-slider

`type: "ui-slider"` — Numeric slider with configurable range, ticks, and icons.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Label to the left of the slider (HTML allowed) |
| `min` | number | Minimum value |
| `max` | number | Maximum value |
| `step` | number | Step increment |
| `thumbLabel` | string | `"true"`, `"false"`, `"always"` — when to show the thumb value |
| `showTicks` | string | `"true"`, `"false"`, `"always"` — when to show ticks |
| `color` | string | Main slider/thumb color |
| `colorTrack` | string | Track color |
| `colorThumb` | string | Thumb/handle color |
| `iconPrepend` | string | Material icon before the slider |
| `iconAppend` | string | Material icon after the slider |
| `output` | string | `"onChange"` (emit while sliding) or `"onRelease"` (emit on release) |
| `showTextField` | boolean | Show a text input alongside for direct value entry |

**Wiring example — slider controls a chart:**
```
// Wire: slider → chart
connect-nodes(fromNodeId: "<sliderId>", outputPort: 0, toNodeId: "<chartId>")
// Moving the slider sends its value as msg.payload to the chart
```

**Data IN (set value):** Send numeric `msg.payload` to programmatically set the slider position.

**Data OUT (user interaction):** Slider emits `msg.payload` = current numeric value whenever the user moves it.

### ui-table

`type: "ui-table"` — Data table with sorting, pagination, search, and rich cell types.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Table title |
| `maxRows` | number | Max rows per page (0 = no pagination) |
| `selection` | string | `"none"`, `"click"` (select row), `"checkbox"` (multi-select) |
| `showSearch` | boolean | Show search/filter bar |
| `autoColumns` | boolean | Auto-detect columns from data keys |
| `columns` | array | Manual column definitions with `{ value, label, width, align, type }` |
| `breakpoint` | string/number | `"xs"`, `"sm"`, `"md"`, `"lg"`, px value, or `"none"` for responsive card mode |
| `deselect` | boolean | Auto-deselect when data is replaced |

**Cell types:** `text`, `html`, `link`, `color`, `tick-cross`, `progress`, `sparkline-trend`, `sparkline-bar`, `button`, `row-number`, `image`.

**Wiring example — display API data:**
```
// Create table
create-node(type: "ui-table", name: "Device List", properties: {
  group: "<uiGroupId>",
  label: "Devices",
  maxRows: 10,
  showSearch: true,
  autoColumns: true
})

// Wire: http request → table
connect-nodes(fromNodeId: "<httpReqId>", outputPort: 0, toNodeId: "<tableId>")
```

**Data IN format:**
```javascript
// Array of objects — keys become columns
msg.payload = [
  { id: 1, name: "Sensor A", status: "active", temp: 23.5 },
  { id: 2, name: "Sensor B", status: "inactive", temp: 0 }
]

// Single object — appended to existing data
msg.payload = { id: 3, name: "Sensor C", status: "active", temp: 19.2 }

// Empty array — clear all data
msg.payload = []
```

**Data OUT (row interaction):**
```javascript
// On row click (selection: "click")
msg.payload = { id: 1, name: "Sensor A", ... }  // full row object
msg.action = "row_click"

// On checkbox selection (selection: "checkbox")
msg.payload = [{ id: 1, ... }, { id: 2, ... }]  // array of selected rows
msg.action = "multiselect"

// On button cell click
msg.payload = { id: 1, ... }  // full row object
msg.column = "columnKey"
msg.action = "button_click"
```

### ui-form

`type: "ui-form"` — Multi-field form that collects user input and emits it as an object on submit.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Form title |
| `options` | array | Form field definitions: `[{ label, name, type, required }]` |
| `buttons` | object | `{ submit: "Submit", cancel: "Cancel" }` — omit cancel text to hide cancel button |
| `twoColumns` | boolean | Render form in two-column layout |
| `resetOnSubmit` | boolean | Clear form after submission |
| `topic` | string | `msg.topic` value on submit |

**Field types:** `text`, `multiline`, `password`, `email`, `number`, `checkbox`, `switch`, `date`, `time`, `dropdown`.

**Wiring example — form submission processing:**
```
// Create form
create-node(type: "ui-form", name: "User Registration", properties: {
  group: "<uiGroupId>",
  label: "Register",
  options: [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Email", name: "email", type: "email", required: true },
    { label: "Age", name: "age", type: "number" },
    { label: "Subscribe", name: "newsletter", type: "checkbox" }
  ],
  buttons: { submit: "Register", cancel: "Cancel" },
  resetOnSubmit: true
})

// Wire: form → function (process) → debug
connect-nodes(fromNodeId: "<formId>", outputPort: 0, toNodeId: "<functionId>")
```

**Data OUT:** On submit, `msg.payload` = `{ name: "John", email: "john@example.com", age: 30, newsletter: true }`.

**Data IN (pre-fill):** Send an object to the form's input to pre-fill fields:
```javascript
msg.payload = { name: "John", email: "john@example.com" }
```

### ui-dropdown

`type: "ui-dropdown"` — Dropdown select with single or multi-select support.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Label text (HTML allowed) |
| `options` | array | `[{ label: "Display", value: "val" }]` — can also be array of strings |
| `multiple` | boolean | Allow multi-selection |
| `chips` | boolean | Show selected items as chips (multi-select) |
| `clearable` | boolean | Show clear button |
| `allowSearch` | boolean | Enable text search/filter |
| `msgTrigger` | string | `"onChange"` or `"onClose"` — when to emit the value |

**Wiring example:**
```
create-node(type: "ui-dropdown", name: "Device Selector", properties: {
  group: "<uiGroupId>",
  label: "Select Device",
  options: [
    { label: "Sensor A", value: "sensor_a" },
    { label: "Sensor B", value: "sensor_b" },
    { label: "Sensor C", value: "sensor_c" }
  ]
})
```

**Data OUT:** On selection, `msg.payload` = the selected option's `value` (or array of values for multi-select).

**Data IN (programmatic selection):**
```javascript
// Single select
msg.payload = "sensor_a"

// Multi-select
msg.payload = ["sensor_a", "sensor_b"]

// Clear selection
msg.payload = []
```

### ui-text

`type: "ui-text"` — Displays a text value that updates with each received `msg.payload`. Supports HTML and JSONata formatting.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Optional label above/beside the text |
| `layout` | string | `"row-left"`, `"row-center"`, `"row-right"`, `"row-spread"`, `"col-center"` |
| `value` | string/expression | Value source: `msg.payload`, `msg.<property>`, JSONata expression, or static |
| `font` | string | Font family (if custom style enabled) |
| `fontSize` | string | Font size (if custom style enabled) |
| `color` | string | Text color (if custom style enabled) |

**Wiring example:**
```
create-node(type: "ui-text", name: "Status Display", properties: {
  group: "<uiGroupId>",
  label: "System Status",
  layout: "row-left"
})

// Wire any source → ui-text
connect-nodes(fromNodeId: "<sourceId>", outputPort: 0, toNodeId: "<textId>")
```

**Data IN:** Send `msg.payload` to update the displayed text. HTML is rendered if the payload contains HTML tags. Use JSONata on the `value` property to format (e.g., `$round(payload, 1)`).

**Dynamic update:**
```javascript
msg.ui_update = { label: "Temperature", color: "#e53935", fontSize: "24px" }
```

### ui-switch

`type: "ui-switch"` — Toggle switch that emits configurable on/off payload values.

| Property | Type | Description |
|----------|------|-------------|
| `group` | string | Parent `ui-group` config node ID |
| `label` | string | Label text |
| `layout` | string | `"row-left"`, `"row-left-reverse"`, `"row-spread"`, `"row-spread-reverse"` |
| `clickableArea` | string | `"switch"` (only the switch) or `"full"` (label + switch) |
| `onIcon` | string | Material icon when on |
| `offIcon` | string | Material icon when off |
| `onColor` | string | Icon color when on |
| `offColor` | string | Icon color when off |
| `onPayload` | string/number/boolean | Value emitted when switched on |
| `offPayload` | string/number/boolean | Value emitted when switched off |
| `onPayloadType` | string | `"str"`, `"num"`, `"json"`, `"bool"` |
| `offPayloadType` | string | `"str"`, `"num"`, `"json"`, `"bool"` |
| `passthru` | boolean | If true, passes input msg through to output |
| `decouple` | boolean | If true (non-passthrough), switch shows output state, not input state |

**Wiring example — switch controls an output:**
```
create-node(type: "ui-switch", name: "Enable Pump", properties: {
  group: "<uiGroupId>",
  label: "Pump",
  onPayload: true,
  onPayloadType: "bool",
  offPayload: false,
  offPayloadType: "bool"
})

// Wire: switch → function (control logic)
connect-nodes(fromNodeId: "<switchId>", outputPort: 0, toNodeId: "<functionId>")
```

**Data OUT:** On toggle, `msg.payload` = onPayload or offPayload.

**Data IN (set state):** Send the matching payload value to programmatically toggle:
```javascript
msg.payload = true   // switch turns on
msg.payload = false  // switch turns off
```

### ui-notification

`type: "ui-notification"` — Toast notification popup. **Unique:** attached to `ui-base` (via `ui` property), not `ui-group`.

| Property | Type | Description |
|----------|------|-------------|
| `ui` | string | Parent `ui-base` config node ID (NOT a group) |
| `position` | string | `"top right"`, `"top center"`, `"top left"`, `"bottom right"`, `"bottom center"`, `"bottom left"`, `"center center"` |
| `color` | string | Notification border/header color |
| `displayTime` | number | Auto-close timeout in seconds (0 = indefinite) |
| `showCountdown` | boolean | Show countdown progress bar |
| `allowDismiss` | boolean | Show dismiss button |
| `dismissText` | string | Dismiss button label |
| `allowConfirm` | boolean | Show confirm button |
| `confirmText` | string | Confirm button label |
| `raw` | boolean | If true, `msg.payload` is treated as raw HTML |

**Wiring example — alert on threshold:**
```
create-node(type: "ui-notification", name: "Alerts", properties: {
  ui: "<uiBaseId>",
  position: "top right",
  color: "#f44336",
  displayTime: 5,
  showCountdown: true,
  allowDismiss: true
})

// Wire: function (threshold check) → notification
connect-nodes(fromNodeId: "<functionId>", outputPort: 0, toNodeId: "<notifId>")
```

**Data IN:** Send `msg.payload` as the notification message text (or HTML if `raw: true`).

**Sending to all clients:** By default, notifications target specific clients via `msg._client`. To broadcast to all connected clients, delete `msg._client` before sending:
```javascript
delete msg._client
msg.payload = "⚠️ System Alert: Temperature exceeds threshold!"
return msg
```

**Data OUT:** When user clicks confirm or dismiss, the notification emits `msg.payload` with the action taken.

---

## Wiring Patterns

### Data INTO Widgets (Display/Update)

Most display widgets accept `msg.payload` on their input to update their content:

```
sensor/inject → [function/transform] → widget
```

- **Gauge/Text/Progress:** Wire any source directly. `msg.payload` numeric or string updates the display.
- **Chart:** Wire data source. `msg.payload` can be a single value (auto-timestamped) or an object/array with x/y keys.
- **Table:** Wire data source. `msg.payload` as array of objects or single object to append.
- **Notification:** Wire event source. `msg.payload` is the message text/HTML.

**msg.topic for targeted updates:** When multiple widgets share a data bus, use `msg.topic` to differentiate. For charts, `msg.topic` controls series grouping. For text/gauge, `msg.topic` can be used in switch nodes upstream to route data.

### Data OUT of Widgets (User Interaction)

Interactive widgets emit `msg.payload` from their output when the user interacts:

```
widget → [function/switch/process] → ...
```

- **Button:** Emits configured payload on click.
- **Switch:** Emits `onPayload`/`offPayload` on toggle.
- **Slider:** Emits numeric value as user slides.
- **Dropdown:** Emits selected `value` (or array for multi-select).
- **Form:** Emits `{ fieldName: value, ... }` on submit.
- **Table:** Emits row object on click/selection, with `msg.action` and `msg.column`.

### Chaining Widgets

Widgets can be chained together to create interactive dashboards:

```
slider → chart       // slider value drives chart
button → control     // button click shows/hides groups
dropdown → function  // selection filters data
form → http request  // form data posted to API
```

### Multi-Tenancy (Per-User Data)

Dashboard 2.0 supports per-user data via `msg._client`. Use the Dashboard 2.0 sidebar in Node-RED to enable "Accept Client Data" on specific widget types. When enabled:
- Every `msg` from that widget contains `msg._client` with the user's `socketId`
- Sending a `msg` with `_client` back targets only that user
- Delete `msg._client` to broadcast to all users

---

## Recipes

### Recipe: Live Chart from a Data Source

**Goal:** Display a real-time line chart from a sensor or periodic data source.

**Nodes:** `inject` (sensor simulator) → `ui-chart`

**Steps:**
1. Create config hierarchy:
```
baseId = create-node(type: "ui-base", name: "Dashboard", properties: { path: "/dashboard" })
pageId = create-node(type: "ui-page", name: "Monitoring", properties: { ui: baseId, path: "/monitor", layout: "grid" })
groupId = create-node(type: "ui-group", name: "Charts", properties: { page: pageId, width: 12 })
```
2. Create chart:
```
chartId = create-node(type: "ui-chart", name: "Live Readings", properties: {
  group: groupId,
  label: "Sensor Values",
  chartType: "line",
  xAxisType: "timescale",
  series: "msg.topic",
  action: "append",
  xAxisLimit: 300
})
```
3. Create inject (or wire existing sensor):
```
sourceId = create-node(type: "inject", name: "Sensor Sim", properties: {
  payload: "23.5",
  payloadType: "num",
  topic: "Temperature",
  repeat: "5"
})
```
4. Wire and deploy:
```
connect-nodes(fromNodeId: sourceId, outputPort: 0, toNodeId: chartId)
deploy()
```
5. Open `http://<nodered-host>:1880/dashboard/monitor` to view.

### Recipe: Button-Triggered Action

**Goal:** A button that triggers a function node to perform an action (API call, MQTT publish, etc.).

**Nodes:** `ui-button` → `function` → `debug` (or `http request`)

**Steps:**
1. Ensure config hierarchy exists (base → page → group). Create if needed.
2. Create button:
```
buttonId = create-node(type: "ui-button", name: "Refresh Data", properties: {
  group: "<groupId>",
  label: "Refresh",
  icon: "refresh",
  color: "blue",
  payload: "refresh",
  payloadType: "str"
})
```
3. Create processing function:
```
fnId = create-node(type: "function", name: "Fetch Data", properties: {
  func: "// Fetch data from API\n// msg.payload already = 'refresh' from button\nreturn msg;",
  outputs: 1
})
```
4. Wire:
```
connect-nodes(fromNodeId: buttonId, outputPort: 0, toNodeId: fnId)
```
5. Deploy and test — clicking the button triggers the function.

### Recipe: Form Submission Processing

**Goal:** Collect user input via a form and process it in Node-RED.

**Nodes:** `ui-form` → `function` (validate/process) → `debug` + `http request`

**Steps:**
1. Create form:
```
formId = create-node(type: "ui-form", name: "Contact Form", properties: {
  group: "<groupId>",
  label: "Contact Us",
  options: [
    { label: "Name", name: "name", type: "text", required: true },
    { label: "Message", name: "message", type: "multiline", required: true }
  ],
  buttons: { submit: "Send", cancel: "Clear" },
  resetOnSubmit: true
})
```
2. Create processing function:
```
fnId = create-node(type: "function", name: "Process Form", properties: {
  func: "// msg.payload = { name: '...', message: '...' }\nif (!msg.payload.name || !msg.payload.message) {\n  return null;  // drop invalid\n}\nmsg.topic = 'contact-form';\nreturn msg;",
  outputs: 1
})
```
3. Wire:
```
connect-nodes(fromNodeId: formId, outputPort: 0, toNodeId: fnId)
```
4. Deploy. On form submit, `msg.payload` contains `{ name: "User", message: "Hello" }`.

### Recipe: Gauge Monitoring a Real-Time Value

**Goal:** Display a live gauge that updates from a sensor or data source.

**Nodes:** `inject` (or data source) → `ui-gauge`

**Steps:**
1. Create gauge:
```
gaugeId = create-node(type: "ui-gauge", name: "CPU Load", properties: {
  group: "<groupId>",
  label: "CPU",
  gtype: "gauge-half",
  gstyle: "needle",
  min: 0,
  max: 100,
  units: "%",
  segments: [
    { color: "#4caf50", from: 0 },
    { color: "#ff9800", from: 60 },
    { color: "#f44336", from: 80 }
  ]
})
```
2. Wire data source to gauge:
```
connect-nodes(fromNodeId: "<sourceId>", outputPort: 0, toNodeId: gaugeId)
```
3. Deploy. Send numeric `msg.payload` values to the gauge to update the display.

---

## References

- **Official Documentation:** https://dashboard.flowfuse.com/
- **Getting Started Guide:** https://dashboard.flowfuse.com/getting-started.html
- **Widget Catalog:** https://dashboard.flowfuse.com/nodes/widgets.html
- **Config Nodes:** https://dashboard.flowfuse.com/nodes/config/ui-base.html
- **GitHub Repository:** https://github.com/FlowFuse/node-red-dashboard
- **npm Package:** `@flowfuse/node-red-dashboard` (documented at v1.30.2)

> **Version note:** This skill documents `@flowfuse/node-red-dashboard` v1.30.2. If the installed version differs significantly, consult the official docs for the latest widget properties and features. Use `get-node-type-detail` for runtime property discovery on any widget type.
