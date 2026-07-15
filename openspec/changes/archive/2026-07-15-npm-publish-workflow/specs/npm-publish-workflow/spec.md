## ADDED Requirements

### Requirement: Workflow triggers after test workflow succeeds
The npm-publish workflow SHALL trigger via `workflow_run` only when the existing test workflow completes successfully for a version tag push.

#### Scenario: Tests pass on version tag, npm publish starts
- **WHEN** the test workflow completes with status `success` and was triggered by a version tag matching `v*.*.*`
- **THEN** the npm-publish workflow is triggered

#### Scenario: Tests fail, npm publish does not start
- **WHEN** the test workflow completes with status `failure`
- **THEN** the npm-publish workflow is NOT triggered

#### Scenario: Non-tag push passes tests, npm publish does not start
- **WHEN** the test workflow completes successfully but was triggered by a branch push (not a tag)
- **THEN** the npm-publish workflow is NOT triggered

### Requirement: Version consistency check
The workflow SHALL verify that the `version` field in `package.json` matches the git tag that triggered the workflow. The git tag SHALL follow the pattern `v<semver>` (e.g., `v1.2.3`), and the package version SHALL be `<semver>` without the `v` prefix.

#### Scenario: Version matches tag
- **WHEN** git tag is `v1.0.3` and `package.json#version` is `1.0.3`
- **THEN** the version check passes and the workflow continues

#### Scenario: Version does not match tag
- **WHEN** git tag is `v1.0.3` and `package.json#version` is `1.0.2`
- **THEN** the workflow fails with a descriptive error message indicating the mismatch between the tag version and the package version

#### Scenario: Tag does not follow semver pattern
- **WHEN** git tag is `release-1` (not matching `v*.*.*`)
- **THEN** the version check extracts no version and the workflow fails

### Requirement: Package publication to npm registry
The workflow SHALL publish the package to the npm registry using `npm publish` when the version check passes. The workflow SHALL authenticate with the npm registry using an `NPM_TOKEN` secret configured in the repository.

#### Scenario: Successful publication
- **WHEN** version check passes and `npm publish` succeeds
- **THEN** the package `@gmag11/nodered-mcp-server` is updated on the npm registry with the new version

#### Scenario: Publication fails due to missing token
- **WHEN** the `NPM_TOKEN` secret is not configured
- **THEN** the workflow fails with an authentication error

#### Scenario: Package already published
- **WHEN** the version already exists on the npm registry
- **THEN** the workflow fails with a version conflict error from npm

### Requirement: Node.js version consistency with development
The workflow SHALL use the same Node.js version as the development environment and the test workflow (Node.js 22.x).

#### Scenario: Workflow uses Node.js 22
- **WHEN** the npm-publish workflow runs
- **THEN** it uses `actions/setup-node@v4` with Node.js 22

### Requirement: Workflow file follows existing conventions
The workflow file SHALL be placed at `.github/workflows/npm-publish.yml` and SHALL follow the same structure and naming conventions as the existing `.github/workflows/docker-publish.yml` workflow.

#### Scenario: Workflow file location
- **WHEN** the change is implemented
- **THEN** the file `.github/workflows/npm-publish.yml` exists and contains the npm publication workflow
