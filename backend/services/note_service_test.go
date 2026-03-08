package services

import (
	"database/sql"
	"errors"
	"strings"
	"testing"
	"time"

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

func TestServiceErrorKinds(t *testing.T) {
	svc := newTestService(t)

	if err := svc.SetSetting("", "x"); err == nil {
		t.Fatalf("expected validation error")
	} else {
		var appErr *models.AppError
		if !errors.As(err, &appErr) || appErr.Kind != models.ErrorKindValidation {
			t.Fatalf("unexpected error kind: %v", err)
		}
	}

	note, err := svc.Create(&models.CreateNoteRequest{Title: "v1", Content: "body", Tags: []string{}, Type: models.NoteTypeQuick})
	if err != nil {
		t.Fatalf("create note: %v", err)
	}
	title := "v2"
	v1 := int64(1)
	if _, err := svc.Update(&models.UpdateNoteRequest{ID: note.ID, Title: &title, ExpectedVersion: &v1}); err != nil {
		t.Fatalf("first update should succeed: %v", err)
	}
	title2 := "v3"
	if _, err := svc.Update(&models.UpdateNoteRequest{ID: note.ID, Title: &title2, ExpectedVersion: &v1}); err == nil {
		t.Fatalf("expected conflict error")
	} else {
		var appErr *models.AppError
		if !errors.As(err, &appErr) || appErr.Kind != models.ErrorKindConflict {
			t.Fatalf("unexpected error kind: %v", err)
		}
	}
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

func TestRestoreAndPurgeDeleted(t *testing.T) {
	svc := newTestService(t)

	n1, err := svc.Create(&models.CreateNoteRequest{Title: "restore", Content: "body", Tags: []string{}, Type: models.NoteTypeQuick})
	if err != nil {
		t.Fatalf("create n1: %v", err)
	}
	if err := svc.Delete(n1.ID); err != nil {
		t.Fatalf("delete n1: %v", err)
	}
	if err := svc.Restore(n1.ID); err != nil {
		t.Fatalf("restore n1: %v", err)
	}
	if _, err := svc.GetByID(n1.ID); err != nil {
		t.Fatalf("expected restored note: %v", err)
	}

	n2, err := svc.Create(&models.CreateNoteRequest{Title: "purge", Content: "body", Tags: []string{}, Type: models.NoteTypeQuick})
	if err != nil {
		t.Fatalf("create n2: %v", err)
	}
	if err := svc.Delete(n2.ID); err != nil {
		t.Fatalf("delete n2: %v", err)
	}
	deleted, err := svc.PurgeDeleted(time.Now().Add(time.Hour))
	if err != nil {
		t.Fatalf("purge: %v", err)
	}
	if deleted < 1 {
		t.Fatalf("expected at least one purged row, got %d", deleted)
	}
	if _, err := svc.GetByID(n2.ID); err == nil {
		t.Fatalf("expected note to be purged")
	}
}
