## ADDED Requirements

### Requirement: Test workflow triggers on version tags
The system SHALL execute the test suite when a git tag matching the pattern `v*.*.*` (e.g., `v1.0.0`, `v2.3.1`) is pushed to the repository.

#### Scenario: Version tag pushed triggers test run
- **WHEN** a tag matching `v*.*.*` is pushed
- **THEN** the test workflow starts and runs `npm test`

#### Scenario: Non-version tag does not trigger workflow
- **WHEN** a tag not matching `v*.*.*` is pushed (e.g., `beta`, `release-candidate`)
- **THEN** the test workflow does NOT execute

### Requirement: Test workflow runs on Node.js LTS
The test workflow SHALL run on the latest Node.js 22 LTS version.

#### Scenario: Tests execute on correct Node version
- **WHEN** the test workflow runs
- **THEN** it uses Node.js 22.x

### Requirement: Build workflow triggers only on test success
The build-and-publish workflow SHALL trigger via `workflow_run` only when the test workflow completes successfully.

#### Scenario: Tests pass, build starts
- **WHEN** the test workflow completes with status `success`
- **THEN** the docker-publish workflow is triggered

#### Scenario: Tests fail, build does not start
- **WHEN** the test workflow completes with status `failure`
- **THEN** the docker-publish workflow is NOT triggered

### Requirement: Multi-architecture Docker build
The build workflow SHALL build the Docker image for `linux/amd64` and `linux/arm64` platforms using `docker/build-push-action` with QEMU emulation.

#### Scenario: Image built for both architectures
- **WHEN** the build workflow runs
- **THEN** a multi-arch Docker image manifest is produced covering `linux/amd64` and `linux/arm64`

### Requirement: Image published to GitHub Container Registry
The build workflow SHALL push the multi-arch image to `ghcr.io/gmag11/nodered-mcp`. For a git tag `v1.2.3`, the image SHALL be tagged with `latest`, `1`, `1.2`, and `1.2.3`. Tags SHALL be generated via `docker/metadata-action` using `type=semver` with the tag ref.

#### Scenario: Version tag image published with all tags
- **WHEN** a tag `v1.2.3` triggers the pipeline and all steps succeed
- **THEN** the image is available at `ghcr.io/gmag11/nodered-mcp:latest`, `ghcr.io/gmag11/nodered-mcp:1`, `ghcr.io/gmag11/nodered-mcp:1.2`, and `ghcr.io/gmag11/nodered-mcp:1.2.3`

### Requirement: Workflow uses GITHUB_TOKEN for authentication
The build workflow SHALL authenticate to GHCR using the built-in `GITHUB_TOKEN` with `packages: write` permission.

#### Scenario: Authentication uses repository token
- **WHEN** the docker-publish workflow runs
- **THEN** it logs into `ghcr.io` using `GITHUB_TOKEN` without hardcoded secrets
