## Context

The MCP skill system currently has 12 skills covering Node-RED fundamentals, node reference, patterns, subflows, flow building, layout, and expression languages (JSONata, Mustache). There is zero coverage of UI/dashboard capabilities. Two actively maintained packages fill this gap: **@flowfuse/node-red-dashboard** (Dashboard 2.0) and **node-red-contrib-uibuilder**. They serve different use cases with fundamentally different architectures — widget-based vs. bridge-based. This design covers creating two new skills and updating `nodered-patterns` with a UI selection guide.

Current state: `src/skills/loader.js` auto-discovers skills from `.github/skills/*/SKILL.md`. No code changes needed — only new SKILL.md files and spec updates.

## Goals / Non-Goals

**Goals:**
- Provide an LLM with a complete widget catalog and wiring patterns for Dashboard 2.0
- Provide an LLM with the bridge architecture and communication protocol for uibuilder
- Help the LLM choose the right tool for the user's use case via a comparison table in `nodered-patterns`
- Include official documentation URLs so implementers use up-to-date data
- Follow existing skill patterns (YAML frontmatter, Markdown body, tool list, prerequisites)

**Non-Goals:**
- Create new MCP tools (no code changes to `src/tools/`)
- Modify the skill loader (auto-discovery handles new skills)
- Provide a comprehensive frontend development tutorial for uibuilder (link to official docs)
- Cover the obsolete `node-red-dashboard` v1 package
- Create Node-RED flow JSON import examples for these skills (future enhancement)

## Decisions

### Decision 1: Two separate skills, not one combined "UI" skill

**Rationale:** The two packages have fundamentally different architectures. Dashboard 2.0 is widget-based (each UI element is a Node-RED node, wired on the canvas). Uibuilder is bridge-based (one Node-RED node connects to a full web app on the filesystem). Combining them would create cognitive overload for the LLM and confuse the distinct usage patterns.

**Alternatives considered:**
- Combined "nodered-ui" skill → rejected: too large, mixed concerns, harder to maintain
- Dashboard 2.0 only → rejected: uibuilder serves a different, equally important use case

### Decision 2: Skill naming uses library names

**Rationale:** The user explicitly requested this. `flowfuse-dashboard` distinguishes from the obsolete `node-red-dashboard`. `nodered-uibuilder` matches the npm package's unique identifier. This is consistent with how `jsonata` and `mustache` are named after their languages, not after Node-RED node types.

### Decision 3: Widget catalog — brief list + deep reference for top ~10

**Rationale:** Dashboard 2.0 has ~20 widget types. Enumerating all with full property tables would bloat the skill and make it hard to maintain. Instead:
- A summary table lists ALL widget types with a 1-line description
- The ~10 most commonly used widgets (button, chart, gauge, slider, table, form, dropdown, text, switch, notification) get full property tables with wiring examples
- For the rest, the skill instructs the LLM to use `get-node-type-detail` and `get-palette-nodes` for property discovery

**Alternatives considered:**
- Full deep reference for all 20 widgets → rejected: maintenance burden, skill too long
- No deep reference, discovery-only → rejected: common widgets need quick, reliable guidance

### Decision 4: uibuilder skill focuses on the bridge layer

**Rationale:** Uibuilder's frontend is a separate web application that can use any framework. Providing full frontend tutorials is out of scope. The skill will:
- Explain the architecture and communication protocol in detail
- Provide minimal, framework-agnostic JavaScript snippets for the bridge (`uibuilder.onChange('msg', ...)`)
- Link to official docs for Vue/React/Svelte integration guides
- Include Node-RED-side wiring patterns

**Alternatives considered:**
- Full Vue/React/Svelte tutorials → rejected: out of scope, rapidly changing, better served by official docs
- No framework mention at all → rejected: LLM needs to know frameworks are supported

### Decision 5: Cross-reference lives in `nodered-patterns`

**Rationale:** The user explicitly requested this. A "Dashboard / UI Patterns" section with a comparison table helps the LLM guide users. Each dashboard skill also includes a "When to Use" section, but the canonical comparison lives in `nodered-patterns` as the central pattern reference.

### Decision 6: Documentation URLs embedded in skill frontmatter and body

**Rationale:** The user explicitly requested URLs so implementers can consult up-to-date documentation. Each skill will include:
- A "Documentation" line in the YAML frontmatter description referencing the official URL
- A "References" section at the bottom of the skill body with the full URL

### Decision 7: Document the npm package version at time of writing

**Rationale:** The user requested recording the current version so future maintainers can assess skill staleness. Each skill's YAML frontmatter SHALL include a `version` field with the npm package version at the time the skill was authored:
- `@flowfuse/node-red-dashboard` → `1.30.2`
- `node-red-contrib-uibuilder` → `7.7.3`

Additionally, each skill body SHALL mention the documented version in its introductory section so the LLM can communicate version context to users. The version serves as a snapshot reference — if the current npm version differs significantly, the skill content may need review. This is consistent with how `jsonata` documents its version (v2.2.0) and `mustache` documents its version (v1.3.0).

## Risks / Trade-offs

- **Widget catalog drift**: Dashboard 2.0 widgets may add/remove properties between releases → Mitigation: teach LLM to use `get-node-type-detail` for any widget not in the deep-reference list; link to official docs
- **uibuilder `msg._ui` protocol changes**: The protocol may evolve → Mitigation: link to official docs; the skill documents the stable core patterns
- **Duplication between skills**: Both skills include "When to Use" guidance → Mitigation: `nodered-patterns` has the authoritative comparison table; individual skills have brief orientation sections
- **Skill size**: `flowfuse-dashboard` will be the largest skill due to widget catalog → Mitigation: accepted trade-off; the structured table format keeps it navigable

## Open Questions

None — all design questions were resolved during exploration with the user.
