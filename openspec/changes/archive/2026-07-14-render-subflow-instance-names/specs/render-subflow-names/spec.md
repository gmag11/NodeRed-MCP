## ADDED Requirements

### Requirement: Subflow instance name resolution in IR builder
The `ir-builder.js` SHALL resolve subflow instance node names by cross-referencing the flows array. If a subflow instance node (`type: "subflow:<uuid>"`) has an empty `.name`, the renderer SHALL look up the subflow definition node (`type: "subflow"`) whose `id` matches the `<uuid>` portion of the instance's type, and use the definition's `.name` as the display name.

#### Scenario: Instance with explicit name uses its own name
- **WHEN** a subflow instance node has `name: "Custom Name"` and `type: "subflow:a1b2c3d4"`
- **THEN** the rendered name SHALL be `"Custom Name"`

#### Scenario: Instance without name falls back to subflow definition name
- **WHEN** a subflow instance node has `name: ""` and `type: "subflow:a1b2c3d4"`, and the flows array contains a definition node with `id: "a1b2c3d4"` and `name: "My Subflow"`
- **THEN** the rendered name SHALL be `"My Subflow"`

#### Scenario: Instance without name and missing definition uses type fallback
- **WHEN** a subflow instance node has `name: ""` and `type: "subflow:a1b2c3d4"`, but no definition with `id: "a1b2c3d4"` exists in the flows array
- **THEN** the rendered name SHALL fall back to `"subflow:a1b2c3d4"` (current behavior preserved as fallback)

### Requirement: Distinct color for subflow instance nodes
The `colors.js` module SHALL define a distinct fill color for nodes whose `type` starts with `"subflow:"`. This color SHALL differ from both the default gray and from concrete node type colors (inject, function, etc.) to visually indicate the node is a subflow instance. Node-RED uses a light blue/turquoise shade for subflow instances.

#### Scenario: Subflow instance gets distinct color
- **WHEN** `getNodeColor(type)` is called with `type: "subflow:a1b2c3d4"`
- **THEN** the returned color SHALL NOT be `DEFAULT_COLOR` (`#cccccc`)
- **THEN** the returned color SHALL be a light blue/turquoise shade (e.g., `#ADD8E6` or similar)

#### Scenario: Non-subflow nodes unaffected
- **WHEN** `getNodeColor(type)` is called with `type: "function"` or `type: "inject"`
- **THEN** the returned color SHALL be the existing mapped color for that type (unchanged)

### Requirement: Visual indicator for subflow instances in all renderers
Each renderer output SHALL include a visual indicator that a node is a subflow instance:

- **Mermaid**: The node label SHALL be prefixed with a visual hint (e.g., `[Subflow] My Node`) to distinguish it from regular nodes
- **SVG**: The node rectangle SHALL include a small badge, icon, or text indicator (e.g., a "S" badge in the corner, or a prefix in the label)
- **HTML**: The rendered node SHALL include the same indicator as SVG, plus a CSS class or data attribute for styling

#### Scenario: Mermaid label shows subflow prefix
- **WHEN** a subflow instance node appears in a Mermaid diagram
- **THEN** its label SHALL be formatted as `[Subflow] <resolved name>` (e.g., `[Subflow] init`)

#### Scenario: SVG includes subflow badge
- **WHEN** an SVG is rendered containing a subflow instance node
- **THEN** the node's rendering SHALL include a visual element (badge, corner marker, or label prefix) indicating it is a subflow instance

#### Scenario: HTML includes subflow badge
- **WHEN** an HTML staging view is rendered containing a subflow instance node
- **THEN** the node SHALL include the same visual indicator as SVG, plus a CSS class like `subflow-instance` for custom styling
