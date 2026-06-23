## 1. Move skill files

- [ ] 1.1 Create `resources/skills/` directory
- [ ] 1.2 Move all `nodered-*` subdirectories from `.github/skills/` to `resources/skills/` (preserving directory structure and `SKILL.md` files)
- [ ] 1.3 Verify non-Node-RED skills (`openspec-*`, `mcp-builder`) remain in `.github/skills/`

## 2. Update skill loader

- [ ] 2.1 Update `src/skills/loader.js`: change `skillsDir` from `.github/skills` to `resources/skills`
- [ ] 2.2 Update JSDoc comment in loader to reflect new path
- [ ] 2.3 Verify loader gracefully handles missing directory (existing behavior, no change needed)

## 3. Update server integration

- [ ] 3.1 Remove `nodered-` prefix filter in `src/server.js` (line ~724: `.filter(([name]) => name.startsWith('nodered-'))`)
- [ ] 3.2 Update comment near filter removal site to explain why filtering is no longer needed

## 4. Update package.json

- [ ] 4.1 Add `"resources/skills/"` to the `"files"` array in `package.json`

## 5. Update documentation and references

- [ ] 5.1 Grep codebase for `.github/skills` references and update any remaining mentions
- [ ] 5.2 Update `openspec/specs/skill-resources/spec.md` to reflect new directory path (if not already handled by this change's delta spec)

## 6. Verification

- [ ] 6.1 Run `npm pack --dry-run` to confirm `resources/skills/` is included in the tarball
- [ ] 6.2 Run `npm test` to ensure existing tests pass
- [ ] 6.3 Manually verify `list-skills` returns expected skills after changes
