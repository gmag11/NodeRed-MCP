## 1. Core Implementation

- [x] 1.1 Add last-flow guard in `applyDeleteFlow` function (`src/tools/delete-flow.js`): count tab nodes in the flows array, reject deletion if target is the only remaining tab, return error `"Cannot delete the last flow — at least one flow tab must exist"`

## 2. Spec Update

- [x] 2.1 Merge delta spec from `openspec/changes/prevent-delete-last-flow/specs/tool-delete-flow/spec.md` into `openspec/specs/tool-delete-flow/spec.md` (add last-flow scenario and new requirement)

## 3. Testing

- [x] 3.1 Add unit test case: single flow exists, deletion is rejected with correct error
- [x] 3.2 Add unit test case: multiple flows exist, deletion of one succeeds normally
- [x] 3.3 Add unit test case: single locked flow exists, locked error takes precedence (or both checks pass in correct order)
- [x] 3.4 Verify existing tests still pass after the change
