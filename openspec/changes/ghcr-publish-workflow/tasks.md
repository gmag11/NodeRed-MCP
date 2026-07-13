## 1. Test Workflow

- [ ] 1.1 Create `.github/workflows/test.yml` that triggers on `v*.*.*` tag push
- [ ] 1.2 Configure workflow to run on `ubuntu-latest` with Node.js 22
- [ ] 1.3 Add steps: checkout, setup-node, npm ci, npm test

## 2. Build and Publish Workflow

- [ ] 2.1 Create `.github/workflows/docker-publish.yml` triggered by `workflow_run` on test workflow success
- [ ] 2.2 Add `packages: write` permission for GITHUB_TOKEN
- [ ] 2.3 Add QEMU setup step via `docker/setup-qemu-action`
- [ ] 2.4 Add Docker Buildx setup step via `docker/setup-buildx-action`
- [ ] 2.5 Add GHCR login step via `docker/login-action` using GITHUB_TOKEN
- [ ] 2.6 Add build-and-push step via `docker/build-push-action` with platforms `linux/amd64,linux/arm64`, tags `ghcr.io/gmag11/nodered-mcp:${{ github.ref_name }}` and `ghcr.io/gmag11/nodered-mcp:latest`, and `push: true`

## 3. Verification

- [ ] 3.1 Push a test tag (e.g., `v0.0.0-test`) and verify test workflow runs
- [ ] 3.2 Confirm docker-publish workflow triggers after test success
- [ ] 3.3 Verify multi-arch image exists at `ghcr.io/gmag11/nodered-mcp` with both tags
