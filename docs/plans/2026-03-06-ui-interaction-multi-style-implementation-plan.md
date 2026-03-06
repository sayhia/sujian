# Multi-Style UI Interaction Demo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build four route-isolated, near-full redesign demos (Minimal, Editorial, Dashboard, Capsule) covering Home + Editor + Settings while reusing existing data/business logic.

**Architecture:** Keep existing production pages/components untouched and add a demo-only route tree. Introduce shared demo composables for note/editor behavior so each style owns only layout and interaction choreography. Isolate style tokens per demo to avoid polluting production theme variables and CSS behavior.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Vue I18n, Vitest, Wails frontend bindings.

---

### Task 1: Add Demo Route Skeleton

**Files:**
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/router/__tests__/demoRoutes.spec.ts`

**Step 1: Write the failing test**

```ts
import router from '../../router';

it('contains all demo style route groups', () => {
  const paths = router.getRoutes().map(r => r.path);
  expect(paths).toContain('/demo/styles');
  expect(paths).toContain('/demo/minimal');
  expect(paths).toContain('/demo/editorial');
  expect(paths).toContain('/demo/dashboard');
  expect(paths).toContain('/demo/capsule');
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: FAIL because demo routes do not exist.

**Step 3: Write minimal implementation**

Add route records for:

1. `/demo/styles`
2. `/demo/minimal`, `/demo/minimal/editor`, `/demo/minimal/settings`
3. `/demo/editorial`, `/demo/editorial/editor`, `/demo/editorial/settings`
4. `/demo/dashboard`, `/demo/dashboard/editor`, `/demo/dashboard/settings`
5. `/demo/capsule`, `/demo/capsule/editor`, `/demo/capsule/settings`

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoRoutes.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/router/index.ts frontend/src/router/__tests__/demoRoutes.spec.ts
git commit -m "feat(demo): add multi-style demo route skeleton"
```

### Task 2: Build Demo Entry Selector Page

**Files:**
- Create: `frontend/src/views/demo/DemoStyleSelector.vue`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/views/demo/__tests__/DemoStyleSelector.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders 4 style cards with navigation links', () => {
  // Minimal, Editorial, Dashboard, Capsule
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- DemoStyleSelector.spec.ts`  
Expected: FAIL because selector view is missing.

**Step 3: Write minimal implementation**

Create selector page with 4 cards and links to each style home route.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- DemoStyleSelector.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/DemoStyleSelector.vue frontend/src/router/index.ts frontend/src/views/demo/__tests__/DemoStyleSelector.spec.ts
git commit -m "feat(demo): add style selector entry page"
```

### Task 3: Add Shared Demo Behavior Composables

**Files:**
- Create: `frontend/src/composables/demo/useDemoNotesViewModel.ts`
- Create: `frontend/src/composables/demo/useDemoEditorState.ts`
- Test: `frontend/src/composables/demo/__tests__/useDemoNotesViewModel.spec.ts`
- Test: `frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts`

**Step 1: Write the failing tests**

```ts
it('normalizes filtering/search state for demo pages', () => {});
it('provides consistent editor save/create flow wrappers', () => {});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- useDemoNotesViewModel.spec.ts useDemoEditorState.spec.ts`  
Expected: FAIL because composables are missing.

**Step 3: Write minimal implementation**

Implement shared wrappers that call existing note store actions and expose unified computed/commands.

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- useDemoNotesViewModel.spec.ts useDemoEditorState.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/composables/demo/useDemoNotesViewModel.ts frontend/src/composables/demo/useDemoEditorState.ts frontend/src/composables/demo/__tests__/useDemoNotesViewModel.spec.ts frontend/src/composables/demo/__tests__/useDemoEditorState.spec.ts
git commit -m "refactor(demo): add shared demo behavior composables"
```

### Task 4: Implement Minimal Style (Home + Editor + Settings)

**Files:**
- Create: `frontend/src/views/demo/minimal/MinimalHomeDemo.vue`
- Create: `frontend/src/views/demo/minimal/MinimalEditorDemo.vue`
- Create: `frontend/src/views/demo/minimal/MinimalSettingsDemo.vue`
- Create: `frontend/src/styles/demo/minimal.css`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/views/demo/minimal/__tests__/MinimalDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders minimal style core layout and can navigate home/editor/settings', () => {});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- MinimalDemo.spec.ts`  
Expected: FAIL because minimal demo pages do not exist.

**Step 3: Write minimal implementation**

Add minimal demo views using shared composables and minimal style tokens.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- MinimalDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/minimal frontend/src/styles/demo/minimal.css frontend/src/router/index.ts
git commit -m "feat(demo-minimal): add minimal home editor settings demos"
```

### Task 5: Implement Editorial Style (Home + Editor + Settings)

**Files:**
- Create: `frontend/src/views/demo/editorial/EditorialHomeDemo.vue`
- Create: `frontend/src/views/demo/editorial/EditorialEditorDemo.vue`
- Create: `frontend/src/views/demo/editorial/EditorialSettingsDemo.vue`
- Create: `frontend/src/styles/demo/editorial.css`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/views/demo/editorial/__tests__/EditorialDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders editorial chapter-like layout and navigation triad', () => {});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Add editorial demo views with strong typography hierarchy and sectioned timeline layout.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- EditorialDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/editorial frontend/src/styles/demo/editorial.css frontend/src/router/index.ts
git commit -m "feat(demo-editorial): add editorial style demo pages"
```

### Task 6: Implement Dashboard Style (Home + Editor + Settings)

**Files:**
- Create: `frontend/src/views/demo/dashboard/DashboardHomeDemo.vue`
- Create: `frontend/src/views/demo/dashboard/DashboardEditorDemo.vue`
- Create: `frontend/src/views/demo/dashboard/DashboardSettingsDemo.vue`
- Create: `frontend/src/styles/demo/dashboard.css`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/views/demo/dashboard/__tests__/DashboardDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders dashboard KPI/filter layout and dense editor/settings pattern', () => {});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- DashboardDemo.spec.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Add dashboard demo views with KPI strip, dense controls, and split editor layout.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- DashboardDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/dashboard frontend/src/styles/demo/dashboard.css frontend/src/router/index.ts
git commit -m "feat(demo-dashboard): add dashboard style demo pages"
```

### Task 7: Implement Capsule Style (Home + Editor + Settings)

**Files:**
- Create: `frontend/src/views/demo/capsule/CapsuleHomeDemo.vue`
- Create: `frontend/src/views/demo/capsule/CapsuleEditorDemo.vue`
- Create: `frontend/src/views/demo/capsule/CapsuleSettingsDemo.vue`
- Create: `frontend/src/styles/demo/capsule.css`
- Modify: `frontend/src/router/index.ts`
- Test: `frontend/src/views/demo/capsule/__tests__/CapsuleDemo.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders capsule-priority timeline and lock/unlock emotional states', () => {});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- CapsuleDemo.spec.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Add capsule style demos with narrative timeline and capsule-first interaction emphasis.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- CapsuleDemo.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo/capsule frontend/src/styles/demo/capsule.css frontend/src/router/index.ts
git commit -m "feat(demo-capsule): add capsule style demo pages"
```

### Task 8: Responsive + Accessibility Hardening

**Files:**
- Modify: `frontend/src/styles/demo/*.css`
- Modify: `frontend/src/views/demo/**/*.vue`
- Test: `frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts`

**Step 1: Write the failing test**

```ts
it('keeps primary actions visible on mobile breakpoints', () => {});
it('provides heading landmarks and accessible nav labels in all demos', () => {});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation**

Apply breakpoint fixes, focus styles, aria labels, and semantic landmark structure.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- demoResponsiveA11y.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/demo frontend/src/styles/demo frontend/src/views/demo/__tests__/demoResponsiveA11y.spec.ts
git commit -m "fix(demo): improve responsive layout and accessibility"
```

### Task 9: Final Verification and Demo Documentation

**Files:**
- Create: `docs/plans/2026-03-06-ui-interaction-demo-notes.md`
- Modify: `README.md`

**Step 1: Write verification checklist**

```md
- [ ] all demo routes accessible
- [ ] core create/edit/search actions work in each style
- [ ] frontend build passes
```

**Step 2: Run full checks**

Run: `cd frontend && npm test`  
Run: `cd frontend && npm run build`  
Expected: PASS.

**Step 3: Write docs**

Document route map, style intent, and comparison guidance.

**Step 4: Re-run checks**

Run: `cd frontend && npm test && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/plans/2026-03-06-ui-interaction-demo-notes.md
git commit -m "docs(demo): add multi-style demo usage and comparison notes"
```

## Execution Notes

1. Use @test-driven-development for each task before editing implementation.
2. Use @systematic-debugging whenever a test failure root cause is unclear.
3. Use @verification-before-completion before claiming delivery.
4. Keep each commit strictly single-purpose by task.

