# Spec: FlowFuse Dashboard 2.0 Reference

## File
`.github/skills/flowfuse-dashboard/SKILL.md`

## Documentation URL
https://dashboard.flowfuse.com/

## Front-matter
```yaml
---
name: flowfuse-dashboard
version: 1.30.2
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
```

## Description
This specification dictates that `.github/skills/flowfuse-dashboard/SKILL.md` must be created containing a comprehensive reference for @flowfuse/node-red-dashboard (Dashboard 2.0). The skill covers architecture, config nodes, a widget catalog, wiring patterns, and common recipes. It SHALL include a link to the official documentation at https://dashboard.flowfuse.com/ so implementers can use up-to-date data.

## ADDED Requirements

### Requirement: FlowFuse Dashboard skill file
The system SHALL include a skill file at `.github/skills/flowfuse-dashboard/SKILL.md` with valid YAML frontmatter containing `name`, `version`, `description`, and `tools` fields. The `version` field SHALL record the npm package version documented (1.30.2). The skill SHALL provide LLM guidance on building dashboards with Dashboard 2.0 widgets via MCP tools.

#### Scenario: Skill has required frontmatter
- **WHEN** the skill file is loaded by the skill loader
- **THEN** it SHALL be parsed successfully and its metadata SHALL be available for skill discovery

#### Scenario: Skill includes official documentation URL
- **WHEN** an implementer reads the skill
- **THEN** the skill SHALL reference https://dashboard.flowfuse.com/ as the authoritative source for up-to-date widget properties and configuration

#### Scenario: Skill records documented version
- **WHEN** a maintainer reviews the skill
- **THEN** the skill frontmatter SHALL include `version: 1.30.2` indicating the npm package version at time of writing
- **THEN** the skill body SHALL mention the documented version in its introductory section

### Requirement: Skill covers Dashboard 2.0 concepts and architecture
The skill SHALL document Dashboard 2.0 as a widget-based dashboard where each UI element is a standard Node-RED node wired on the flow canvas. It SHALL distinguish Dashboard 2.0 from the obsolete `node-red-dashboard` v1 package.

#### Scenario: LLM learns Dashboard 2.0 fundamentals
- **WHEN** an LLM reads the skill
- **THEN** it SHALL understand that widgets are standard NR nodes created with `create-node` and wired with `connect-nodes`
- **THEN** it SHALL understand that all widget changes are staged and require `deploy` to take effect
- **THEN** it SHALL understand that Dashboard 2.0 (@flowfuse/node-red-dashboard) is the recommended replacement for the obsolete v1

### Requirement: Skill covers config nodes — ui-base, ui-page, ui-group
The skill SHALL document the three config node types that define the dashboard's structure and appearance. It SHALL specify the correct creation order: `ui-base` first, then `ui-page` (which references ui-base), then `ui-group` (which references ui-page), then widgets (which reference ui-group).

#### Scenario: LLM creates dashboard layout
- **WHEN** an LLM needs to set up a new dashboard
- **THEN** the skill SHALL show how to create `ui-base` (theme, site name, dark/light mode), `ui-page` (navigation entry, icon, layout), and `ui-group` (container for widgets, width, display order)
- **THEN** the skill SHALL specify that config nodes are created via `create-node` just like regular nodes, and their IDs are used as properties on child config nodes and widgets

### Requirement: Skill provides a complete widget catalog with brief descriptions
The skill SHALL list every available Dashboard 2.0 widget type with at minimum a one-line description of its purpose. The list SHALL cover at least: ui-button, ui-chart, ui-gauge, ui-slider, ui-table, ui-form, ui-dropdown, ui-text, ui-markdown, ui-switch, ui-notification, ui-template, ui-date-picker, ui-file-input, ui-iframe, ui-led, ui-map.

#### Scenario: LLM browses available widgets
- **WHEN** an LLM needs to know what widgets are available
- **THEN** the skill SHALL provide a summary table with the widget type string and a brief description for each
- **THEN** the skill SHALL instruct the LLM to use `get-palette-nodes` and `get-node-type-detail` to discover any additional widgets not listed in the catalog

### Requirement: Skill provides deep reference for the most-used widgets
The skill SHALL provide full property tables and wiring examples for the most commonly used widgets: ui-button, ui-chart, ui-gauge, ui-slider, ui-table, ui-form, ui-dropdown, ui-text, ui-switch, ui-notification.

#### Scenario: LLM creates a common widget
- **WHEN** an LLM needs to create a frequently used widget (e.g., ui-button, ui-chart)
- **THEN** the skill SHALL provide the type string, a table of key properties with types and descriptions, and a wiring example showing how data flows into and out of the widget

### Requirement: Skill covers wiring patterns for data flow
The skill SHALL document how data flows between Node-RED flows and dashboard widgets: data INTO widgets via `msg.payload` (for display/update) and data OUT of widgets via `msg.payload` (for user interactions like clicks, form submissions). It SHALL cover `msg.topic` for targeted updates to specific widgets on a page.

#### Scenario: LLM wires a sensor reading to a gauge
- **WHEN** an LLM needs to display a sensor value on a ui-gauge
- **THEN** the skill SHALL show that wiring an inject or function node to the ui-gauge's input will display `msg.payload` as the gauge value

#### Scenario: LLM handles a button click
- **WHEN** an LLM needs to trigger a flow from a ui-button press
- **THEN** the skill SHALL show that wiring the ui-button's output to a function or other node will receive the button's `msg.payload` when clicked

### Requirement: Skill provides common dashboard recipes
The skill SHALL include ready-to-use recipes for common dashboard patterns. Each recipe SHALL list the required nodes, key properties, and wiring calls. Recipes SHALL include at minimum: live chart from a data source, button-triggered action, form submission processing, and gauge monitoring a real-time value.

#### Scenario: LLM builds a dashboard recipe
- **WHEN** an LLM needs to build a common dashboard pattern (e.g., live chart)
- **THEN** the skill SHALL provide a step-by-step recipe with node types, property values, and `connect-nodes` calls

### Requirement: Skill includes references section with official documentation URL
The skill SHALL include a dedicated references section at the end of the body that lists the official documentation URL (https://dashboard.flowfuse.com/) and any other relevant resources.

#### Scenario: Implementer needs up-to-date widget data
- **WHEN** an implementer needs current property definitions for a widget
- **THEN** the skill SHALL direct them to the official documentation at https://dashboard.flowfuse.com/
