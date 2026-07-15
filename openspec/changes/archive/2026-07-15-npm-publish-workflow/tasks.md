## 1. Workflow Implementation

- [x] 1.1 Create `.github/workflows/npm-publish.yml` with `workflow_run` trigger on the test workflow, filtering to only run when tests succeed
- [x] 1.2 Add checkout and Node.js 22 setup steps matching the test workflow pattern
- [x] 1.3 Add version validation step that compares git tag (`github.ref` without `refs/tags/v` prefix) against `package.json#version` and fails if they don't match
- [x] 1.4 Add npm auth step writing `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to `~/.npmrc`
- [x] 1.5 Add npm publish step using `npm publish` (public access since the package is scoped)
- [x] 1.6 Verify the workflow file structure follows the same conventions as `.github/workflows/docker-publish.yml` (permissions, job naming, step formatting)

## 2. Documentation

- [x] 2.1 Update `docs/deployment-guide.md` with npm publish workflow section explaining the automated release process
- [x] 2.2 Add `NPM_TOKEN` to the documentation's required secrets/repository configuration

## 3. Validation

- [x] 3.1 Verify `prepublishOnly` script (`npm test`) runs successfully as part of the publish step
- [x] 3.2 Manually verify the workflow YAML syntax with `actionlint` or GitHub's workflow validator (if available)

## 4. Repository Configuration (Manual)

- [x] 4.1 Generate an npm Automation access token at https://www.npmjs.com/settings/<user>/tokens with read-write permission for `@gmag11/nodered-mcp-server`
- [x] 4.2 Add `NPM_TOKEN` as a repository secret in GitHub → Settings → Secrets and variables → Actions
