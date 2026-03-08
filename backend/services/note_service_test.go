package services

import (
	"database/sql"
	"strings"
	"testing"

	backenddb "panda-time-note/backend/db"
	"panda-time-note/backend/models"

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

func TestDraftSaveLoadDelete(t *testing.T) {
	svc := newTestService(t)

	payload := `{"title":"draft","content":"body","type":"article"}`
	if err := svc.SaveDraft(nil, payload); err != nil {
		t.Fatalf("save draft: %v", err)
	}

	got, err := svc.GetDraft(nil)
	if err != nil {
		t.Fatalf("get draft: %v", err)
	}
	if got != payload {
		t.Fatalf("unexpected draft payload: got %q want %q", got, payload)
	}

	if err := svc.DeleteDraft(nil); err != nil {
		t.Fatalf("delete draft: %v", err)
	}
	if _, err := svc.GetDraft(nil); err == nil {
		t.Fatalf("expected not found after delete")
	}
}

func TestUpdateWithVersionConflict(t *testing.T) {
	svc := newTestService(t)

	note, err := svc.Create(&models.CreateNoteRequest{
		Title:   "v1",
		Content: "body",
		Tags:    []string{},
		Type:    models.NoteTypeQuick,
	})
	if err != nil {
		t.Fatalf("create note: %v", err)
	}

	title1 := "v2"
	v1 := int64(1)
	if _, err := svc.Update(&models.UpdateNoteRequest{
		ID:              note.ID,
		Title:           &title1,
		ExpectedVersion: &v1,
	}); err != nil {
		t.Fatalf("first update should succeed: %v", err)
	}

	title2 := "v3"
	if _, err := svc.Update(&models.UpdateNoteRequest{
		ID:              note.ID,
		Title:           &title2,
		ExpectedVersion: &v1,
	}); err == nil || !strings.Contains(err.Error(), "conflict") {
		t.Fatalf("expected conflict, got: %v", err)
	}
}
