# Editorial Backend All Features Notes

## Verification Checklist

- [x] settings get/set works
- [x] drafts save/load/delete works
- [x] version conflict detection works
- [x] restore/purge works
- [x] service error kinds are typed
- [x] backend tests pass

## Verification Evidence

1. `go test ./backend/services -run TestSettingsRoundTrip -v` PASS
2. `go test ./backend/services -run TestDraftSaveLoadDelete -v` PASS
3. `go test ./backend/services -run TestUpdateWithVersionConflict -v` PASS
4. `go test ./backend/services -run TestRestoreAndPurgeDeleted -v` PASS
5. `go test ./backend/services -run TestServiceErrorKinds -v` PASS
6. `go test ./backend/...` PASS

## Implementation Summary

1. Added backend settings persistence APIs (`SetSetting/GetSetting`).
2. Added `drafts` storage and draft CRUD-like service methods.
3. Added `ExpectedVersion` support with conflict-safe update path.
4. Added recycle-bin restore and physical purge operations.
5. Added typed service errors via `models.AppError` and `ErrorKind`.
