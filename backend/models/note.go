package models

import "time"

// NoteType represents the type of note
type NoteType string

const (
	NoteTypeQuick   NoteType = "quick"   // 灵感小记
	NoteTypeArticle NoteType = "article" // 文章
)

// Note represents a note entity
type Note struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Tags       []string  `json:"tags"`
	Type       NoteType  `json:"type"` // quick or article
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	IsArchived bool      `json:"is_archived"`
	IsDeleted  bool      `json:"is_deleted"`
}

// CreateNoteRequest represents the request to create a note
type CreateNoteRequest struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
	Type    NoteType `json:"type"` // quick or article, defaults to "quick"
}

// UpdateNoteRequest represents the request to update a note
type UpdateNoteRequest struct {
	ID              int64     `json:"id"`
	Title           *string   `json:"title,omitempty"`
	Content         *string   `json:"content,omitempty"`
	Tags            *[]string `json:"tags,omitempty"`
	ExpectedVersion *int64    `json:"expected_version,omitempty"`
}

// GetNotesRequest represents the request to get notes
type GetNotesRequest struct {
	Limit     int      `json:"limit"`
	Offset    int      `json:"offset"`
	Tags      []string `json:"tags,omitempty"`
	Search    string   `json:"search,omitempty"`
	StartTime *string  `json:"start_time,omitempty"`
	EndTime   *string  `json:"end_time,omitempty"`
	Archived  *bool    `json:"archived,omitempty"`
}

// NoteStats represents statistics about notes
type NoteStats struct {
	TotalNotes    int      `json:"total_notes"`
	ActiveNotes   int      `json:"active_notes"`
	ArchivedNotes int      `json:"archived_notes"`
	WeeklyCount   int      `json:"weekly_count"`
	MonthlyCount  int      `json:"monthly_count"`
	AllTags       []string `json:"all_tags"`
}

// SearchResult represents a search result
type SearchResult struct {
	Notes   []*Note `json:"notes"`
	Total   int     `json:"total"`
	HasMore bool    `json:"has_more"`
}

// TagInfo represents tag information with count
type TagInfo struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}
