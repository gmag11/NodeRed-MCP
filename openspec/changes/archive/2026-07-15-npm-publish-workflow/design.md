## Context

The project currently has two GitHub Actions workflows:
- **Test** (`.github/workflows/test.yml`): Runs on version tags (`v*.*.*`), executes the test suite on Node.js 22
- **Docker Publish** (`.github/workflows/docker-publish.yml`): Triggers via `workflow_run` when tests pass, builds and pushes a multi-arch Docker image to GHCR

npm publication is currently done manually from a developer machine. This caused a discrepancy (discovered 2026-07-15) where git tag `v1.0.2` was moved to a newer commit but the npm registry still serves the code from the original June 24th publication. The existing `prepublishOnly` script in `package.json` runs `npm test`, but there is no automated pipeline to publish to npm.

## Goals / Non-Goals

**Goals:**
- Automate npm publication so it triggers automatically when a version tag is pushed and tests pass
- Validate that `package.json#version` matches the git tag before publishing, preventing version drift between git and the registry
- Mirror the existing `workflow_run` pattern used by docker-publish for consistency and code review simplicity

**Non-Goals:**
- Changing the test or docker-publish workflows
- Adding version bumping automation (the developer still sets the version in package.json and creates the tag)
- Publishing to any registry other than the public npm registry
- Adding provenance/attestation or npm package signing in this iteration

## Decisions

### Decision 1: Trigger via `workflow_run` (not `on: push: tags`)

The npm-publish workflow uses `workflow_run` with the test workflow, matching the docker-publish pattern.

**Rationale:** Ensures tests pass before publication. A direct `on: push: tags` trigger would allow publication without test verification. Using `workflow_run` also centralizes the tag-to-publish pipeline in a single dependency chain: tag push → test → (docker + npm in parallel).

**Alternatives considered:** `on: push: tags` with the test job defined inline in the same workflow. Rejected because it would duplicate the test definition and create a maintenance burden. The existing test workflow is the single source of truth for test execution.

### Decision 2: Tag-to-version validation via shell script

A shell step extracts the tag from `github.ref` (e.g., `refs/tags/v1.0.3`), strips the `v` prefix, and compares it to the value from `node -p "require('./package.json').version"`. If they don't match, the step exits with code 1 and a descriptive error.

**Rationale:** Simple, no external action dependency, easy to understand and debug. The check prevents the exact version drift bug that occurred with `v1.0.2`.

**Alternatives considered:** A dedicated GitHub Action like `JS-DevTools/npm-publish` with built-in version checking. Rejected because it adds an external dependency for a check that is 3 lines of shell script.

### Decision 3: npm auth via `NPM_TOKEN` secret

Authentication uses an npm Automation access token (not a publish token tied to a specific user account) stored as a repository secret. The token is written to `~/.npmrc` before `npm publish`.

**Rationale:** Automation tokens are the recommended approach for CI/CD. They support 2FA without interactive prompts, and are scoped to a specific package or organization.

**Alternatives considered:** `npm login` with username/password. Rejected because it cannot be automated in CI (requires interactive 2FA). Using `secrets.NPM_TOKEN` with a granular automation token is the npm-recommended CI approach.

### Decision 4: Workflow placed in same repository, same workflow directory

The workflow file goes in `.github/workflows/npm-publish.yml`, following the existing convention.

**Rationale:** No need for a separate repository or workflow dispatch. This is a release automation that belongs with the code it publishes.

## Risks / Trade-offs

- **Risk: Token expiration or rotation**: If the `NPM_TOKEN` expires or is revoked, publication silently fails. → **Mitigation**: The workflow fails loudly with an npm auth error. Token rotation should be part of the release checklist.
- **Risk: Parallel publishes for the same tag**: Both docker-publish and npm-publish consume the same `workflow_run` event for the test workflow. They run in parallel. If one fails and the other succeeds, the release is incomplete. → **Mitigation**: This is acceptable — Docker and npm are independent distribution channels. Each workflow fails independently with clear error messages.
- **Risk: Moving git tags**: The version check prevents the specific `v1.0.2` bug, but if a developer force-pushes a tag to a different commit after publication, the registry and git will diverge. → **Mitigation**: Tag moving is a developer practice issue, not solvable by CI alone. Documentation should state that tags must not be moved after pushing.
