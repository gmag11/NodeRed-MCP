/**
 * Wire Geometry — Bezier Path Generation
 *
 * Ported from Node-RED's view.js `generateLinkPath()` function
 * (Apache 2.0 license, Copyright JS Foundation and other contributors).
 *
 * Generates SVG path `d` attribute strings for cubic Bézier curves
 * connecting two nodes, matching Node-RED's visual wire style.
 *
 * @module renderer/geometry
 */

// Constants matching Node-RED view.js
const NODE_WIDTH = 100;
const NODE_HEIGHT = 30;
const LINE_CURVE_SCALE = 0.75;

/**
 * Generate an SVG path `d` string for a cubic Bézier wire between two nodes.
 *
 * Adapted from Node-RED's `generateLinkPath()` in
 * packages/node_modules/@node-red/editor-client/src/js/ui/view.js
 *
 * @param {number} origX - Source node right-edge X
 * @param {number} origY - Source port Y
 * @param {number} destX - Target node left-edge X
 * @param {number} destY - Target port Y
 * @param {number} sc - Direction: 1 for left→right, -1 for right→left
 * @param {boolean} [hasStatus=false] - Whether the source/target node has status (adds vertical offset)
 * @returns {string} SVG path `d` attribute
 */
export function generateLinkPath(origX, origY, destX, destY, sc, hasStatus = false) {
  const dy = destY - origY;
  const dx = destX - origX;
  const delta = Math.sqrt(dy * dy + dx * dx);
  let scale = LINE_CURVE_SCALE;
  let scaleY = 0;

  if (dx * sc > 0) {
    if (delta < NODE_WIDTH) {
      scale = 0.75 - 0.75 * ((NODE_WIDTH - delta) / NODE_WIDTH);
    }
  } else {
    scale = 0.4 - 0.2 * (Math.max(0, (NODE_WIDTH - Math.min(Math.abs(dx), Math.abs(dy))) / NODE_WIDTH));
  }

  if (dx * sc > 0) {
    // Horizontal connection: smooth S-curve
    const cp = [
      [origX + sc * (NODE_WIDTH * scale), origY + scaleY * NODE_HEIGHT],
      [destX - sc * scale * NODE_WIDTH, destY - scaleY * NODE_HEIGHT],
    ];
    return `M ${origX} ${origY} C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${destX} ${destY}`;
  }

  // Vertical or reversed connection: L-shaped with rounded corners
  const midX = Math.floor(destX - dx / 2);
  const midY = Math.floor(destY - dy / 2);

  if (Math.abs(dy) < 10) {
    // Nearly horizontal: draw below nodes
    const bottomY = Math.max(origY, destY) + (hasStatus ? 35 : 25);
    const startCurveHeight = bottomY - origY;
    const endCurveHeight = bottomY - destY;

    const cp = [
      [origX + sc * 15, origY],
      [origX + sc * 25, origY + 5],
      [origX + sc * 25, origY + startCurveHeight / 2],
      [origX + sc * 25, origY + startCurveHeight - 5],
      [origX + sc * 15, origY + startCurveHeight],
      [origX, origY + startCurveHeight],
      [destX - sc * 15, origY + startCurveHeight],
      [destX - sc * 25, origY + startCurveHeight - 5],
      [destX - sc * 25, destY + endCurveHeight / 2],
      [destX - sc * 25, destY + 5],
      [destX - sc * 15, destY],
      [destX, destY],
    ];

    return (
      `M ${origX} ${origY}` +
      ` C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${cp[2][0]} ${cp[2][1]}` +
      ` C ${cp[3][0]} ${cp[3][1]} ${cp[4][0]} ${cp[4][1]} ${cp[5][0]} ${cp[5][1]}` +
      ` h ${dx}` +
      ` C ${cp[6][0]} ${cp[6][1]} ${cp[7][0]} ${cp[7][1]} ${cp[8][0]} ${cp[8][1]}` +
      ` C ${cp[9][0]} ${cp[9][1]} ${cp[10][0]} ${cp[10][1]} ${cp[11][0]} ${cp[11][1]}`
    );
  }

  // Vertical stack: L-shaped path
  const cpHeight = NODE_HEIGHT / 2;
  const y1 = (destY + midY) / 2;
  const topX = origX + sc * NODE_WIDTH * scale;
  const topY = dy > 0 ? Math.min(y1 - dy / 2, origY + cpHeight) : Math.max(y1 - dy / 2, origY - cpHeight);
  const bottomX = destX - sc * NODE_WIDTH * scale;
  const bottomY = dy > 0 ? Math.max(y1, destY - cpHeight) : Math.min(y1, destY + cpHeight);
  const x1 = (origX + topX) / 2;

  const cp = [
    [x1, origY],
    [topX, dy > 0 ? Math.max(origY, topY - cpHeight) : Math.min(origY, topY + cpHeight)],
    [x1, dy > 0 ? Math.min(midY, topY + cpHeight) : Math.max(midY, topY - cpHeight)],
    [bottomX, dy > 0 ? Math.max(midY, bottomY - cpHeight) : Math.min(midY, bottomY + cpHeight)],
    [(destX + bottomX) / 2, destY],
  ];

  return (
    `M ${origX} ${origY}` +
    ` C ${cp[0][0]} ${cp[0][1]} ${cp[1][0]} ${cp[1][1]} ${topX} ${topY}` +
    ` S ${cp[2][0]} ${cp[2][1]} ${midX} ${midY}` +
    ` S ${cp[3][0]} ${cp[3][1]} ${bottomX} ${bottomY}` +
    ` S ${cp[4][0]} ${cp[4][1]} ${destX} ${destY}`
  );
}
