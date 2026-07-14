## Purpose
MCP tool that modifies the configuration properties of an existing Node-RED node.

## Requirements

### Requirement: update-node MCP tool
The system SHALL expose an MCP tool named `update-node` that accepts a `nodeId` (required string) and a `properties` (required object) and shallow-merges `properties` onto the existing node's configuration, then deploys the updated flows with `Node-RED-Deployment-Type: flows`. This tool works on ANY node type: regular flow nodes, subflow instances (`type: "subflow:<uuid>"`), and subflow definitions (`type: "subflow"`).

#### Scenario: Update a single property
- **WHEN** `update-node` is invoked with `nodeId: "abc"` and `properties: { name: "New Name" }`
- **THEN** the node's `name` is changed to `"New Name"` and all other fields are preserved

#### Scenario: Update multiple properties
- **WHEN** `properties` contains multiple keys
- **THEN** all specified fields are updated and unmentioned fields are preserved

#### Scenario: Node not found
- **WHEN** `nodeId` does not match any node in the flows
- **THEN** the tool returns an error: `Node '<nodeId>' not found`

#### Scenario: `wires` in properties is rejected
- **WHEN** `properties` contains a `wires` key
- **THEN** the tool returns an error directing the agent to use `connect-nodes` or `disconnect-nodes`

#### Scenario: Node's parent flow is locked
- **WHEN** the node exists but its parent flow has `locked: true`
- **THEN** the tool returns an error: `Flow '<flowId>' is locked` without making any API write call

### Requirement: update-node returns previous and current state
The tool SHALL include `previousState` (the full node object before the update) and `currentState` (the full node object after the update) in its response alongside `nodeId`.

#### Scenario: Response shape
- **WHEN** a node is successfully updated
- **THEN** the response contains `nodeId`, `previousState`, and `currentState` as a JSON object

### Requirement: update-node round-trips the revision token
The tool SHALL include the `rev` field from `GET /flows` in the `POST /flows` request body to prevent overwriting concurrent changes.

#### Scenario: Conflict on stale revision
- **WHEN** Node-RED returns a 409 response (revision mismatch)
- **THEN** the tool returns an error indicating the flows were modified concurrently and the agent should retry

### Requirement: update-node handles credentials correctly
The tool SHALL automatically detect credential fields in the `properties` object and nest them under a `credentials` sub-object to match Node-RED's credential storage model. Node-RED stores sensitive fields like passwords and API keys inside a `credentials` object, separate from regular configuration properties.

The tool SHALL deep-merge credential updates with existing credentials: only the specified credential fields are changed; unspecified credential fields retain their previous values. This matches Node-RED's own behavior where partial credential updates are supported.

**Detection strategy** (in priority order):
1. **API-based (primary)**: The tool queries `GET /credentials/:nodeType/:nodeId` to obtain the authoritative list of credential field names for that specific node type. The response contains the credential field names (password fields are masked as `has_<field>: true/false` — the tool extracts the field name from both regular and `has_`-prefixed keys).
2. **Explicit `credentials` property**: If the caller provides a `credentials` property in `properties`, it is deep-merged with the node's existing `credentials`.
3. **Node's existing `credentials`**: If the node already has a `credentials` object (even with masked values like `__PWRD__`), its keys are used to identify credential properties.
4. **Heuristic fallback**: If the API is unavailable (editor disabled, auth mismatch, node type has no credentials), the tool matches incoming properties against a well-known set of credential field names: `username`, `password`, `passphrase`, `key`, `privateKey`, `cert`, `ca`, `clientKey`, `clientCert`, `token`, `secret`, `accessKey`, `secretKey`, `apiKey`, `bearerToken`, `psk`, `pass`, `user`, `passkey`, `sharedKey`, `hmacKey`.

**Privacy note**: Node-RED strips credential values from GET /flows responses for privacy. The `get-node-detail` and `get-flow-nodes` tools will NOT return credential values. The `/credentials/:type/:id` endpoint returns masked password values (`has_password: true`) but reveals the credential field names.

#### Scenario: Top-level credentials are nested automatically
- **WHEN** `update-node` is invoked on a config node (e.g., `mqtt-broker`) with `properties: { username: "newuser", password: "newpass" }`
- **THEN** `username` and `password` are moved into `credentials: { username: "newuser", password: "newpass" }` and are NOT present at the top level of the node

#### Scenario: API-based credential detection provides authoritative field names
- **WHEN** the `/credentials/:nodeType/:nodeId` endpoint returns `{ username: "abc", has_password: true }`
- **THEN** the tool uses `["username", "password"]` as the authoritative credential field names, and `password` is correctly detected even though the heuristic might not match it

#### Scenario: API unavailable — falls back to heuristic
- **WHEN** the `/credentials/:nodeType/:nodeId` endpoint returns an error (404, auth failure, etc.)
- **THEN** the tool falls back to the well-known credential field name heuristic

#### Scenario: Partial credential update preserves unspecified fields
- **WHEN** `update-node` is invoked on a config node with `properties: { password: "only-new-password" }`
- **THEN** the node's `credentials.password` is updated to `"only-new-password"` and `credentials.username` retains its previous value

#### Scenario: Explicit credentials object is deep-merged
- **WHEN** `update-node` is invoked with `properties: { broker: "new-broker", credentials: { password: "newpass" } }`
- **THEN** `broker` is updated at the top level, `credentials.password` is updated, and `credentials.username` is preserved

#### Scenario: Non-credential properties remain at top level
- **WHEN** `update-node` is invoked with `properties: { name: "Renamed", broker: "new-broker", username: "u" }`
- **THEN** `name` and `broker` stay at the top level, while `username` is moved to `credentials`

#### Scenario: No credentials property created when no credential fields present
- **WHEN** `update-node` is invoked with `properties: { name: "Renamed", broker: "new-broker" }`
- **THEN** no `credentials` property is added to the node

### Requirement: Stage edits locally
The tool SHALL modify the local staging store instead of deploying to Node-RED.

#### Scenario: Tool is executed
- **WHEN** the tool is executed successfully
- **THEN** it mutates the staging store
- **THEN** the response includes a `staging` summary object containing `pendingChanges`, `dirtyNodeIds`, `dirtyFlowIds`, and `deployed`

### Requirement: update-node edits subflow instances
The `update-node` tool SHALL successfully edit subflow instance nodes (nodes with `type: "subflow:<uuid>"`) using the same shallow-merge mechanism as regular nodes.

#### Scenario: Edit subflow instance name
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { name: "My Instance" }`
- **THEN** the instance's `name` SHALL be updated and the `type` SHALL remain `"subflow:<uuid>"`

#### Scenario: Edit subflow instance environment variables
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { env: [{ name: "VAR", value: "val", type: "str" }] }`
- **THEN** the instance's `env` array SHALL be replaced with the new value

#### Scenario: Edit subflow instance position
- **WHEN** `update-node` is invoked with the `nodeId` of a subflow instance and `properties: { x: 500, y: 300 }`
- **THEN** the instance's canvas position SHALL be updated
