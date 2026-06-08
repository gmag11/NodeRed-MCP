/**
 * Layout Utilities
 *
 * Computes bounding boxes, auto-fit viewport dimensions, and scale factors
 * for rendering the staging workspace.
 *
 * @module renderer/layout
 */

/**
 * Default canvas dimensions (matching Node-RED's virtual canvas).
 */
const CANVAS_WIDTH = 8000;
const CANVAS_HEIGHT = 8000;

/**
 * Default viewport padding around nodes (in workspace units).
 */
const VIEWPORT_PADDING = 60;

/**
 * Compute the bounding box of a set of nodes and groups.
 *
 * @param {import('./ir-builder.js').IRNode[]} nodes - Flow nodes
 * @param {import('./ir-builder.js').IRGroup[]} groups - Group nodes
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function computeBoundingBox(nodes, groups = []) {
  if (nodes.length === 0 && groups.length === 0) {
    return { minX: 0, minY: 0, maxX: 400, maxY: 200, width: 400, height: 200 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const left = node.x - node.w / 2;
    const right = node.x + node.w / 2;
    const top = node.y - node.h / 2;
    const bottom = node.y + node.h / 2;

    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;
  }

  // Include group boundaries
  for (const group of groups) {
    if (group.x < minX) minX = group.x;
    if (group.y < minY) minY = group.y;
    if (group.x + group.w > maxX) maxX = group.x + group.w;
    if (group.y + group.h > maxY) maxY = group.y + group.h;
  }

  // Add padding
  minX -= VIEWPORT_PADDING;
  minY -= VIEWPORT_PADDING;
  maxX += VIEWPORT_PADDING;
  maxY += VIEWPORT_PADDING;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate the scale factor to fit content within a viewport.
 *
 * @param {number} contentWidth - Width of content in workspace units
 * @param {number} contentHeight - Height of content in workspace units
 * @param {number} viewportWidth - Available viewport width in pixels
 * @param {number} viewportHeight - Available viewport height in pixels
 * @param {number} [maxScale=1.5] - Maximum allowed scale factor
 * @param {number} [minScale=0.1] - Minimum allowed scale factor
 * @returns {number} Scale factor (1.0 = 100%)
 */
export function calculateScaleFactor(
  contentWidth,
  contentHeight,
  viewportWidth,
  viewportHeight,
  maxScale = 1.5,
  minScale = 0.1
) {
  if (contentWidth <= 0 || contentHeight <= 0) return 1;

  const scaleX = viewportWidth / contentWidth;
  const scaleY = viewportHeight / contentHeight;
  const fitScale = Math.min(scaleX, scaleY);

  return Math.max(minScale, Math.min(maxScale, fitScale));
}

/**
 * Calculate the SVG viewBox string to fit the content within the given dimensions.
 *
 * @param {import('./ir-builder.js').IRNode[]} nodes - Flow nodes
 * @param {import('./ir-builder.js').IRGroup[]} groups - Group nodes
 * @param {number} [targetWidth=800] - Target SVG width
 * @param {number} [targetHeight=600] - Target SVG height
 * @returns {{ viewBox: string, width: number, height: number }}
 */
export function calculateViewBox(nodes, groups = [], targetWidth = 800, targetHeight = 600) {
  const bb = computeBoundingBox(nodes, groups);
  const scale = calculateScaleFactor(bb.width, bb.height, targetWidth, targetHeight);

  // Apply scale to get actual SVG dimensions
  const svgWidth = Math.max(targetWidth, Math.ceil(bb.width * scale));
  const svgHeight = Math.max(targetHeight, Math.ceil(bb.height * scale));

  return {
    viewBox: `${bb.minX} ${bb.minY} ${bb.width} ${bb.height}`,
    width: svgWidth,
    height: svgHeight,
  };
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, VIEWPORT_PADDING };
