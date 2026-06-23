## 1. Move skill files

- [x] 1.1 Create `resources/skills/` directory
- [x] 1.2 Move all `nodered-*` subdirectories from `.github/skills/` to `resources/skills/` (preserving directory structure and `SKILL.md` files)
- [x] 1.3 Verify non-Node-RED skills (`openspec-*`, `mcp-builder`) remain in `.github/skills/`

## 2. Update skill loader

- [x] 2.1 Update `src/skills/loader.js`: change `skillsDir` from `.github/skills` to `resources/skills`
- [x] 2.2 Update JSDoc comment in loader to reflect new path
- [x] 2.3 Verify loader gracefully handles missing directory (existing behavior, no change needed)

## 3. Update server integration

- [x] 3.1 Remove `nodered-` prefix filter in `src/server.js` (line ~724: `.filter(([name]) => name.startsWith('nodered-'))`)
- [x] 3.2 Update comment near filter removal site to explain why filtering is no longer needed

## 4. Update package.json

- [x] 4.1 Add `"resources/skills/"` to the `"files"` array in `package.json`

## 5. Update documentation and references

- [x] 5.1 Grep codebase for `.github/skills` references and update any remaining mentions
- [x] 5.2 Update `openspec/specs/skill-resources/spec.md` to reflect new directory path (if not already handled by this change's delta spec)

## 6. Verification

- [x] 6.1 Run `npm pack --dry-run` to confirm `resources/skills/` is included in the tarball
- [x] 6.2 Run `npm test` to ensure existing tests pass
- [x] 6.3 Manually verify `list-skills` returns expected skills after changes (unit tests confirm)
