/**
 * Mermaid Builder
 *
 * Generates Mermaid flowchart TD diagrams from the intermediate representation.
 * Consolidates and enhances the existing `generateMermaidDiagram()` logic
 * from src/tools/get-flow-diagram.js with dirty highlighting support.
 *
 * @module renderer/mermaid-builder
 */

import { getMermaidClass } from './colors.js';

/**
 * Escape a string for use as a Mermaid node label.
 *
 * @param {string} label
 * @returns {string}
 */
function escapeMermaidLabel(label) {
  return `"${label.replace(/"/g, '#quot;')}"`;
}

/**
 * Build a Mermaid flowchart TD diagram string from the IR.
 *
 * @param {import('./ir-builder.js').IR} ir - Intermediate representation
 * @returns {string} Mermaid diagram string
 */
export function buildMermaid(ir) {
  const { nodes, groups, links } = ir;

  if (nodes.length === 0 && groups.length === 0) {
    return 'flowchart TD\n  %% Empty flow — no nodes to display';
  }

  const lines = ['flowchart TD'];
  const hasDirty = nodes.some((n) => n.dirty);
  const hasDisabled = nodes.some((n) => n.d);

  // Build member-to-group lookup
  const memberGroupMap = new Map();
  for (const g of groups) {
    for (const mid of g.nodes) {
      memberGroupMap.set(mid, g);
    }
  }

  // Identify grouped vs ungrouped nodes
  const groupedIds = new Set();
  for (const n of nodes) {
    if (memberGroupMap.has(n.id)) {
      groupedIds.add(n.id);
    }
  }
  const ungroupedIds = new Set(nodes.map((n) => n.id).filter((id) => !groupedIds.has(id)));

  const nodeIds = new Set(nodes.map((n) => n.id));

  // Render ungrouped nodes
  for (const node of nodes) {
    if (!ungroupedIds.has(node.id)) continue;
    const label = escapeMermaidLabel(node.name);
    const classTag = getMermaidClass(node);
    lines.push(`  ${node.id}[${label}]${classTag}`);
  }

  // Render groups as subgraphs
  for (const g of groups) {
    const gMembers = (g.nodes || []).filter((mid) => nodeIds.has(mid));
    const gLabel = escapeMermaidLabel(g.name || 'Group');
    lines.push(`  subgraph ${g.id}[${gLabel}]`);
    for (const mid of gMembers) {
      const member = nodes.find((n) => n.id === mid);
      if (!member) continue;
      const mLabel = escapeMermaidLabel(member.name);
      const mClass = getMermaidClass(member);
      lines.push(`    ${mid}[${mLabel}]${mClass}`);
    }
    lines.push('  end');
  }

  // Edge definitions
  for (const link of links) {
    const { source, sourcePort, target } = link;
    if (!nodeIds.has(target.id)) continue;
    const multiOutput = (source.outputs || 1) > 1;
    const edgeLabel = multiOutput ? `|out${sourcePort + 1}|` : '';
    lines.push(`  ${source.id} -->${edgeLabel} ${target.id}`);
  }

  // Class definitions
  if (hasDirty) {
    lines.push('  classDef dirty stroke:#ff8c00,stroke-width:3px');
  }
  if (hasDisabled) {
    lines.push('  classDef disabled stroke-dasharray:5 5,stroke:#999,color:#999');
  }

  return lines.join('\n');
}
