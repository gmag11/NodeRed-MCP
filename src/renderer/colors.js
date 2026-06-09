/**
 * Color and Style Mapping
 *
 * Maps Node-RED node types to their standard fill colors and defines
 * dirty/disabled highlighting styles for all output formats.
 *
 * Color values match Node-RED's editor palette (view.js / flow.scss).
 *
 * @module renderer/colors
 */

/**
 * Map of Node-RED core node types to their fill colors.
 * Colors sourced from Node-RED's editor palette definitions.
 */
const NODE_COLORS = {
  // Common
  'inject': '#a6bbcf',
  'debug': '#87a980',
  'complete': '#c0c0c0',
  'catch': '#c0c0c0',
  'status': '#c0c0c0',
  'comment': '#ffffff',
  'unknown': '#c0c0c0',

  // Function
  'function': '#fdd0a2',
  'switch': '#d8bfd8',
  'change': '#e2d6b8',
  'range': '#d8bfd8',
  'template': '#d8bfd8',
  'delay': '#fdd0a2',
  'trigger': '#fdd0a2',
  'exec': '#fdd0a2',
  'rbe': '#fdd0a2',

  // Network
  'mqtt in': '#d8bfd8',
  'mqtt out': '#d8bfd8',
  'http in': '#d8bfd8',
  'http response': '#d8bfd8',
  'http request': '#e2d6b8',
  'websocket in': '#d8bfd8',
  'websocket out': '#d8bfd8',
  'tcp in': '#d8bfd8',
  'tcp out': '#d8bfd8',
  'tcp request': '#e2d6b8',
  'udp in': '#d8bfd8',
  'udp out': '#d8bfd8',

  // Sequence
  'split': '#d8bfd8',
  'join': '#d8bfd8',
  'batch': '#d8bfd8',
  'sort': '#d8bfd8',

  // Parser
  'csv': '#d8bfd8',
  'html': '#d8bfd8',
  'json': '#d8bfd8',
  'xml': '#d8bfd8',
  'yaml': '#d8bfd8',

  // Storage
  'file in': '#87a980',
  'file out': '#87a980',
  'file': '#87a980',
  'watch': '#87a980',

  // Dashboard (common widgets)
  'ui_button': '#d8bfd8',
  'ui_text': '#d8bfd8',
  'ui_gauge': '#d8bfd8',
  'ui_chart': '#d8bfd8',

  // Link
  'link in': '#c0c0c0',
  'link out': '#c0c0c0',
  'link call': '#c0c0c0',
};

/**
 * Default fallback color for unknown/custom node types.
 */
const DEFAULT_COLOR = '#cccccc';

/**
 * Dirty highlight style definitions for each format.
 */
const DIRTY_STYLES = {
  /** SVG stroke style for dirty nodes */
  svg: 'stroke:#ff8c00;stroke-width:2.5;stroke-dasharray:none;',
  /** HTML CSS class content for dirty nodes */
  html: 'filter: drop-shadow(0 0 4px #ff8c00);',
  /** Mermaid classDef for dirty nodes */
  mermaid: 'classDef dirty stroke:#ff8c00,stroke-width:3px',
};

/**
 * Disabled node style definitions for SVG.
 */
const DISABLED_STYLE = 'stroke-dasharray:5,5;opacity:0.5;';

/**
 * Get the fill color for a node type.
 *
 * @param {string} type - Node type string (e.g., 'inject', 'function')
 * @returns {string} CSS color value
 */
export function getNodeColor(type) {
  return NODE_COLORS[type] || DEFAULT_COLOR;
}

/**
 * Get the SVG style attributes for a node including dirty/disabled state.
 *
 * @param {object} node - IR node with dirty/d properties
 * @param {string} baseColor - Fill color for the node
 * @returns {string} SVG style attribute string
 */
export function getNodeStyle(node, baseColor) {
  const parts = [`fill:${baseColor}`];

  if (node.dirty) {
    parts.push(DIRTY_STYLES.svg);
  }

  if (node.d) {
    parts.push(DISABLED_STYLE);
  }

  return parts.join(';');
}

/**
 * Get the HTML CSS class string for a node.
 *
 * @param {object} node - IR node with dirty/d properties
 * @returns {string} CSS class string
 */
export function getNodeCSSClass(node) {
  const classes = ['nr-node'];
  if (node.dirty) classes.push('nr-node-dirty');
  if (node.d) classes.push('nr-node-disabled');
  return classes.join(' ');
}

/**
 * Get the Mermaid class suffix for a node.
 *
 * @param {object} node - IR node with dirty/d properties
 * @returns {string} Mermaid class suffix (e.g., ':::dirty:::disabled')
 */
export function getMermaidClass(node) {
  const parts = [];
  if (node.dirty) parts.push('dirty');
  if (node.d) parts.push('disabled');
  return parts.length > 0 ? ':::' + parts.join(':::') : '';
}

export { NODE_COLORS, DEFAULT_COLOR, DIRTY_STYLES, DISABLED_STYLE };
