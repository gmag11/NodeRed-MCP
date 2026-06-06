# node-description-docs Specification

## Purpose
TBD - created by archiving change add-node-description-support. Update Purpose after archive.
## Requirements
### Requirement: LLM can read and set node descriptions via existing tools
The system SHALL document that the `info` property (labelled "Description" in the Node-RED editor UI) is a universal field available on most Node-RED node types, and that it can be read via `get-node-detail` and set via `update-node` or `create-node` using `properties: { info: "<description>" }`.

The documentation SHALL make clear that when a user says "add a description to this node" or "describe what this node does", they are referring to the `info` field.

#### Scenario: User asks to add/read a description
- **WHEN** a user says "add a description to the ping node" or "what's the description of this node"
- **THEN** the LLM maps the request to the `info` property and uses `update-node` (to set) or `get-node-detail` (to read)

#### Scenario: LLM reads a node's description
- **WHEN** an LLM invokes `get-node-detail` for a node that has an `info` field
- **THEN** the response includes the `info` field with the node's description text

#### Scenario: LLM sets a description on an existing node
- **WHEN** an LLM invokes `update-node` with `properties: { info: "My node description" }`
- **THEN** the node's `info` field is updated to `"My node description"` and all other fields are preserved

#### Scenario: LLM sets a description when creating a node
- **WHEN** an LLM invokes `create-node` with `properties: { info: "Description for new node" }`
- **THEN** the newly created node has `info` set to `"Description for new node"`

#### Scenario: LLM discovers the `info` field through skill documentation
- **WHEN** an LLM reads the `nodered-node-reference` skill
- **THEN** the skill documents that `info` is a common property available on all node types, representing the node's Description field in the Node-RED editor

