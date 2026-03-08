package services

import (
	"database/sql"
	"testing"

	backenddb "panda-time-note/backend/db"

	_ "github.com/mattn/go-sqlite3"
)

func newTestService(t *testing.T) *NoteService {
	t.Helper()
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := backenddb.RunMigrations(db); err != nil {
		t.Fatalf("run migrations: %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
	})
	return NewNoteService(db)
}

func TestSettingsRoundTrip(t *testing.T) {
	svc := newTestService(t)

	if err := svc.SetSetting("editorial.typography", "modern-geo"); err != nil {
		t.Fatalf("set setting: %v", err)
	}

	got, err := svc.GetSetting("editorial.typography")
	if err != nil {
		t.Fatalf("get setting: %v", err)
	}
	if got != "modern-geo" {
		t.Fatalf("unexpected value: got %q want %q", got, "modern-geo")
	}
}
