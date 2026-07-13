## 1. Test Workflow

- [x] 1.1 Create `.github/workflows/test.yml` that triggers on `v*.*.*` tag push
- [x] 1.2 Configure workflow to run on `ubuntu-latest` with Node.js 22
- [x] 1.3 Add steps: checkout, setup-node, npm ci, npm test

## 2. Build and Publish Workflow

- [x] 2.1 Create `.github/workflows/docker-publish.yml` triggered by `workflow_run` on test workflow success
- [x] 2.2 Add `packages: write` permission for GITHUB_TOKEN
- [x] 2.3 Add QEMU setup step via `docker/setup-qemu-action`
- [x] 2.4 Add Docker Buildx setup step via `docker/setup-buildx-action`
- [x] 2.5 Add GHCR login step via `docker/login-action` using GITHUB_TOKEN
- [x] 2.6 Add `docker/metadata-action` step to generate semver tags (`latest`, `1`, `1.2`, `1.2.3`) from the tag ref, then build-and-push with `platforms: linux/amd64,linux/arm64` and `push: true`

## 3. Verification

- [x] 3.1 Push a test tag (e.g., `v0.0.0-test`) and verify test workflow runs
- [x] 3.2 Confirm docker-publish workflow triggers after test success
- [x] 3.3 Verify multi-arch image exists at `ghcr.io/gmag11/nodered-mcp` with both tags
