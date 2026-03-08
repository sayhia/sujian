package handlers

import (
	"panda-time-note/backend/models"
	"panda-time-note/backend/services"
)

// NoteHandler handles note-related operations
type NoteHandler struct {
	service *services.NoteService
}

// NewNoteHandler creates a new NoteHandler
func NewNoteHandler(service *services.NoteService) *NoteHandler {
	return &NoteHandler{service: service}
}

// Create creates a new note
func (h *NoteHandler) Create(title, content string, tags []string, noteType string) (*models.Note, error) {
	if tags == nil {
		tags = []string{}
	}
	// Default to "quick" if type is empty
	if noteType == "" {
		noteType = "quick"
	}
	req := &models.CreateNoteRequest{
		Title:   title,
		Content: content,
		Tags:    tags,
		Type:    models.NoteType(noteType),
	}
	return h.service.Create(req)
}

// GetAll retrieves all notes with optional filters
func (h *NoteHandler) GetAll(limit, offset int, tags []string, archived bool) ([]*models.Note, error) {
	if tags == nil {
		tags = []string{}
	}
	req := &models.GetNotesRequest{
		Limit:    limit,
		Offset:   offset,
		Tags:     tags,
		Archived: &archived,
	}
	return h.service.GetAll(req)
}

// GetByID retrieves a note by ID
func (h *NoteHandler) GetByID(id int64) (*models.Note, error) {
	return h.service.GetByID(id)
}

// Update updates an existing note
func (h *NoteHandler) Update(id int64, title, content *string, tags *[]string) (*models.Note, error) {
	req := &models.UpdateNoteRequest{
		ID:      id,
		Title:   title,
		Content: content,
		Tags:    tags,
	}
	return h.service.Update(req)
}

// Delete soft deletes a note
func (h *NoteHandler) Delete(id int64) error {
	return h.service.Delete(id)
}

// Archive archives or unarchives a note
func (h *NoteHandler) Archive(id int64, archive bool) error {
	return h.service.Archive(id, archive)
}

// Search searches notes by query using FTS5
func (h *NoteHandler) Search(query string, limit int) (*models.SearchResult, error) {
	if limit <= 0 {
		limit = 10
	}
	return h.service.Search(query, limit)
}

// SearchWithHighlight searches notes and returns highlighted snippets
func (h *NoteHandler) SearchWithHighlight(query string, limit int) (*models.SearchResult, error) {
	if limit <= 0 {
		limit = 10
	}
	return h.service.SearchWithHighlight(query, limit)
}

// GetStats returns statistics about notes
func (h *NoteHandler) GetStats() (*models.NoteStats, error) {
	return h.service.GetStats()
}

// GetAllTags returns all unique tags
func (h *NoteHandler) GetAllTags() []string {
	return h.service.GetAllTags()
}

// GetTagsWithCount returns all tags with their usage counts
func (h *NoteHandler) GetTagsWithCount() []*models.TagInfo {
	return h.service.GetTagsWithCount()
}

// GetFiltered retrieves notes with advanced filters
func (h *NoteHandler) GetFiltered(limit, offset int, tags []string, search string, archived *bool, startTime, endTime *string) ([]*models.Note, error) {
	if tags == nil {
		tags = []string{}
	}
	req := &models.GetNotesRequest{
		Limit:     limit,
		Offset:    offset,
		Tags:      tags,
		Search:    search,
		Archived:  archived,
		StartTime: startTime,
		EndTime:   endTime,
	}
	return h.service.GetAll(req)
}

// BatchDelete deletes multiple notes
func (h *NoteHandler) BatchDelete(ids []int64) (int, error) {
	return h.service.BatchDelete(ids)
}

// BatchArchive archives multiple notes
func (h *NoteHandler) BatchArchive(ids []int64, archive bool) (int, error) {
	return h.service.BatchArchive(ids, archive)
}

// ResetAllData drops and recreates note-related tables.
// 用于“清空所有数据，直接删表重建”的场景。
func (h *NoteHandler) ResetAllData() error {
	return h.service.ResetAllData()
}

// IsFTSEnabled returns whether FTS5 full-text search is enabled
func (h *NoteHandler) IsFTSEnabled() bool {
	return h.service.IsFTSEnabled()
}

// SetSetting sets a backend settings key/value pair.
func (h *NoteHandler) SetSetting(key, value string) error {
	return h.service.SetSetting(key, value)
}

// GetSetting gets a backend settings value by key.
func (h *NoteHandler) GetSetting(key string) (string, error) {
	return h.service.GetSetting(key)
}
