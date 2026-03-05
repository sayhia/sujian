# Time-Note Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace legacy note model with the new destructive-upgrade model and deliver capture/timeline/capsule/search with system notifications.

**Architecture:** Use schema-first replacement in SQLite (via reset + recreate), then refactor backend handlers/services around the new fields. Reuse existing Vue page/component structure and store flow, but switch all typing/query/rendering to the new model. Keep backend as source of truth for filtering/search and add capsule unlock + notification scheduling.

**Tech Stack:** Go, SQLite/FTS5, Wails v3, Vue 3, Pinia, TypeScript, Vitest (frontend), Go test.

---

### Task 1: Replace database schema and migration primitives

**Files:**
- Modify: `backend/db/sqlite.go`
- Test: `backend/db/sqlite_migration_test.go`

**Step 1: Write the failing test**

```go
func TestRunMigrations_CreatesNewNotesSchema(t *testing.T) {
    // assert new columns (scene/kind/state/unlock_at/remind_at/search_text/pinned) exist
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/db -run TestRunMigrations_CreatesNewNotesSchema -v`  
Expected: FAIL because schema still contains old columns.

**Step 3: Write minimal implementation**

Update `RunMigrations` to create only the new `notes` schema, new indexes, new FTS table/triggers.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/db -run TestRunMigrations_CreatesNewNotesSchema -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/db/sqlite.go backend/db/sqlite_migration_test.go
git commit -m "feat(db): replace notes schema with new time-note model"
```

### Task 2: Replace backend model types and requests

**Files:**
- Modify: `backend/models/note.go`
- Test: `backend/models/note_model_test.go`

**Step 1: Write the failing test**

```go
func TestNoteModel_NewFieldsPresent(t *testing.T) {
    // verify request/response structs include scene/kind/state/unlock/remind/search_text/pinned
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/models -run TestNoteModel_NewFieldsPresent -v`  
Expected: FAIL due to missing fields/types.

**Step 3: Write minimal implementation**

Replace old `NoteType` and old request structs with new enums/fields.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/models -run TestNoteModel_NewFieldsPresent -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/models/note.go backend/models/note_model_test.go
git commit -m "refactor(models): introduce new note domain fields"
```

### Task 3: Refactor service queries and state transitions

**Files:**
- Modify: `backend/services/note_service.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing tests**

```go
func TestListNotes_FilterBySceneKindState(t *testing.T) {}
func TestCapsuleUnlock_TransitionsState(t *testing.T) {}
func TestSearch_FTSFallbackLike(t *testing.T) {}
```

**Step 2: Run tests to verify they fail**

Run: `go test ./backend/services -run "TestListNotes|TestCapsuleUnlock|TestSearch" -v`  
Expected: FAIL with old query/state assumptions.

**Step 3: Write minimal implementation**

Refactor CRUD/list/search to new schema and add capsule unlock query path.

**Step 4: Run tests to verify they pass**

Run: `go test ./backend/services -run "TestListNotes|TestCapsuleUnlock|TestSearch" -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/services/note_service.go backend/services/note_service_test.go
git commit -m "feat(service): add new filtering and capsule unlock state flow"
```

### Task 4: Update handler contract and Wails bindings surface

**Files:**
- Modify: `backend/handlers/note_handler.go`
- Modify: `main.go`
- Regenerate/Update: `frontend/bindings/panda-time-note/backend/handlers/notehandler.ts`
- Test: `backend/handlers/note_handler_test.go`

**Step 1: Write the failing test**

```go
func TestGetFiltered_BindsNewRequestFields(t *testing.T) {}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/handlers -run TestGetFiltered_BindsNewRequestFields -v`  
Expected: FAIL with old request signature.

**Step 3: Write minimal implementation**

Update handler signatures/request mapping and ensure services are exposed correctly.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/handlers -run TestGetFiltered_BindsNewRequestFields -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/handlers/note_handler.go backend/handlers/note_handler_test.go main.go frontend/bindings/panda-time-note/backend/handlers/notehandler.ts
git commit -m "refactor(api): align note handler contracts with new model"
```

### Task 5: Add notification scheduler service and startup compensation

**Files:**
- Create: `backend/services/notification_service.go`
- Create: `backend/services/capsule_scheduler_service.go`
- Modify: `main.go`
- Test: `backend/services/capsule_scheduler_service_test.go`

**Step 1: Write the failing tests**

```go
func TestScheduler_UnlocksDueCapsulesOnTick(t *testing.T) {}
func TestScheduler_CompensationOnStartup(t *testing.T) {}
```

**Step 2: Run tests to verify they fail**

Run: `go test ./backend/services -run "TestScheduler_UnlocksDueCapsulesOnTick|TestScheduler_CompensationOnStartup" -v`  
Expected: FAIL because scheduler does not exist.

**Step 3: Write minimal implementation**

Add scheduler loop + startup scan + notification abstraction with safe fallback behavior.

**Step 4: Run tests to verify they pass**

Run: `go test ./backend/services -run "TestScheduler_UnlocksDueCapsulesOnTick|TestScheduler_CompensationOnStartup" -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/services/notification_service.go backend/services/capsule_scheduler_service.go backend/services/capsule_scheduler_service_test.go main.go
git commit -m "feat(capsule): add unlock scheduler and notification pipeline"
```

### Task 6: Replace frontend note typings and store mapping

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/stores/noteStore.ts`
- Modify: `frontend/src/types/global.d.ts`
- Test: `frontend/src/stores/__tests__/noteStore.spec.ts`

**Step 1: Write the failing test**

```ts
it('maps backend note payload into new note model fields', () => {
  // expects scene/kind/state/unlock_at/remind_policy/pinned
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- noteStore.spec.ts`  
Expected: FAIL due to old `type/is_archived/is_deleted` mapping.

**Step 3: Write minimal implementation**

Update note types, store mapping, create/update/list query state.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- noteStore.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/stores/noteStore.ts frontend/src/types/global.d.ts frontend/src/stores/__tests__/noteStore.spec.ts
git commit -m "refactor(frontend): migrate note store and types to new schema"
```

### Task 7: Reuse timeline and card UI with new capsule/state rendering

**Files:**
- Modify: `frontend/src/views/Home.vue`
- Modify: `frontend/src/components/Timeline.vue`
- Modify: `frontend/src/components/NoteCapsule.vue`
- Test: `frontend/src/components/__tests__/Timeline.spec.ts`
- Test: `frontend/src/components/__tests__/NoteCapsule.spec.ts`

**Step 1: Write the failing tests**

```ts
it('shows locked capsule content as hidden before unlock_at', () => {})
it('shows countdown and unlocked marker in timeline cards', () => {})
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- Timeline.spec.ts NoteCapsule.spec.ts`  
Expected: FAIL because current card assumes old note shape.

**Step 3: Write minimal implementation**

Add scene/kind/state filters and capsule lock/unlock rendering while preserving existing layout structure.

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- Timeline.spec.ts NoteCapsule.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/views/Home.vue frontend/src/components/Timeline.vue frontend/src/components/NoteCapsule.vue frontend/src/components/__tests__/Timeline.spec.ts frontend/src/components/__tests__/NoteCapsule.spec.ts
git commit -m "feat(ui): add capsule lock/unlock and new filter rendering"
```

### Task 8: Unify search behavior to backend source of truth

**Files:**
- Modify: `frontend/src/components/Timeline.vue`
- Modify: `frontend/src/views/Home.vue`
- Modify: `backend/services/note_service.go`
- Test: `frontend/src/views/__tests__/HomeSearch.spec.ts`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing tests**

```ts
it('renders exactly backend search results without local second-pass filtering', () => {})
```

```go
func TestSearchResult_OrderAndFilterConsistency(t *testing.T) {}
```

**Step 2: Run tests to verify they fail**

Run: `go test ./backend/services -run TestSearchResult_OrderAndFilterConsistency -v`  
Run: `cd frontend && npm test -- HomeSearch.spec.ts`  
Expected: FAIL due to local filtering divergence.

**Step 3: Write minimal implementation**

Remove redundant local search pass and rely on backend-filtered result sets.

**Step 4: Run tests to verify they pass**

Run: `go test ./backend/services -run TestSearchResult_OrderAndFilterConsistency -v`  
Run: `cd frontend && npm test -- HomeSearch.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/services/note_service.go frontend/src/components/Timeline.vue frontend/src/views/Home.vue frontend/src/views/__tests__/HomeSearch.spec.ts backend/services/note_service_test.go
git commit -m "fix(search): make backend search the single source of truth"
```

### Task 9: End-to-end verification and release readiness

**Files:**
- Modify: `README.md`
- Create: `docs/release-notes/2026-03-major-upgrade.md`

**Step 1: Write the failing verification checklist**

```md
- [ ] ResetAllData executes once on upgrade
- [ ] New note creation/edit/search works
- [ ] Capsule unlock triggers notification
```

**Step 2: Run full verification**

Run: `go test ./...`  
Run: `cd frontend && npm run build`  
Expected: PASS.

**Step 3: Implement release docs**

Add major-upgrade note that existing notes are intentionally cleared.

**Step 4: Re-run verification**

Run: `go test ./... && cd frontend && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/release-notes/2026-03-major-upgrade.md
git commit -m "docs(release): document destructive major-upgrade behavior"
```

## Execution Notes

1. Use @test-driven-development for each task before implementation edits.
2. Use @systematic-debugging if any failing test is unclear.
3. Use @verification-before-completion before claiming done.
4. Keep commits task-scoped and avoid mixed-purpose commits.

