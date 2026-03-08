# Editorial Full Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining Editorial feature set (route behavior, home interaction, editor mode orchestration, settings persistence) under a single-layout architecture.

**Architecture:** Keep `noteStore` as the only business-data source, implement missing interaction behavior in Editorial views/composables, and lock tests to semantic hooks instead of visual details. Use route metadata and composable state to avoid page-level business duplication.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Vitest, Vite.

---

### Task 1: Lock editorial-only route map and remove legacy route assumptions

**Files:**
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/router/__tests__/demoRoutes.spec.ts`

**Step 1: Write the failing test**

```ts
it('keeps only editorial demo routes and editorial default-flow routes', () => {
  // assert no /demo/styles|minimal|dashboard|capsule
  // assert /, /notes/new, /notes/new/article, /notes/:id/edit, /settings use editorial components
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: FAIL if any legacy route assumption remains.

**Step 3: Write minimal implementation**

1. Keep only editorial demo group (`/demo/editorial*`).
2. Keep default app flow mapped to Editorial pages.
3. Keep `meta.appStyle = 'editorial'` on default-flow routes.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/router/__tests__/demoRoutes.spec.ts
git commit -m "refactor(editorial): lock editorial-only route topology"
```

### Task 2: Implement home-level interactive filters (search/tag/time) in editorial shell

**Files:**
- Modify: `frontend/src/views/demo/editorial/EditorialHomeDemo.vue`
- Modify: `frontend/src/composables/demo/useDemoNotesViewModel.ts`
- Test: `frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('filters reading stream by keyword/tag/time and preserves semantic zones', async () => {
  // set search input / toggle tag / set time filter
  // assert rendered list count changes as expected
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: FAIL because current home lacks complete filter controls.

**Step 3: Write minimal implementation**

1. Add lightweight controls in Home (search, tag toggles, time filter select).
2. Wire controls to `useDemoNotesViewModel` state + `refresh`.
3. Keep existing `directory / reading-stream / marginalia` hooks untouched.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial/EditorialHomeDemo.vue frontend/src/composables/demo/useDemoNotesViewModel.ts frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts
git commit -m "feat(editorial): add interactive reading filters to home"
```

### Task 3: Restore editor route-mode orchestration (create/article/edit)

**Files:**
- Modify: `frontend/src/composables/demo/useDemoEditorState.ts`
- Modify: `frontend/src/views/demo/editorial/EditorialEditorDemo.vue`
- Test: `frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts`

**Step 1: Write the failing test**

```ts
it('orchestrates create/article/edit save behavior from route-driven mode', async () => {
  // create -> createNote quick
  // article -> createNote article
  // edit -> updateNote(id)
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- useDemoEditorState.spec.ts`  
Expected: FAIL when mode handling is incomplete or regressed.

**Step 3: Write minimal implementation**

1. Ensure composable supports route-mode inference without breaking 0-2 arg call sites.
2. Ensure editor view maps `/notes/new`, `/notes/new/article`, `/notes/:id/edit` to correct behavior.
3. Keep save API calls (`createNote/updateNote`) unchanged.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- useDemoEditorState.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/composables/demo/useDemoEditorState.ts frontend/src/views/demo/editorial/EditorialEditorDemo.vue frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts
git commit -m "feat(editorial): restore route-mode editor orchestration"
```

### Task 4: Add save feedback and failure-safe UX in editor

**Files:**
- Modify: `frontend/src/views/demo/editorial/EditorialEditorDemo.vue`
- Modify: `frontend/src/styles/demo/editorial.css`
- Test: `frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('shows saving/saved/error inline feedback without clearing form on failure', async () => {
  // mock save reject once
  // assert error hint appears and form content remains
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: FAIL due to missing feedback states.

**Step 3: Write minimal implementation**

1. Add inline state chips: `saving`, `saved`, `error`.
2. Keep form content after save failure.
3. Add minimal non-intrusive styles for feedback chips.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial/EditorialEditorDemo.vue frontend/src/styles/demo/editorial.css frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts
git commit -m "feat(editorial): add save feedback and failure-safe editor ux"
```

### Task 5: Persist settings panel values and load on startup

**Files:**
- Create: `frontend/src/composables/demo/useEditorialSettings.ts`
- Modify: `frontend/src/views/demo/editorial/EditorialSettingsDemo.vue`
- Test: `frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts`

**Step 1: Write the failing test**

```ts
it('binds settings controls to persisted state and restores values on mount', async () => {
  // set localStorage seed
  // mount settings and assert selected values restored
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: FAIL because settings currently static.

**Step 3: Write minimal implementation**

1. Build composable for `typography/material/cadence/writing` persisted state.
2. Hydrate from localStorage on mount.
3. Save on control change.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/composables/demo/useEditorialSettings.ts frontend/src/views/demo/editorial/EditorialSettingsDemo.vue frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts
git commit -m "feat(editorial): persist editorial settings panel state"
```

### Task 6: Final regression gate and docs sync

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-03-08-editorial-full-feature-design.md`
- Create/Modify: `docs/plans/2026-03-08-editorial-full-feature-notes.md`

**Step 1: Write verification checklist**

```md
- [ ] editorial-only routes are active
- [ ] home filters affect rendered stream
- [ ] editor create/article/edit behaviors are correct
- [ ] settings values persist
- [ ] tests and build pass
```

**Step 2: Run full verification**

Run: `cd frontend && npm test`  
Run: `cd frontend && npm run build`  
Expected: PASS.

**Step 3: Write docs**

1. Update README with editorial-only architecture and route map.
2. Update design doc status to reflect implemented feature subset.
3. Add feature notes with verification evidence.

**Step 4: Re-run verification**

Run: `cd frontend && npm test && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/plans/2026-03-08-editorial-full-feature-design.md docs/plans/2026-03-08-editorial-full-feature-notes.md
git commit -m "docs(editorial): sync full-feature implementation and verification notes"
```

## Execution Notes

1. Use @test-driven-development for every task.
2. Use @systematic-debugging if verification failures are indirect.
3. Use @verification-before-completion before final completion claim.
4. Keep one commit per task with non-overlapping scope.
