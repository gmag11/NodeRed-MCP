## ADDED Requirements

### Requirement: get-node-type-detail MCP tool
The system SHALL expose an MCP tool named `get-node-type-detail` that accepts a required `type` string parameter and returns the node set object for that type enriched with a `help` field containing the node's documentation in Markdown format.

#### Scenario: Known node type lookup
- **WHEN** an MCP client invokes `get-node-type-detail` with `type: "inject"`
- **THEN** the tool searches the `/nodes` JSON response for the node set whose `types` array contains `"inject"` and returns its fields merged with a `help` field

#### Scenario: Node type not found
- **WHEN** the requested type does not exist in any installed node set
- **THEN** the tool returns an error message indicating the type was not found

#### Scenario: Module field in response
- **WHEN** a type match is found
- **THEN** the response includes the `module` field from the node set so the caller can identify the source package

#### Scenario: All node set fields preserved
- **WHEN** the API returns a node set with fields such as `id`, `name`, `types`, `enabled`, `module`, `version`
- **THEN** all fields appear unmodified in the tool response alongside the `help` field

### Requirement: Node type documentation via HTML endpoint
The `get-node-type-detail` tool SHALL fetch `GET /nodes` with `Accept: text/html` and extract the `<script type="text/html" data-help-name="<type>">` block for the requested type. The extracted content SHALL be converted from HTML to Markdown and included as a `help` string field in the response.

#### Scenario: Documentation available
- **WHEN** the HTML response contains a `<script type="text/html" data-help-name="inject">` block
- **THEN** the `help` field contains the documentation converted to Markdown (no raw HTML tags)

#### Scenario: Documentation not available
- **WHEN** no matching `data-help-name` block exists for the requested type
- **THEN** the `help` field is `null` and the tool does not fail
