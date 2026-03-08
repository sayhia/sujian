# Editorial Full Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the default app UI with a Chinese-first literary Editorial experience across Home, Editor, and Settings while preserving current data behavior.

**Architecture:** Keep existing store/backend behavior as-is and rebuild page structure and styling in Editorial components. Route the default paths (`/`, `/notes/*`, `/settings`) to Editorial pages and keep demo mode behavior for internal style comparisons. Use focused page-level tests and full frontend verification as release gates.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Vitest, Vite.

---

### Task 1: Lock default routing to Editorial pages

**Files:**
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/router/__tests__/demoRoutes.spec.ts`

**Step 1: Write the failing test**

```ts
it('maps default app routes to editorial components', () => {
  // assert route records for /, /notes/new, /notes/:id/edit, /settings
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: FAIL because default routes still point to legacy pages.

**Step 3: Write minimal implementation**

Update route component bindings:

1. `/` -> `EditorialHomeDemo.vue`
2. `/notes/new`, `/notes/new/article`, `/notes/:id/edit` -> `EditorialEditorDemo.vue`
3. `/settings` -> `EditorialSettingsDemo.vue`

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/router/__tests__/demoRoutes.spec.ts
git commit -m "feat(editorial): route default app flow to editorial pages"
```

### Task 2: Rebuild Editorial Home as chaptered reading layout

**Files:**
- Modify: `frontend/src/views/demo/editorial/EditorialHomeDemo.vue`
- Modify: `frontend/src/styles/demo/editorial.css`
- Test: `frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders chapter directory, reading stream, and marginalia zones', () => {
  // verify semantic sections and core navigation links
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: FAIL due to old placeholder layout.

**Step 3: Write minimal implementation**

Implement three-column editorial spread:

1. Directory/issue navigation
2. Chaptered reading stream from notes
3. Marginalia panel (tags/stats/actions)

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial/EditorialHomeDemo.vue frontend/src/styles/demo/editorial.css frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts
git commit -m "feat(editorial): redesign home into chaptered magazine layout"
```

### Task 3: Rebuild Editorial Editor into writing desk

**Files:**
- Modify: `frontend/src/views/demo/editorial/EditorialEditorDemo.vue`
- Modify: `frontend/src/composables/demo/useDemoEditorState.ts`
- Modify: `frontend/src/styles/demo/editorial.css`
- Test: `frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts`

**Step 1: Write the failing test**

```ts
it('supports create/new article/edit modes with route-driven state', async () => {
  // verifies mode detection and save behavior
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- useDemoEditorState.spec.ts`  
Expected: FAIL because editor state lacks mode orchestration for default routes.

**Step 3: Write minimal implementation**

Implement writing desk structure and route-aware behavior:

1. Headline + deck + body structure
2. Metadata rail
3. Route-mode handling for create/article/edit

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- useDemoEditorState.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial/EditorialEditorDemo.vue frontend/src/composables/demo/useDemoEditorState.ts frontend/src/styles/demo/editorial.css frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts
git commit -m "feat(editorial): redesign editor as literary writing desk"
```

### Task 4: Rebuild Editorial Settings as editorial board controls

**Files:**
- Modify: `frontend/src/views/demo/editorial/EditorialSettingsDemo.vue`
- Modify: `frontend/src/styles/demo/editorial.css`
- Test: `frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts`

**Step 1: Write the failing test**

```ts
it('shows typography/material/cadence sections with accessible nav', () => {
  // verifies settings structure and nav labels
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: FAIL due to old simplified settings content.

**Step 3: Write minimal implementation**

Add editorial settings zones:

1. Typography system
2. Paper/material feel
3. Reading cadence
4. Writing behavior

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial/EditorialSettingsDemo.vue frontend/src/styles/demo/editorial.css frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts
git commit -m "feat(editorial): redesign settings as editorial control board"
```

### Task 5: Enforce Chinese-first literary typography system

**Files:**
- Modify: `frontend/src/styles/demo/editorial.css`
- Test: `frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('applies chinese-first typographic classes and constrained reading widths', () => {
  // verifies class/structure hooks for typography system
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: FAIL because typography hooks are missing.

**Step 3: Write minimal implementation**

Implement:

1. Chinese serif-first heading/body pairing
2. Body rhythm (size/line-height/measure)
3. Reduced high-contrast component chrome

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/styles/demo/editorial.css frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts
git commit -m "style(editorial): enforce chinese-first literary typography"
```

### Task 6: Mobile collapse and responsive behavior hardening

**Files:**
- Modify: `frontend/src/styles/demo/editorial.css`
- Modify: `frontend/src/views/demo/editorial/EditorialHomeDemo.vue`
- Test: `frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts`

**Step 1: Write the failing test**

```ts
it('keeps primary navigation and reading flow valid in collapsed mobile layout', () => {
  // verify semantic sections remain available
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: FAIL due to missing responsive hooks.

**Step 3: Write minimal implementation**

Implement mobile collapse:

1. Directory first
2. Reading stream second
3. Marginalia merged contextually

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/styles/demo/editorial.css frontend/src/views/demo/editorial/EditorialHomeDemo.vue frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts
git commit -m "fix(editorial): harden responsive collapsed reading layout"
```

### Task 7: Final verification and documentation sync

**Files:**
- Modify: `README.md`
- Create/Modify: `docs/plans/2026-03-08-editorial-full-redesign-notes.md`

**Step 1: Write verification checklist**

```md
- [ ] default routes open editorial pages
- [ ] create/edit/save still work
- [ ] tests and build pass
```

**Step 2: Run full verification**

Run: `cd frontend && npm test`  
Run: `cd frontend && npm run build`  
Expected: PASS.

**Step 3: Write docs**

Document route behavior and redesign intent.

**Step 4: Re-run verification**

Run: `cd frontend && npm test && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/plans/2026-03-08-editorial-full-redesign-notes.md
git commit -m "docs(editorial): sync default-flow redesign notes"
```

## Execution Notes

1. Use @test-driven-development for each task before implementation changes.
2. Use @systematic-debugging when failures are environment-related or indirect.
3. Use @verification-before-completion before claiming final completion.
4. Keep commits task-scoped and non-overlapping.

