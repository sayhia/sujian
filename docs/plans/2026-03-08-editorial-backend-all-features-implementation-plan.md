# Editorial Backend All Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement backend feature evolution for Editorial flow: settings persistence, draft recovery, versioned updates, and recycle-bin recovery while preserving current API compatibility.

**Architecture:** Keep layered structure (`handlers -> services -> db/models`), add schema incrementally with idempotent migrations, and expose additive handler methods that do not break existing calls. Enforce TDD per task with focused Go tests and task-scoped commits.

**Tech Stack:** Go, SQLite, Wails service handlers, go test.

---

### Task 1: Add settings read/write backend API

**Files:**
- Modify: `backend/db/sqlite.go`
- Modify: `backend/services/note_service.go`
- Modify: `backend/handlers/note_handler.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing test**

```go
func TestSettingsRoundTrip(t *testing.T) {
  // SetSetting("editorial.typography", "modern-geo")
  // then GetSetting and assert same value
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/services -run TestSettingsRoundTrip -v`  
Expected: FAIL because setting APIs do not exist yet.

**Step 3: Write minimal implementation**

1. Reuse existing `settings` table.
2. Add `SetSetting(key, value)` and `GetSetting(key)` in service.
3. Expose handler methods with minimal validation (`key != ""`).

**Step 4: Run test to verify it passes**

Run: `go test ./backend/services -run TestSettingsRoundTrip -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/services/note_service.go backend/handlers/note_handler.go backend/services/note_service_test.go
git commit -m "feat(backend): add editorial settings get/set service api"
```

### Task 2: Add drafts table and draft recovery APIs

**Files:**
- Modify: `backend/db/sqlite.go`
- Modify: `backend/services/note_service.go`
- Modify: `backend/handlers/note_handler.go`
- Modify: `backend/models/note.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing test**

```go
func TestDraftSaveLoadDelete(t *testing.T) {
  // SaveDraft(nil, payload) -> GetDraft(nil) -> DeleteDraft(nil)
  // assert payload survives and delete clears it
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/services -run TestDraftSaveLoadDelete -v`  
Expected: FAIL because drafts schema/API do not exist.

**Step 3: Write minimal implementation**

1. Add idempotent `drafts` table migration.
2. Add `SaveDraft/GetDraft/DeleteDraft` service methods.
3. Add handler wrappers and DTO model (`DraftPayload`).

**Step 4: Run test to verify it passes**

Run: `go test ./backend/services -run TestDraftSaveLoadDelete -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/db/sqlite.go backend/models/note.go backend/services/note_service.go backend/handlers/note_handler.go backend/services/note_service_test.go
git commit -m "feat(backend): add draft recovery persistence api"
```

### Task 3: Add optimistic version field and conflict-safe update

**Files:**
- Modify: `backend/db/sqlite.go`
- Modify: `backend/models/note.go`
- Modify: `backend/services/note_service.go`
- Modify: `backend/handlers/note_handler.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing test**

```go
func TestUpdateWithVersionConflict(t *testing.T) {
  // create note version=1
  // update with expectedVersion=1 succeeds -> version=2
  // update again with expectedVersion=1 fails conflict
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/services -run TestUpdateWithVersionConflict -v`  
Expected: FAIL due to missing version column/logic.

**Step 3: Write minimal implementation**

1. Add `version INTEGER DEFAULT 1` migration (safe for existing DB).
2. Extend update request with `ExpectedVersion` (optional pointer).
3. On expected-version update, use conditional SQL and return conflict error.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/services -run TestUpdateWithVersionConflict -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/db/sqlite.go backend/models/note.go backend/services/note_service.go backend/handlers/note_handler.go backend/services/note_service_test.go
git commit -m "feat(backend): add optimistic versioned update with conflict detection"
```

### Task 4: Add recycle-bin restore and purge APIs

**Files:**
- Modify: `backend/services/note_service.go`
- Modify: `backend/handlers/note_handler.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing test**

```go
func TestRestoreAndPurgeDeleted(t *testing.T) {
  // soft delete note -> restore -> exists
  // soft delete old note -> purge(before) -> gone
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/services -run TestRestoreAndPurgeDeleted -v`  
Expected: FAIL because restore/purge methods are absent.

**Step 3: Write minimal implementation**

1. Add `Restore(id)` and `BatchRestore(ids)`.
2. Add `PurgeDeleted(beforeTime)` for physical cleanup of deleted notes.
3. Expose handler methods.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/services -run TestRestoreAndPurgeDeleted -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/services/note_service.go backend/handlers/note_handler.go backend/services/note_service_test.go
git commit -m "feat(backend): add restore and purge recycle-bin operations"
```

### Task 5: Add structured error typing for service-level conflict/validation

**Files:**
- Create: `backend/models/errors.go`
- Modify: `backend/services/note_service.go`
- Test: `backend/services/note_service_test.go`

**Step 1: Write the failing test**

```go
func TestServiceErrorKinds(t *testing.T) {
  // trigger conflict and validation failures
  // assert typed error kind values
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./backend/services -run TestServiceErrorKinds -v`  
Expected: FAIL due to untyped generic errors.

**Step 3: Write minimal implementation**

1. Add error kind enum: `validation_error/not_found/conflict/storage_error`.
2. Wrap service errors with kind + message.
3. Keep external method signatures unchanged.

**Step 4: Run test to verify it passes**

Run: `go test ./backend/services -run TestServiceErrorKinds -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/models/errors.go backend/services/note_service.go backend/services/note_service_test.go
git commit -m "refactor(backend): standardize service error kinds"
```

### Task 6: Full backend verification and docs sync

**Files:**
- Modify: `docs/plans/2026-03-08-editorial-backend-all-features-design.md`
- Create/Modify: `docs/plans/2026-03-08-editorial-backend-all-features-notes.md`

**Step 1: Write verification checklist**

```md
- [ ] settings get/set works
- [ ] drafts save/load/delete works
- [ ] version conflict detection works
- [ ] restore/purge works
- [ ] service error kinds are typed
- [ ] backend tests pass
```

**Step 2: Run full backend verification**

Run: `go test ./backend/...`  
Expected: PASS.

**Step 3: Write docs**

1. Update design doc status with completed capability matrix.
2. Add backend notes with test evidence and migration summary.

**Step 4: Re-run verification**

Run: `go test ./backend/...`  
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-08-editorial-backend-all-features-design.md docs/plans/2026-03-08-editorial-backend-all-features-notes.md
git commit -m "docs(backend): sync all-features implementation notes and verification"
```

## Execution Notes

1. Use @test-driven-development for every task.
2. Use @systematic-debugging for non-deterministic DB/test failures.
3. Use @verification-before-completion before final completion claim.
4. Keep commits task-scoped and non-overlapping.
