## 1. Research & documentation review

- [x] 1.1 Read official Dashboard 2.0 docs at https://dashboard.flowfuse.com/ to get the complete widget list and up-to-date properties for the top ~10 widgets. **Target version: @flowfuse/node-red-dashboard v1.30.2**
- [x] 1.2 Read official uibuilder docs at https://totallyinformation.github.io/node-red-contrib-uibuilder/ to get up-to-date `msg._ui` protocol details and `uibuilder.onChange`/`uibuilder.send` API signatures. **Target version: node-red-contrib-uibuilder v7.7.3**

## 2. Create flowfuse-dashboard skill

- [x] 2.1 Create `.github/skills/flowfuse-dashboard/SKILL.md` with YAML frontmatter (name, version: "1.30.2", description with docs URL, tools list) and a "Concepts & Architecture" section explaining Dashboard 2.0 vs obsolete v1, widget-based model, the documented version, and staging/deploy reminder
- [x] 2.2 Add "Config Nodes" section documenting ui-base, ui-page, ui-group with their key properties and the required creation order (base → page → group → widgets)
- [x] 2.3 Add "Widget Catalog" section with a summary table listing ALL widget types (ui-button, ui-chart, ui-gauge, ui-slider, ui-table, ui-form, ui-dropdown, ui-text, ui-markdown, ui-switch, ui-notification, ui-template, ui-date-picker, ui-file-input, ui-iframe, ui-led, ui-map, plus any others found in docs) with one-line descriptions
- [x] 2.4 Add deep-reference property tables and wiring examples for the top 10 most-used widgets (ui-button, ui-chart, ui-gauge, ui-slider, ui-table, ui-form, ui-dropdown, ui-text, ui-switch, ui-notification)
- [x] 2.5 Add "Wiring Patterns" section documenting data INTO widgets (msg.payload → display), data OUT of widgets (clicks/forms → flows), and msg.topic for targeted updates
- [x] 2.6 Add "Recipes" section with step-by-step recipes for: live chart from a data source, button-triggered action, form submission processing, gauge monitoring a real-time value
- [x] 2.7 Add "References" section listing the official documentation URL https://dashboard.flowfuse.com/

## 3. Create nodered-uibuilder skill

- [x] 3.1 Create `.github/skills/nodered-uibuilder/SKILL.md` with YAML frontmatter (name, version: "7.7.3", description with docs URL, tools list) and an "Architecture" section with ASCII diagram showing the single-node bridge model: NR flow ↔ uibuilder node ↔ Socket.IO ↔ frontend app on filesystem. Mention the documented version in the introductory section.
- [x] 3.2 Add "Setup & Configuration" section covering `install-node("node-red-contrib-uibuilder")`, `create-node(type: "uibuilder", ...)`, and key properties (url, name)
- [x] 3.3 Add "Communication Patterns" section documenting NR → frontend via `msg._ui` protocol (addToDom, update, remove, notify, navigate methods with required fields)
- [x] 3.4 Add documentation for frontend → NR communication: `uibuilder.onChange('msg', callback)` and `uibuilder.send()` patterns, with minimal vanilla JS snippets
- [x] 3.5 Add "Framework Integration" section with minimal connection snippets for vanilla JS, Vue, React, and Svelte, linking to official docs for full guides
- [x] 3.6 Add "Recipes" section with: real-time data display, form submission to NR and response back to frontend, NR as WebSocket relay
- [x] 3.7 Add "References" section listing the official documentation URL https://totallyinformation.github.io/node-red-contrib-uibuilder/

## 4. Update nodered-patterns skill

- [x] 4.1 Add "Dashboard / UI Patterns" section to `.github/skills/nodered-patterns/SKILL.md` with an introduction explaining the two recommended UI approaches
- [x] 4.2 Add comparison table with criteria: effort, flexibility, real-time updates, custom styling, learning curve, best-for use case
- [x] 4.3 Add cross-references instructing the LLM to consult `flowfuse-dashboard` and `nodered-uibuilder` skills for detailed guidance

## 5. Update OpenSpec specs

- [x] 5.1 Create `openspec/specs/skill-flowfuse-dashboard/spec.md` with the requirements from the change specs (if not already present; verify against change specs)
- [x] 5.2 Create `openspec/specs/skill-nodered-uibuilder/spec.md` with the requirements from the change specs
- [x] 5.3 Update `openspec/specs/skill-nodered-patterns/spec.md` with the new ADDED requirements from the change delta spec

## 6. Verification

- [x] 6.1 Verify both new SKILL.md files have valid YAML frontmatter that parses correctly (name, version, description, tools fields) and that the version field matches the target npm version
- [x] 6.2 Verify `src/skills/loader.js` auto-discovers both new skills without errors
- [x] 6.3 Verify the updated `nodered-patterns/SKILL.md` still loads correctly with the new section
- [x] 6.4 Spot-check that documentation URLs in skills resolve correctly
