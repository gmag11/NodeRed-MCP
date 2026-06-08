/**
 * SVG Builder
 *
 * Generates server-side SVG strings from the intermediate representation.
 * Produces a static SVG suitable for embedding in chat responses.
 *
 * @module renderer/svg-builder
 */

import { generateLinkPath } from './geometry.js';
import { computeBoundingBox, calculateViewBox } from './layout.js';
import {
  getNodeColor,
  getNodeStyle,
  DEFAULT_COLOR,
  DISABLED_STYLE,
} from './colors.js';

/**
 * Build an SVG string from the intermediate representation.
 *
 * @param {import('./ir-builder.js').IR} ir - Intermediate representation
 * @returns {string} Complete SVG document as a string
 */
export function buildSVG(ir) {
  const { nodes, groups, links } = ir;
  const { viewBox, width, height } = calculateViewBox(nodes, groups);
  const hasDirtyNodes = nodes.some((n) => n.dirty);

  const parts = [];

  // SVG header
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">`
  );

  // Defs
  parts.push('  <defs>');
  parts.push(
    `    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">`
  );
  parts.push(
    `      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>`
  );
  parts.push(`    </pattern>`);
  parts.push('  </defs>');

  // Grid background
  parts.push(
    `  <rect width="100%" height="100%" fill="url(#grid)" class="nr-grid"/>`
  );

  // Groups layer
  for (const g of groups) {
    parts.push(...buildGroupSVG(g));
  }

  // Links layer
  for (const link of links) {
    parts.push(...buildLinkSVG(link));
  }

  // Nodes layer
  for (const node of nodes) {
    parts.push(...buildNodeSVG(node));
  }

  // Legend for dirty highlighting
  if (hasDirtyNodes) {
    parts.push(...buildLegend(nodes));
  }

  // SVG footer
  parts.push('</svg>');

  return parts.join('\n');
}

/**
 * Build SVG elements for a group.
 *
 * @param {import('./ir-builder.js').IRGroup} g - Group
 * @returns {string[]} SVG lines
 */
function buildGroupSVG(g) {
  const lines = [];
  const label = escapeXml(g.name);
  const fillColor = g.style?.fill || 'none';
  const strokeColor = g.style?.stroke || '#999';
  const strokeOpacity = g.style?.['stroke-opacity'] ?? 0.5;

  lines.push(
    `  <g class="nr-group" id="${g.id}">`
  );
  lines.push(
    `    <rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="4" ry="4" fill="${fillColor}" fill-opacity="${g.style?.['fill-opacity'] ?? 0.1}" stroke="${strokeColor}" stroke-opacity="${strokeOpacity}" stroke-dasharray="5,3"/>`
  );
  lines.push(
    `    <text x="${g.x + 5}" y="${g.y + 15}" font-size="10" fill="${g.style?.color || '#999'}" font-family="sans-serif">${label}</text>`
  );
  lines.push(`  </g>`);
  return lines;
}

/**
 * Build SVG elements for a wire/link.
 *
 * @param {import('./ir-builder.js').IRLink} link - Link
 * @returns {string[]} SVG lines
 */
function buildLinkSVG(link) {
  const { source, sourcePort, target } = link;

  // Calculate port Y positions
  const numOutputs = source.outputs || 1;
  const portY = -((numOutputs - 1) / 2) * 13 + 13 * sourcePort;

  const x1 = source.x + source.w / 2;
  const y1 = source.y + portY;
  const x2 = target.x - target.w / 2;
  const y2 = target.y;

  const pathD = generateLinkPath(x1, y1, x2, y2, 1);

  return [
    `  <path class="nr-link" d="${pathD}" fill="none" stroke="#999" stroke-width="1.5"/>`,
  ];
}

/**
 * Build SVG elements for a node.
 *
 * @param {import('./ir-builder.js').IRNode} node - Node
 * @returns {string[]} SVG lines
 */
function buildNodeSVG(node) {
  const lines = [];
  const color = getNodeColor(node.type);
  const style = getNodeStyle(node, color);
  const label = escapeXml(truncateLabel(node.name, 15));
  const x = node.x - node.w / 2;
  const y = node.y - node.h / 2;

  lines.push(`  <g class="nr-node-group" id="${node.id}">`);

  // Main node rectangle
  lines.push(
    `    <rect class="nr-node" x="${x}" y="${y}" width="${node.w}" height="${node.h}" rx="5" ry="5" style="${style}"/>`
  );

  // Dirty highlight overlay
  if (node.dirty) {
    lines.push(
      `    <rect class="nr-node-dirty-glow" x="${x - 2}" y="${y - 2}" width="${node.w + 4}" height="${node.h + 4}" rx="6" ry="6" fill="none" stroke="#ff8c00" stroke-width="2.5"/>`
    );
  }

  // Node label
  lines.push(
    `    <text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-size="10" fill="#333" font-family="sans-serif">${label}</text>`
  );

  // Input port indicator
  if (node.inputs > 0) {
    lines.push(
      `    <rect class="nr-port" x="${x - 4}" y="${y + node.h / 2 - 4}" width="8" height="8" rx="2" fill="#999"/>`
    );
  }

  // Output port indicators
  const numOutputs = node.outputs || 0;
  for (let i = 0; i < numOutputs; i++) {
    const portY = y + node.h / 2 - ((numOutputs - 1) / 2) * 13 + 13 * i - 4;
    lines.push(
      `    <rect class="nr-port" x="${x + node.w - 4}" y="${portY}" width="8" height="8" rx="2" fill="#999"/>`
    );
  }

  lines.push(`  </g>`);
  return lines;
}

/**
 * Build a legend explaining the dirty highlight.
 *
 * @param {import('./ir-builder.js').IRNode[]} nodes - All nodes (to find bounding box top-right)
 * @returns {string[]} SVG lines
 */
function buildLegend(nodes) {
  const bb = computeBoundingBox(nodes);
  const legendX = bb.maxX - 180;
  const legendY = bb.minY + 10;

  return [
    `  <g class="nr-legend" transform="translate(${legendX}, ${legendY})">`,
    `    <rect x="0" y="0" width="170" height="28" rx="4" fill="white" fill-opacity="0.9" stroke="#ccc"/>`,
    `    <rect x="8" y="8" width="16" height="12" rx="2" fill="${DEFAULT_COLOR}" stroke="#ff8c00" stroke-width="2"/>`,
    `    <text x="30" y="18" font-size="10" fill="#666" font-family="sans-serif">= Un-deployed changes</text>`,
    `  </g>`,
  ];
}

/**
 * Escape a string for safe inclusion in XML/SVG.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncate a label to a maximum length, adding ellipsis if needed.
 *
 * @param {string} label
 * @param {number} maxLen
 * @returns {string}
 */
function truncateLabel(label, maxLen) {
  if (label.length <= maxLen) return label;
  return label.substring(0, maxLen - 1) + '…';
}
