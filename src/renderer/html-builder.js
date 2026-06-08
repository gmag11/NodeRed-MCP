/**
 * HTML Builder
 *
 * Generates a self-contained HTML document with D3.js rendering,
 * WebSocket live refresh, zoom/pan, hover tooltips, and dirty highlighting.
 *
 * @module renderer/html-builder
 */

import { getNodeColor, getNodeCSSClass } from './colors.js';
import { computeBoundingBox } from './layout.js';

/**
 * Build a self-contained HTML document string that renders the staging workspace.
 *
 * @param {import('./ir-builder.js').IR} ir - Intermediate representation
 * @returns {string} Complete HTML document
 */
export function buildHTML(ir) {
  const { nodes, groups, links } = ir;
  const bb = computeBoundingBox(nodes, groups);
  const flowsData = JSON.stringify({ nodes, groups, links, bb });

  // Determine WebSocket URL — use current page's host
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Node-RED Staging Preview</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<!-- If CDN unavailable, comment the line above and uncomment below:
<script src="./d3.v7.min.js"></script> -->
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #canvas { width: 100vw; height: 100vh; cursor: grab; }
  #canvas:active { cursor: grabbing; }
  #banner {
    display: none; position: fixed; top: 0; left: 0; right: 0;
    background: #fff3cd; color: #856404; text-align: center;
    padding: 6px 12px; font-size: 13px; z-index: 1000;
    border-bottom: 1px solid #ffc107;
  }
  #banner.visible { display: block; }
  .nr-node { cursor: pointer; transition: filter 0.2s; }
  .nr-node:hover { filter: brightness(1.1); }
  .nr-node-dirty .nr-node-body { stroke: #ff8c00; stroke-width: 2.5; }
  .nr-node-disabled .nr-node-body { stroke-dasharray: 5 5; opacity: 0.5; }
  .nr-link { fill: none; stroke: #999; stroke-width: 1.5; }
  .nr-link-disabled { stroke: #ccc; stroke-dasharray: 4 2; }
  .nr-group-rect { fill: none; stroke: #999; stroke-dasharray: 5 3; stroke-opacity: 0.5; }
  .nr-tooltip {
    position: fixed; pointer-events: none; z-index: 999;
    background: rgba(0,0,0,0.85); color: #fff; padding: 8px 12px;
    border-radius: 6px; font-size: 12px; line-height: 1.5;
    max-width: 260px; white-space: normal;
  }
  .nr-tooltip .tt-name { font-weight: bold; font-size: 13px; }
  .nr-tooltip .tt-dirty { color: #ff8c00; }
  .nr-legend {
    position: fixed; bottom: 12px; left: 12px; z-index: 500;
    background: rgba(255,255,255,0.9); border: 1px solid #ccc;
    border-radius: 6px; padding: 6px 12px; font-size: 11px; color: #666;
  }
</style>
</head>
<body>
<div id="banner">⚠️ Disconnected — retrying…</div>
<div id="canvas"></div>
<div class="nr-legend" id="legend" style="display:none">🟠 Orange border = Un-deployed changes</div>
<svg id="svg-root" style="display:none"></svg>
<div class="nr-tooltip" id="tooltip" style="display:none"></div>

<script>
// Embedded flow data for initial render
const INITIAL_DATA = ${flowsData};

(function() {
  const banner = document.getElementById('banner');
  const tooltip = document.getElementById('tooltip');
  const legend = document.getElementById('legend');
  const canvas = document.getElementById('canvas');

  // ── D3 Setup ──
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const svg = d3.select('#canvas')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Grid pattern
  const defs = svg.append('defs');
  defs.append('pattern')
    .attr('id', 'grid')
    .attr('width', 20)
    .attr('height', 20)
    .attr('patternUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', 'M 20 0 L 0 0 0 20')
    .attr('fill', 'none')
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 0.5);

  // Content group — all transforms applied here for zoom/pan
  const contentGroup = svg.append('g');

  // Background grid
  contentGroup.append('rect')
    .attr('width', 8000)
    .attr('height', 8000)
    .attr('fill', 'url(#grid)');

  // Layer groups (ordered like Node-RED editor)
  const groupLayer = contentGroup.append('g').attr('class', 'group-layer');
  const linkLayer = contentGroup.append('g').attr('class', 'link-layer');
  const nodeLayer = contentGroup.append('g').attr('class', 'node-layer');

  // ── Zoom/Pan ──
  const zoom = d3.zoom()
    .scaleExtent([0.1, 2])
    .on('zoom', (event) => {
      contentGroup.attr('transform', event.transform);
    });
  svg.call(zoom);

  // ── Render function (called on initial load and WebSocket updates) ──
  function render(data) {
    const { nodes, groups, links } = data;

    // Show/hide legend
    legend.style.display = nodes.some(n => n.dirty) ? 'block' : 'none';

    // Groups
    const groupSel = groupLayer.selectAll('.nr-group')
      .data(groups, d => d.id);

    groupSel.exit().remove();

    const groupEnter = groupSel.enter().append('g').attr('class', 'nr-group');
    groupEnter.append('rect').attr('class', 'nr-group-rect').attr('rx', 4).attr('ry', 4);
    groupEnter.append('text').attr('font-size', 10).attr('fill', '#999');

    groupSel.merge(groupEnter).each(function(d) {
      const g = d3.select(this);
      g.select('rect')
        .attr('x', d.x).attr('y', d.y)
        .attr('width', d.w).attr('height', d.h);
      g.select('text')
        .attr('x', d.x + 5).attr('y', d.y + 15)
        .text(d.name || 'Group');
    });

    // Links
    const linkSel = linkLayer.selectAll('.nr-link')
      .data(links, d => d.source.id + ':' + d.sourcePort + ':' + d.target.id);

    linkSel.exit().remove();

    linkSel.enter().append('path')
      .attr('class', 'nr-link')
      .merge(linkSel)
      .attr('d', d => {
        const numOut = d.source.outputs || 1;
        const portY = -((numOut - 1) / 2) * 13 + 13 * d.sourcePort;
        return generateLinkPath(
          d.source.x + d.source.w / 2,
          d.source.y + portY,
          d.target.x - d.target.w / 2,
          d.target.y,
          1
        );
      })
      .classed('nr-link-disabled', d => d.source.d || d.target.d);

    // Nodes
    const nodeSel = nodeLayer.selectAll('.nr-node')
      .data(nodes, d => d.id);

    nodeSel.exit().remove();

    const nodeEnter = nodeSel.enter().append('g')
      .attr('class', d => getNodeCSSClass(d))
      .attr('transform', d => 'translate(' + (d.x - d.w / 2) + ',' + (d.y - d.h / 2) + ')')
      .on('mouseenter', showTooltip)
      .on('mouseleave', hideTooltip);

    nodeEnter.append('rect')
      .attr('class', 'nr-node-body')
      .attr('rx', 5).attr('ry', 5)
      .attr('fill', d => getNodeColor(d.type));

    nodeEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#333')
      .attr('dy', '0.35em');

    nodeSel.merge(nodeEnter).each(function(d) {
      const g = d3.select(this);
      g.attr('class', getNodeCSSClass(d));
      g.select('rect')
        .attr('width', d.w).attr('height', d.h)
        .attr('fill', getNodeColor(d.type));
      g.select('text')
        .attr('x', d.w / 2).attr('y', d.h / 2)
        .text((d.name || d.type).substring(0, 20));

      // Input port indicator
      if (d.inputs > 0) {
        if (!g.select('.nr-port-input').size()) {
          g.append('rect')
            .attr('class', 'nr-port-input')
            .attr('x', -5).attr('y', d.h / 2 - 4)
            .attr('width', 8).attr('height', 8)
            .attr('rx', 2).attr('fill', '#999');
        }
      }

      // Output port indicators
      const numOut = d.outputs || 0;
      g.selectAll('.nr-port-output').remove();
      for (let i = 0; i < numOut; i++) {
        const py = d.h / 2 - ((numOut - 1) / 2) * 13 + 13 * i - 4;
        g.append('rect')
          .attr('class', 'nr-port-output')
          .attr('x', d.w - 3).attr('y', py)
          .attr('width', 8).attr('height', 8)
          .attr('rx', 2).attr('fill', '#999');
      }
    });
  }

  // ── Tooltip helpers ──
  function showTooltip(event, d) {
    tooltip.style.display = 'block';
    tooltip.innerHTML =
      '<div class="tt-name">' + escapeHtml(d.name || d.type) + '</div>' +
      '<div>Type: ' + escapeHtml(d.type) + '</div>' +
      '<div>ID: ' + escapeHtml(d.id) + '</div>' +
      (d.dirty ? '<div class="tt-dirty">⚡ Un-deployed changes</div>' : '') +
      (d.d ? '<div>⛔ Disabled</div>' : '');
    tooltip.style.left = (event.pageX + 12) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  // ── WebSocket live refresh ──
  const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/staging-ws';
  let ws = null;
  let reconnectDelay = 3000;
  let reconnectTimer = null;

  function connectWS() {
    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      banner.classList.remove('visible');
      reconnectDelay = 3000;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'staging-update') {
          // Rebuild IR from the received flows
          const freshData = buildIRFromFlows(msg.flows, msg.dirtyNodeIds);
          render(freshData);
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      banner.classList.add('visible');
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectWS();
      reconnectDelay = Math.min(reconnectDelay * 1.5, 30000);
    }, reconnectDelay);
  }

  // ── Initial render ──
  render(INITIAL_DATA);

  // Auto-fit: compute bounding box and set initial view
  const bb = INITIAL_DATA.bb;
  const contentWidth = bb.width || 800;
  const contentHeight = bb.height || 600;
  const scale = Math.min(0.9, Math.min(width / contentWidth, height / contentHeight));
  const tx = (width - contentWidth * scale) / 2 - (bb.minX || 0) * scale;
  const ty = (height - contentHeight * scale) / 2 - (bb.minY || 0) * scale;
  svg.transition().duration(500).call(
    zoom.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );

  // ── Start WebSocket after initial render ──
  connectWS();

  // ── Utility functions (embedded so the HTML is self-contained) ──
  function getNodeColor(type) {
    const colors = ${JSON.stringify(getNodeColor)}; // fallback: use the function
    const map = ${JSON.stringify({
      'inject': '#a6bbcf', 'debug': '#87a980', 'function': '#fdd0a2',
      'switch': '#d8bfd8', 'change': '#e2d6b8', 'range': '#d8bfd8',
      'template': '#d8bfd8', 'delay': '#fdd0a2', 'trigger': '#fdd0a2',
      'exec': '#fdd0a2', 'complete': '#c0c0c0', 'catch': '#c0c0c0',
      'status': '#c0c0c0', 'comment': '#ffffff', 'unknown': '#c0c0c0',
      'link in': '#c0c0c0', 'link out': '#c0c0c0', 'link call': '#c0c0c0',
      'mqtt in': '#d8bfd8', 'mqtt out': '#d8bfd8',
      'http in': '#d8bfd8', 'http response': '#d8bfd8', 'http request': '#e2d6b8',
      'split': '#d8bfd8', 'join': '#d8bfd8', 'batch': '#d8bfd8', 'sort': '#d8bfd8',
      'csv': '#d8bfd8', 'html': '#d8bfd8', 'json': '#d8bfd8', 'xml': '#d8bfd8', 'yaml': '#d8bfd8',
      'file in': '#87a980', 'file out': '#87a980', 'file': '#87a980', 'watch': '#87a980',
      'rbe': '#fdd0a2',
    })};
    return map[type] || '#cccccc';
  }

  function getNodeCSSClass(d) {
    const classes = ['nr-node'];
    if (d.dirty) classes.push('nr-node-dirty');
    if (d.d) classes.push('nr-node-disabled');
    return classes.join(' ');
  }

  function buildIRFromFlows(flows, dirtyNodeIds) {
    const dirtySet = new Set(dirtyNodeIds || []);
    const allFlowNodes = flows.filter(n => n.type !== 'group' && n.type !== 'tab' && n.type !== 'junction');
    const groups = flows.filter(n => n.type === 'group');
    const nodeIdSet = new Set(allFlowNodes.map(n => n.id));

    const nodes = allFlowNodes.map(n => ({
      id: n.id, type: n.type, name: n.name || n.type,
      x: n.x || 0, y: n.y || 0, w: n.w || 100, h: n.h || 30,
      inputs: n.inputs ?? 0, outputs: n.outputs ?? 0,
      d: n.d === true, dirty: dirtySet.has(n.id),
      wires: n.wires || [],
    }));

    const irGroups = groups.map(g => ({
      id: g.id, name: g.name || 'Group',
      x: g.x || 0, y: g.y || 0, w: g.w || 40, h: g.h || 40,
      style: g.style || {}, nodes: (g.nodes || []).filter(mid => nodeIdSet.has(mid)),
    }));

    const links = [];
    for (const node of nodes) {
      if (!node.wires || node.wires.length === 0) continue;
      node.wires.forEach((targets, portIndex) => {
        if (!Array.isArray(targets)) return;
        for (const targetId of targets) {
          const targetNode = nodes.find(n => n.id === targetId);
          if (targetNode) {
            links.push({ source: node, sourcePort: portIndex, target: targetNode });
          }
        }
      });
    }

    return { nodes, groups: irGroups, links, bb: computeBBox(nodes, irGroups) };
  }

  function computeBBox(nodes, groups) {
    if (nodes.length === 0 && groups.length === 0) {
      return { minX: 0, minY: 0, maxX: 400, maxY: 200, width: 400, height: 200 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x - n.w/2 < minX) minX = n.x - n.w/2;
      if (n.x + n.w/2 > maxX) maxX = n.x + n.w/2;
      if (n.y - n.h/2 < minY) minY = n.y - n.h/2;
      if (n.y + n.h/2 > maxY) maxY = n.y + n.h/2;
    }
    for (const g of groups) {
      if (g.x < minX) minX = g.x;
      if (g.y < minY) minY = g.y;
      if (g.x + g.w > maxX) maxX = g.x + g.w;
      if (g.y + g.h > maxY) maxY = g.y + g.h;
    }
    const p = 60;
    return { minX: minX - p, minY: minY - p, maxX: maxX + p, maxY: maxY + p,
      width: maxX - minX + 2*p, height: maxY - minY + 2*p };
  }

  function generateLinkPath(origX, origY, destX, destY, sc, hasStatus) {
    // Simplified bezier for browser (same algorithm as server-side geometry.js)
    const dy = destY - origY, dx = destX - origX;
    const delta = Math.sqrt(dy*dy + dx*dx);
    const NODE_W = 100, NODE_H = 30;
    let scale = 0.75;
    if (dx * sc > 0) {
      if (delta < NODE_W) scale = 0.75 - 0.75 * ((NODE_W - delta) / NODE_W);
    } else {
      scale = 0.4 - 0.2 * (Math.max(0, (NODE_W - Math.min(Math.abs(dx), Math.abs(dy))) / NODE_W));
    }
    if (dx * sc > 0) {
      const cp = [[origX + sc * NODE_W * scale, origY], [destX - sc * scale * NODE_W, destY]];
      return 'M ' + origX + ' ' + origY + ' C ' + cp[0][0] + ' ' + cp[0][1] + ' ' + cp[1][0] + ' ' + cp[1][1] + ' ' + destX + ' ' + destY;
    }
    // Fallback: simple curve
    const midX = (origX + destX) / 2;
    return 'M ' + origX + ' ' + origY + ' C ' + midX + ' ' + origY + ' ' + midX + ' ' + destY + ' ' + destX + ' ' + destY;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
</script>
</body>
</html>`;
}
