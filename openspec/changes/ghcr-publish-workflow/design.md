## Context

The project is a Node.js MCP server packaged as a Docker container. There are no existing CI/CD workflows. The repository is `gmag11/NodeRed-MCP` on GitHub. The Dockerfile is a single-stage Node 22 Alpine build. Tests use Vitest (`npm test`). Publishing targets GitHub Container Registry (ghcr.io).

## Goals / Non-Goals

**Goals:**
- Run tests automatically on every version tag (`v*.*.*`)
- Build a multi-arch Docker image (amd64, arm64) only when tests pass
- Push the image to GHCR with version tag + `latest`
- Keep test and build concerns in separate workflows for clarity and reusability

**Non-Goals:**
- Building on every push to main (only tags)
- Publishing to Docker Hub or other registries
- Running integration tests against a live Node-RED instance
- Semantic version validation beyond the `v*.*.*` pattern match

## Decisions

### Decision 1: Two workflows — test → build via `workflow_run`

**Choice:** Separate `test.yml` (triggered by tag push) and `docker-publish.yml` (triggered by `workflow_run` on test success).

**Rationale:** The user explicitly requested separate workflows. `workflow_run` is the standard GitHub Actions mechanism to chain workflows — the build workflow only sees successful test completions. This also keeps each workflow focused on a single responsibility.

**Alternatives considered:**
- Single workflow with `needs: test` job dependency — simpler but mixes concerns; user wanted separation.
- `workflow_call` (reusable workflow) — adds indirection without benefit for this simple chain; `workflow_run` is event-driven and requires no caller changes.

### Decision 2: Multi-arch via `docker/setup-qemu-action` + `docker/build-push-action`

**Choice:** Use QEMU emulation for cross-platform builds within a single runner job.

**Rationale:** The `node:22-alpine` base image already supports both architectures. QEMU emulation via the official `docker/setup-qemu-action` avoids needing separate native ARM runners. Build time is acceptable for a release pipeline (not per-commit).

**Alternatives considered:**
- Native ARM runners (e.g., GitHub-hosted ARM64) — faster but limited availability and adds complexity.
- Buildx with separate build nodes — overkill for a single-image project.

### Decision 3: GITHUB_TOKEN for GHCR auth

**Choice:** Use the built-in `GITHUB_TOKEN` with `packages: write` permission.

**Rationale:** GHCR supports `GITHUB_TOKEN` for images in the same repository. No personal access token or secret needed. This is the simplest and most secure approach.

**Alternatives considered:**
- Personal Access Token (PAT) — requires managing a secret; unnecessary since the repo owns the package.

### Decision 4: `ubuntu-latest` runner

**Choice:** Standard `ubuntu-latest` GitHub-hosted runner for both workflows.

**Rationale:** Docker Buildx + QEMU work on Linux runners. No need for macOS or Windows. `ubuntu-latest` is free for public repositories.

## Risks / Trade-offs

- **QEMU ARM build speed:** ARM emulation on amd64 runners is slower than native builds. Mitigation: acceptable for release pipeline (runs only on tags, not per-commit). Expected build time ~3-5 minutes.
- **`workflow_run` default branch requirement:** The `workflow_run` trigger only works from the default branch (`main`). Mitigation: both workflow files must exist on `main` before the first tagged release.
- **GHCR package visibility:** By default, packages inherit repository visibility. This is a public repo, so the image will be public. Mitigation: acceptable; no private images needed.

## Open Questions

- None at this stage. All design decisions are resolved.
