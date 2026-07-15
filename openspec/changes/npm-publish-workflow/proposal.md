## Why

The package is currently published to npm manually, leading to the version mismatch discovered on 2026-07-15 where git tag `v1.0.2` was moved to a newer commit but the npm registry still holds the older June 24th code. Automating npm publication on git tags eliminates this class of error and ensures the registry always matches the tagged source.

## What Changes

- New GitHub Actions workflow (`npm-publish.yml`) that publishes `@gmag11/nodered-mcp-server` to the npm registry when a git tag matching `v*.*.*` is pushed
- Version validation step that verifies `package.json#version` matches the tag version (e.g., tag `v1.2.3` requires `"version": "1.2.3"`)
- The workflow only triggers after the existing `test` workflow passes (via `workflow_run`), mirroring the docker-publish pattern
- New repository secret `NPM_TOKEN` is required for automated publishing

## Capabilities

### New Capabilities
- `npm-publish-workflow`: GitHub Actions workflow that validates tag-version consistency, runs after tests pass, and publishes the package to the npm registry

### Modified Capabilities
- `ghcr-publish-workflow`: The existing docker-publish workflow is NOT modified — npm publish runs as a parallel `workflow_run` consumer of the test workflow

## Impact

- New file: `.github/workflows/npm-publish.yml`
- Requires `NPM_TOKEN` secret configured in GitHub repository settings (npm Automation access token with publish permission for `@gmag11/nodered-mcp-server`)
- Future publishes follow: push a version tag matching `package.json#version` (e.g., `v1.0.3`), tests pass, npm publish runs automatically
- The existing manual publish via `npm publish` from a local machine is replaced by this automated workflow for tagged releases
