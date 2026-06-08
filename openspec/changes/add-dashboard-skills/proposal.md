## Why

Node-RED users have two actively maintained options for building user interfaces and dashboards: **@flowfuse/node-red-dashboard** (Dashboard 2.0, the officially recommended widget-based dashboard) and **node-red-contrib-uibuilder** (a versatile bridge for custom web frontends). Both are widely used but the MCP skill system currently has zero guidance for either. An LLM asked to build a dashboard or UI in Node-RED has no reference for widget types, wiring patterns, or communication models. Adding these two skills will enable the AI to correctly build both simple dashboards and complex custom UIs, and to guide users toward the right tool for their use case.

## What Changes

- Create a new skill file at `.github/skills/flowfuse-dashboard/SKILL.md` covering Dashboard 2.0 architecture, config nodes (ui-base, ui-page, ui-group), a widget catalog with brief descriptions (deep property tables for the most-used widgets), wiring patterns, and common recipes. **Documented version: @flowfuse/node-red-dashboard v1.30.2**
- Create a new skill file at `.github/skills/nodered-uibuilder/SKILL.md` covering the single-node bridge architecture, filesystem-based frontend structure, Socket.IO bidirectional messaging protocol (`msg._ui`), framework integration pointers (vanilla JS, Vue, React, Svelte), and common recipes. **Documented version: node-red-contrib-uibuilder v7.7.3**
- Update `.github/skills/nodered-patterns/SKILL.md` with a new "Dashboard / UI Patterns" section that includes a comparison table helping users choose between Dashboard 2.0 and uibuilder based on their needs
- Each skill includes links to official documentation so implementers can use up-to-date data
- Each skill records the npm package version at time of writing, so future maintainers can assess how many versions have passed and whether the documented API is still current

## Capabilities

### New Capabilities

- `skill-flowfuse-dashboard`: Reference skill for @flowfuse/node-red-dashboard (Dashboard 2.0, documented at v1.30.2). Covers config node hierarchy (ui-base → ui-page → ui-group), widget catalog with descriptions (deep reference for the ~10 most-used widgets), data-flow wiring patterns, and dashboard recipes. Includes official docs link: https://dashboard.flowfuse.com/
- `skill-nodered-uibuilder`: Architecture and communication patterns skill for node-red-contrib-uibuilder (documented at v7.7.3). Covers the single-node bridge model, filesystem frontend structure, Socket.IO bidirectional messaging, framework integration patterns, and common recipes. Includes official docs link: https://totallyinformation.github.io/node-red-contrib-uibuilder/

### Modified Capabilities

- `skill-nodered-patterns`: Add a "Dashboard / UI Patterns" section with a comparison table (Dashboard 2.0 vs uibuilder) to help the LLM guide users toward the right UI tool for their specific use case

## Impact

- New files:
  - `.github/skills/flowfuse-dashboard/SKILL.md`
  - `.github/skills/nodered-uibuilder/SKILL.md`
- New specs:
  - `openspec/specs/skill-flowfuse-dashboard/spec.md`
  - `openspec/specs/skill-nodered-uibuilder/spec.md`
- Modified files:
  - `.github/skills/nodered-patterns/SKILL.md` (new section appended)
- Modified specs (delta):
  - `openspec/specs/skill-nodered-patterns/spec.md` (new requirements for UI section)
- Affected system: `src/skills/loader.js` (skill auto-discovery, no code changes needed — it scans `.github/skills/*/SKILL.md` automatically)
- Dependencies:
  - @flowfuse/node-red-dashboard documentation: https://dashboard.flowfuse.com/
  - node-red-contrib-uibuilder documentation: https://totallyinformation.github.io/node-red-contrib-uibuilder/
