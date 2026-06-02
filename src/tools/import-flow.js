/**
 * MCP tool: import-flow
 *
 * Imports a Node-RED flow JSON (array or { nodes: [...] } object) into the
 * running Node-RED instance. Supports two conflict strategies (regenerate /
 * overwrite) and an optional targetFlowId to inject nodes into an existing tab.
 *
 * All flows are redeployed on import (PUT /flows full deploy).
 */

import { randomUUID } from 'crypto';

/**
 * Parse and normalize a flowJson string to a flat node array.
 *
 * Accepts:
 *   - A JSON array string: `[ {...}, ... ]`
 *   - A JSON object string with a `nodes` property: `{ "nodes": [ {...}, ... ] }`
 *
 * @param {string} input - Raw JSON string from the caller
 * @returns {object[]} Flat array of Node-RED node objects
 * @throws {Error} On invalid JSON, wrong shape, or empty array
 */
export function normalizeFlowJson(input) {
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Invalid flowJson: not valid JSON');
  }

  let nodes;
  if (Array.isArray(parsed)) {
    nodes = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.nodes)) {
    nodes = parsed.nodes;
  } else {
    throw new Error('Invalid flowJson: expected a JSON array or an object with a "nodes" array');
  }

  if (nodes.length === 0) {
    throw new Error('flowJson is empty — nothing to import');
  }

  return nodes;
}

/**
 * Remap all `id` and `z` fields in a node array to fresh UUIDs, preserving
 * all internal references (wire targets, `z` cross-references).
 *
 * @param {object[]} nodes - Node array to remap (not mutated)
 * @returns {object[]} New array with remapped IDs
 */
export function regenerateIds(nodes) {
  // Build old-id → new-id map
  const idMap = new Map();
  for (const node of nodes) {
    if (node.id) {
      idMap.set(node.id, randomUUID());
    }
  }

  return nodes.map((node) => {
    const remapped = { ...node };

    // Remap own id
    if (node.id && idMap.has(node.id)) {
      remapped.id = idMap.get(node.id);
    }

    // Remap z (parent flow reference)
    if (node.z && idMap.has(node.z)) {
      remapped.z = idMap.get(node.z);
    }

    // Remap wire targets
    if (Array.isArray(node.wires)) {
      remapped.wires = node.wires.map((port) =>
        Array.isArray(port)
          ? port.map((targetId) => idMap.get(targetId) ?? targetId)
          : port
      );
    }

    return remapped;
  });
}

/**
 * Merge imported nodes into the existing flows array using the given strategy.
 *
 * Strategies:
 *   - `regenerate`: imported nodes have already had IDs regenerated, so there
 *     are no collisions. Just append.
 *   - `overwrite`: replace any existing node whose ID matches an imported node,
 *     then append remaining new nodes.
 *
 * @param {object[]} existing - Current flows array from GET /flows
 * @param {object[]} imported - Imported nodes (already strategy-processed)
 * @param {'regenerate'|'overwrite'} strategy
 * @returns {{ mergedFlows: object[], conflicts: number }}
 */
export function mergeFlows(existing, imported, strategy) {
  if (strategy === 'regenerate') {
    // IDs are all fresh — no possible conflicts, just append
    return { mergedFlows: [...existing, ...imported], conflicts: 0 };
  }

  if (strategy === 'overwrite') {
    const importedById = new Map(imported.map((n) => [n.id, n]));
    let conflicts = 0;

    // Replace existing nodes that are being overwritten
    const kept = existing.map((node) => {
      if (importedById.has(node.id)) {
        conflicts++;
        return importedById.get(node.id);
      }
      return node;
    });

    // Append imported nodes that were not replacements (new IDs)
    const existingIds = new Set(existing.map((n) => n.id));
    const brandNew = imported.filter((n) => !existingIds.has(n.id));

    return { mergedFlows: [...kept, ...brandNew], conflicts };
  }

  throw new Error(`Unknown conflictStrategy '${strategy}'. Use "regenerate" or "overwrite"`);
}

/**
 * Discard tab nodes from the imported array and remap all remaining nodes'
 * `z` field to the given targetFlowId.
 *
 * @param {object[]} nodes - Imported node array
 * @param {string} targetFlowId - ID of the existing flow tab to inject into
 * @returns {object[]} Non-tab nodes with `z` set to targetFlowId
 */
export function applyTargetFlow(nodes, targetFlowId) {
  return nodes
    .filter((n) => n.type !== 'tab' && n.type !== 'subflow')
    .map((n) => ({ ...n, z: targetFlowId }));
}

/**
 * Build the import summary object.
 *
 * @param {object[]} importedNodes - The nodes that were merged into the instance
 * @param {number} conflicts - Number of ID collisions resolved
 * @param {string} strategy - The conflict strategy applied
 * @param {string|null} targetFlowId - The targetFlowId if used, else null
 * @returns {{ imported: { flows: number, nodes: number, configNodes: number }, conflicts: number, strategy: string, targetFlowId: string|null }}
 */
export function summarizeImport(importedNodes, conflicts, strategy, targetFlowId) {
  let flows = 0;
  let nodes = 0;
  let configNodes = 0;

  for (const node of importedNodes) {
    if (node.type === 'tab' || node.type === 'subflow') {
      flows++;
    } else if (node.z === undefined || node.z === null || node.z === '') {
      configNodes++;
    } else {
      nodes++;
    }
  }

  return {
    imported: { flows, nodes, configNodes },
    conflicts,
    strategy,
    targetFlowId: targetFlowId ?? null,
  };
}

/**
 * Handler for the import-flow MCP tool.
 *
 * Orchestration:
 *  1. Validate targetFlowId (if provided) — must exist and not be locked
 *  2. Fetch existing flows
 *  3. Normalize imported JSON
 *  4. Apply targetFlow remapping or standard conflict strategy
 *  5. PUT /flows with merged result
 *  6. Return summary
 *
 * @param {ReturnType<import('../nodered/client.js').createNodeRedClient>} client
 * @param {object} params
 * @param {string} params.flowJson - Raw Node-RED flow JSON string
 * @param {'regenerate'|'overwrite'} [params.conflictStrategy='regenerate']
 * @param {string} [params.targetFlowId]
 * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
 */
export async function handleImportFlow(client, params) {
  const { flowJson, conflictStrategy = 'regenerate', targetFlowId } = params;

  // Step 1: validate conflictStrategy early (before any network calls)
  if (conflictStrategy !== 'regenerate' && conflictStrategy !== 'overwrite') {
    throw new Error(`Unknown conflictStrategy '${conflictStrategy}'. Use "regenerate" or "overwrite"`);
  }

  // Step 2: Fetch existing flows
  const rawResponse = await client.request('GET', '/flows');
  const existing = rawResponse.flows || [];
  const { rev } = rawResponse;

  // Step 3: Validate targetFlowId if provided
  if (targetFlowId) {
    const targetTab = existing.find(
      (n) => n.id === targetFlowId && (n.type === 'tab' || n.type === 'subflow')
    );
    if (!targetTab) {
      throw new Error(`Target flow '${targetFlowId}' not found`);
    }
    if (targetTab.locked) {
      throw new Error(`Target flow '${targetFlowId}' is locked`);
    }
  }

  // Step 4: Normalize the incoming JSON
  const importedNodes = normalizeFlowJson(flowJson);

  // Step 5: Apply import destination + conflict strategy
  let nodesToMerge;
  let conflicts = 0;
  let actualStrategy = conflictStrategy;

  if (targetFlowId) {
    // Inject into existing flow: discard tabs, remap z, then regenerate IDs to avoid collisions
    const remapped = applyTargetFlow(importedNodes, targetFlowId);
    nodesToMerge = conflictStrategy === 'regenerate' ? regenerateIds(remapped) : remapped;
    const merged = mergeFlows(existing, nodesToMerge, conflictStrategy === 'regenerate' ? 'regenerate' : 'overwrite');
    conflicts = merged.conflicts;

    // Step 6: Deploy
    await client.putFlows({ rev, flows: merged.mergedFlows }, 'full');

    const summary = summarizeImport(nodesToMerge, conflicts, actualStrategy, targetFlowId);
    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
    };
  }

  // Standard import (no targetFlowId)
  if (conflictStrategy === 'regenerate') {
    nodesToMerge = regenerateIds(importedNodes);
    const merged = mergeFlows(existing, nodesToMerge, 'regenerate');
    conflicts = merged.conflicts;

    await client.putFlows({ rev, flows: merged.mergedFlows }, 'full');

    const summary = summarizeImport(nodesToMerge, conflicts, actualStrategy, null);
    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
    };
  }

  // overwrite strategy
  nodesToMerge = importedNodes;
  const merged = mergeFlows(existing, nodesToMerge, 'overwrite');
  conflicts = merged.conflicts;

  await client.putFlows({ rev, flows: merged.mergedFlows }, 'full');

  const summary = summarizeImport(nodesToMerge, conflicts, actualStrategy, null);
  return {
    content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
  };
}
