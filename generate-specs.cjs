const fs = require('fs');
const path = require('path');

const changesDir = path.join(__dirname, 'openspec', 'changes', 'staging-deploy', 'specs');
const existingSpecsDir = path.join(__dirname, 'openspec', 'specs');

// Create the changes dir if it doesn't exist
fs.mkdirSync(changesDir, { recursive: true });

// Group 1: Write tools (withRetry -> staging)
const writeTools = [
  'tool-create-node', 'tool-update-node', 'tool-delete-node',
  'tool-wire-nodes', 'tool-create-subflow', 'tool-update-subflow',
  'tool-delete-subflow', 'tool-create-subflow-instance', 'tool-import-flow',
  'tool-add-nodes-to-group', 'tool-remove-nodes-from-group', 'tool-update-group',
  'tool-delete-group'
];

writeTools.forEach(tool => {
  const specDir = path.join(changesDir, tool);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), `## MODIFIED Requirements

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a \`staging\` summary object containing \`pendingChanges\`, \`dirtyNodeIds\`, \`dirtyFlowIds\`, and \`deployed\`
`);
});

// Group 2: Flow level ops (individual API -> staging)
const flowTools = ['tool-create-flow', 'tool-update-flow', 'tool-delete-flow'];
flowTools.forEach(tool => {
  const specDir = path.join(changesDir, tool);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), `## MODIFIED Requirements

### Requirement: Stage flow operations locally
The tool SHALL modify the local staging store using a pure \`apply*\` function on the flows array, rather than calling the individual Node-RED flow API endpoints (\`POST /flow\`, \`PUT /flow/:id\`, \`DELETE /flow/:id\`).

#### Scenario: Flow operation is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store flows array
- **THEN** the response includes a \`staging\` summary object containing \`pendingChanges\`, \`dirtyNodeIds\`, \`dirtyFlowIds\`, and \`deployed\`
`);
});

// Group 3: Read tools (HTTP -> staging)
const readTools = [
  'tool-get-flows', 'tool-get-flow-nodes', 'tool-get-flow-diagram',
  'tool-get-config-nodes', 'tool-get-node-detail', 'tool-get-subflows',
  'tool-get-subflow-detail', 'tool-search-nodes', 'tool-export-flow',
  'tool-export-subflow'
];

readTools.forEach(tool => {
  const specDir = path.join(changesDir, tool);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), `## MODIFIED Requirements

### Requirement: Read from staging
The tool SHALL read flow data from the local staging store instead of making an HTTP request to Node-RED's \`/flows\` endpoint.

#### Scenario: Data is requested
- **WHEN** the tool is executed
- **THEN** it retrieves the flows array from \`staging.getFlows()\`
`);
});

// Group 4: Runtime (inject-message)
const injectDir = path.join(changesDir, 'tool-inject-message');
fs.mkdirSync(injectDir, { recursive: true });
fs.writeFileSync(path.join(injectDir, 'spec.md'), `## MODIFIED Requirements

### Requirement: Pre-deploy guard
The tool SHALL check the staging status before attempting to inject a message.

#### Scenario: Staging has pending changes
- **WHEN** the tool is called
- **WHEN** the staging store has pending undeployed changes
- **THEN** the tool returns an error instructing the LLM to deploy first
`);

// Group 5: Skills
const skills = [
  'skill-nodered-flow-builder', 'skill-nodered-fundamentals',
  'skill-nodered-patterns', 'skill-nodered-subflows'
];

skills.forEach(skill => {
  const specDir = path.join(changesDir, skill);
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, 'spec.md'), `## MODIFIED Requirements

### Requirement: Teach staging and deploy workflow
The skill instructions SHALL be updated to explain the in-memory staging model and mandate explicit deployment.

#### Scenario: LLM reads skill
- **WHEN** the LLM retrieves the skill
- **THEN** it learns that write tools only stage changes locally
- **THEN** it learns that it must explicitly call the \`deploy\` tool before testing with \`inject-message\`
`);
});

console.log("All delta specs created successfully.");
