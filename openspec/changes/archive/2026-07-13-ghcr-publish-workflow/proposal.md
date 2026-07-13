## Why

The project has a Dockerfile and docker-compose setup but no CI/CD pipeline to build and publish container images. Every new version tag must trigger an automated build that pushes the image to GitHub Container Registry (GHCR), making it available for pull without manual intervention. This eliminates the manual build-and-push step and ensures every release has a corresponding container image.

## What Changes

- Add a test workflow (`.github/workflows/test.yml`) that triggers on git tags matching `v*.*.*` and runs `npm test`
- Add a build-and-publish workflow (`.github/workflows/docker-publish.yml`) triggered by `workflow_run` on successful completion of the test workflow
- Build the Docker image using the existing `Dockerfile` for two architectures: `linux/amd64` and `linux/arm64`
- Push a multi-arch manifest to `ghcr.io/gmag11/nodered-mcp` with two tags: the semver version (e.g., `v1.2.3`) and `latest`

## Capabilities

### New Capabilities
- `ghcr-publish-workflow`: Automated Docker image build and publish to GitHub Container Registry on version tags

### Modified Capabilities
<!-- None - this is a new capability with no changes to existing specs -->

## Impact

- New files: `.github/workflows/test.yml`, `.github/workflows/docker-publish.yml`
- GitHub repository permissions: the workflow needs `packages: write` scope (available by default in GitHub Actions for the repo's own packages)
- No changes to existing source code, Dockerfile, or docker-compose files
