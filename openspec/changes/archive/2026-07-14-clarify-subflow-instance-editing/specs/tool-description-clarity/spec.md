## ADDED Requirements

### Requirement: update-node description mentions subflow instances
The `update-node` tool description SHALL explicitly state that it works on subflow instances (nodes with `type: "subflow:<uuid>"`) in addition to regular flow nodes.

#### Scenario: Description mentions subflow instances
- **WHEN** an agent reads the `update-node` tool description
- **THEN** the description SHALL include a statement like "Works on any node type including subflow instances (type: 'subflow:...')"

#### Scenario: Agent correctly routes subflow instance edits
- **WHEN** an agent needs to edit a subflow instance's properties (name, env, x, y, etc.)
- **THEN** the agent SHALL identify `update-node` as the correct tool based on the description alone

### Requirement: update-subflow description redirects to update-node for instances
The `update-subflow` tool description SHALL clearly state that it ONLY edits subflow definitions (templates), and SHALL direct agents to use `update-node` for editing subflow instances placed on flow tabs.

#### Scenario: Description distinguishes definitions from instances
- **WHEN** an agent reads the `update-subflow` tool description
- **THEN** the description SHALL include a statement like "For subflow instances placed on flow tabs, use update-node instead"

#### Scenario: Agent avoids using update-subflow for instances
- **WHEN** an agent needs to edit a subflow instance
- **THEN** the agent SHALL NOT attempt `update-subflow` based on the description alone

### Requirement: create-subflow-instance description mentions update-node for editing
The `create-subflow-instance` tool description SHALL mention that after creation, instances can be edited with `update-node`.

#### Scenario: Description links to update-node
- **WHEN** an agent reads the `create-subflow-instance` tool description
- **THEN** the description SHALL note that created instances can be modified with `update-node`
