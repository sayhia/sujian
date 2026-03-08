package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"panda-time-note/backend/db"
	"panda-time-note/backend/models"
)

type NoteService struct {
	db         *sql.DB
	ftsEnabled bool
}

func NewNoteService(db *sql.DB) *NoteService {
	service := &NoteService{db: db}
	service.checkFTSEnabled()
	return service
}

// checkFTSEnabled checks if FTS5 is available
func (s *NoteService) checkFTSEnabled() {
	var name string
	err := s.db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'").Scan(&name)
	s.ftsEnabled = err == nil && name == "notes_fts"
	if s.ftsEnabled {
		fmt.Println("FTS5 full-text search enabled")
	}
}

// Create creates a new note
func (s *NoteService) Create(req *models.CreateNoteRequest) (*models.Note, error) {
	now := time.Now()

	// Ensure tags is not nil
	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	// Default to "quick" if type is empty
	noteType := req.Type
	if noteType == "" {
		noteType = models.NoteTypeQuick
	}

	tagsJSON, err := json.Marshal(tags)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal tags: %w", err)
	}

	result, err := s.db.Exec(`
		INSERT INTO notes (title, content, tags, type, created_at, updated_at, is_archived, is_deleted)
		VALUES (?, ?, ?, ?, ?, ?, 0, 0)
	`, req.Title, req.Content, tagsJSON, string(noteType), now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to insert note: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	return &models.Note{
		ID:         id,
		Title:      req.Title,
		Content:    req.Content,
		Tags:       tags,
		Type:       noteType,
		CreatedAt:  now,
		UpdatedAt:  now,
		IsArchived: false,
		IsDeleted:  false,
	}, nil
}

// GetByID retrieves a note by ID
func (s *NoteService) GetByID(id int64) (*models.Note, error) {
	note := &models.Note{}

	var tagsJSON sql.NullString
	var noteType string
	err := s.db.QueryRow(`
		SELECT id, title, content, tags, type, created_at, updated_at, is_archived, is_deleted
		FROM notes WHERE id = ? AND is_deleted = 0
	`, id).Scan(&note.ID, &note.Title, &note.Content, &tagsJSON, &noteType, &note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("note not found")
		}
		return nil, fmt.Errorf("failed to get note: %w", err)
	}

	note.Tags = []string{}
	if tagsJSON.Valid && tagsJSON.String != "" {
		json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
	}

	note.Type = models.NoteType(noteType)

	return note, nil
}

// GetAll retrieves all notes with optional filters
func (s *NoteService) GetAll(req *models.GetNotesRequest) ([]*models.Note, error) {
	query := `
		SELECT id, title, content, tags, type, created_at, updated_at, is_archived, is_deleted
		FROM notes WHERE is_deleted = 0
	`
	args := []interface{}{}

	// Filter by tags
	if len(req.Tags) > 0 {
		for _, tag := range req.Tags {
			query += " AND tags LIKE ?"
			args = append(args, "%\""+tag+"\"%")
		}
	}

	// Filter by search query (use FTS if available, otherwise LIKE)
	if req.Search != "" {
		if s.ftsEnabled {
			// Use FTS5 for search
			query = `
				SELECT n.id, n.title, n.content, n.tags, n.type, n.created_at, n.updated_at, n.is_archived, n.is_deleted
				FROM notes n
				INNER JOIN notes_fts fts ON n.id = fts.rowid
				WHERE n.is_deleted = 0 AND notes_fts MATCH ?
			`
			args = []interface{}{s.buildFTSQuery(req.Search)}

			// Re-add tag filters
			if len(req.Tags) > 0 {
				for _, tag := range req.Tags {
					query += " AND n.tags LIKE ?"
					args = append(args, "%\""+tag+"\"%")
				}
			}
		} else {
			query += " AND (title LIKE ? OR content LIKE ?)"
			searchPattern := "%" + req.Search + "%"
			args = append(args, searchPattern, searchPattern)
		}
	}

	// Filter by time range
	if req.StartTime != nil && *req.StartTime != "" {
		if s.ftsEnabled && req.Search != "" {
			query += " AND n.created_at >= ?"
		} else {
			query += " AND created_at >= ?"
		}
		args = append(args, *req.StartTime)
	}

	if req.EndTime != nil && *req.EndTime != "" {
		if s.ftsEnabled && req.Search != "" {
			query += " AND n.created_at <= ?"
		} else {
			query += " AND created_at <= ?"
		}
		args = append(args, *req.EndTime)
	}

	// Filter by archived status
	if req.Archived != nil {
		if s.ftsEnabled && req.Search != "" {
			query += " AND n.is_archived = ?"
		} else {
			query += " AND is_archived = ?"
		}
		args = append(args, *req.Archived)
	}

	// Order by
	if s.ftsEnabled && req.Search != "" {
		query += " ORDER BY rank, n.created_at DESC"
	} else {
		query += " ORDER BY created_at DESC"
	}

	// Apply pagination
	if req.Limit > 0 {
		query += " LIMIT ?"
		args = append(args, req.Limit)
	}
	if req.Offset > 0 {
		query += " OFFSET ?"
		args = append(args, req.Offset)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query notes: %w", err)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note := &models.Note{}
		var tagsJSON sql.NullString
		var typeStr sql.NullString
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &tagsJSON, &typeStr, &note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}
		note.Tags = []string{}
		if tagsJSON.Valid && tagsJSON.String != "" {
			json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		// Default to "quick" if type is empty
		if typeStr.Valid && typeStr.String != "" {
			note.Type = models.NoteType(typeStr.String)
		} else {
			note.Type = models.NoteTypeQuick
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// buildFTSQuery builds an FTS5 query string
func (s *NoteService) buildFTSQuery(query string) string {
	// Split query into words and create FTS5 query
	words := strings.Fields(query)
	if len(words) == 0 {
		return query
	}

	// Build query with prefix matching for each word
	parts := make([]string, len(words))
	for i, word := range words {
		// Escape special FTS5 characters
		escaped := strings.ReplaceAll(word, "\"", "\"\"")
		// Use prefix matching (word*) for partial matches
		parts[i] = fmt.Sprintf("\"%s\"*", escaped)
	}

	// Join with implicit AND
	return strings.Join(parts, " ")
}

// Search searches notes by query using FTS5
func (s *NoteService) Search(query string, limit int) (*models.SearchResult, error) {
	if limit <= 0 {
		limit = 20
	}

	var notes []*models.Note
	var total int

	if s.ftsEnabled {
		// Use FTS5 for searching
		ftsQuery := s.buildFTSQuery(query)

		sqlQuery := `
			SELECT n.id, n.title, n.content, n.tags, n.created_at, n.updated_at, n.is_archived, n.is_deleted,
				   bm25(notes_fts, 10.0, 5.0, 1.0) as rank
			FROM notes n
			INNER JOIN notes_fts fts ON n.id = fts.rowid
			WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
			ORDER BY rank
			LIMIT ?
		`

		rows, err := s.db.Query(sqlQuery, ftsQuery, limit+1)
		if err != nil {
			// Fallback to LIKE search if FTS fails
			return s.searchWithLike(query, limit)
		}
		defer rows.Close()

		for rows.Next() {
			note := &models.Note{}
			var tagsJSON sql.NullString
			var rank float64
			err := rows.Scan(&note.ID, &note.Title, &note.Content, &tagsJSON, &note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted, &rank)
			if err != nil {
				return nil, fmt.Errorf("failed to scan note: %w", err)
			}
			note.Tags = []string{}
			if tagsJSON.Valid && tagsJSON.String != "" {
				json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
			}
			notes = append(notes, note)
		}

		// Get total count
		countQuery := `
			SELECT COUNT(*)
			FROM notes n
			INNER JOIN notes_fts fts ON n.id = fts.rowid
			WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
		`
		s.db.QueryRow(countQuery, ftsQuery).Scan(&total)
	} else {
		return s.searchWithLike(query, limit)
	}

	hasMore := len(notes) > limit
	if hasMore {
		notes = notes[:limit]
	}

	if total == 0 {
		total = len(notes)
	}

	return &models.SearchResult{
		Notes:   notes,
		Total:   total,
		HasMore: hasMore,
	}, nil
}

// searchWithLike is a fallback search using LIKE
func (s *NoteService) searchWithLike(query string, limit int) (*models.SearchResult, error) {
	searchPattern := "%" + query + "%"

	sqlQuery := `
		SELECT id, title, content, tags, created_at, updated_at, is_archived, is_deleted
		FROM notes 
		WHERE is_deleted = 0 AND is_archived = 0
		AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
		ORDER BY 
			CASE 
				WHEN title LIKE ? THEN 1
				WHEN content LIKE ? THEN 2
				ELSE 3
			END,
			created_at DESC
		LIMIT ?
	`

	rows, err := s.db.Query(sqlQuery, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit+1)
	if err != nil {
		return nil, fmt.Errorf("failed to search notes: %w", err)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note := &models.Note{}
		var tagsJSON sql.NullString
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &tagsJSON, &note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}
		note.Tags = []string{}
		if tagsJSON.Valid && tagsJSON.String != "" {
			json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		notes = append(notes, note)
	}

	hasMore := len(notes) > limit
	if hasMore {
		notes = notes[:limit]
	}

	// Get total count
	var total int
	s.db.QueryRow(`
		SELECT COUNT(*) FROM notes 
		WHERE is_deleted = 0 AND is_archived = 0
		AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
	`, searchPattern, searchPattern, searchPattern).Scan(&total)

	return &models.SearchResult{
		Notes:   notes,
		Total:   total,
		HasMore: hasMore,
	}, nil
}

// SearchWithHighlight searches and returns highlighted snippets
func (s *NoteService) SearchWithHighlight(query string, limit int) (*models.SearchResult, error) {
	if !s.ftsEnabled {
		return s.Search(query, limit)
	}

	if limit <= 0 {
		limit = 20
	}

	ftsQuery := s.buildFTSQuery(query)

	// Use highlight() function for matched text
	sqlQuery := `
		SELECT n.id, 
			   highlight(notes_fts, 0, '<mark>', '</mark>') as title,
			   snippet(notes_fts, 1, '<mark>', '</mark>', '...', 64) as content,
			   n.tags, n.created_at, n.updated_at, n.is_archived, n.is_deleted,
			   bm25(notes_fts, 10.0, 5.0, 1.0) as rank
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
		ORDER BY rank
		LIMIT ?
	`

	rows, err := s.db.Query(sqlQuery, ftsQuery, limit+1)
	if err != nil {
		return s.Search(query, limit)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note := &models.Note{}
		var tagsJSON sql.NullString
		var rank float64
		err := rows.Scan(&note.ID, &note.Title, &note.Content, &tagsJSON, &note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted, &rank)
		if err != nil {
			continue
		}
		note.Tags = []string{}
		if tagsJSON.Valid && tagsJSON.String != "" {
			json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		notes = append(notes, note)
	}

	hasMore := len(notes) > limit
	if hasMore {
		notes = notes[:limit]
	}

	var total int
	s.db.QueryRow(`
		SELECT COUNT(*)
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
	`, ftsQuery).Scan(&total)

	return &models.SearchResult{
		Notes:   notes,
		Total:   total,
		HasMore: hasMore,
	}, nil
}

// Update updates an existing note
func (s *NoteService) Update(req *models.UpdateNoteRequest) (*models.Note, error) {
	updates := []string{}
	args := []interface{}{}

	if req.Title != nil {
		updates = append(updates, "title = ?")
		args = append(args, *req.Title)
	}

	if req.Content != nil {
		updates = append(updates, "content = ?")
		args = append(args, *req.Content)
	}

	if req.Tags != nil {
		tagsJSON, err := json.Marshal(*req.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tags: %w", err)
		}
		updates = append(updates, "tags = ?")
		args = append(args, tagsJSON)
	}

	if len(updates) == 0 {
		return s.GetByID(req.ID)
	}

	updates = append(updates, "updated_at = ?")
	args = append(args, time.Now())

	args = append(args, req.ID)

	query := fmt.Sprintf("UPDATE notes SET %s WHERE id = ? AND is_deleted = 0", strings.Join(updates, ", "))

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update note: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return nil, fmt.Errorf("note not found")
	}

	return s.GetByID(req.ID)
}

// Delete soft deletes a note
func (s *NoteService) Delete(id int64) error {
	result, err := s.db.Exec("UPDATE notes SET is_deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete note: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note not found")
	}

	return nil
}

// Archive archives or unarchives a note
func (s *NoteService) Archive(id int64, archive bool) error {
	result, err := s.db.Exec("UPDATE notes SET is_archived = ?, updated_at = ? WHERE id = ? AND is_deleted = 0", archive, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to archive note: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if affected == 0 {
		return fmt.Errorf("note not found")
	}

	return nil
}

// GetStats returns statistics about notes
func (s *NoteService) GetStats() (*models.NoteStats, error) {
	stats := &models.NoteStats{}

	// Get total notes count
	err := s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE is_deleted = 0").Scan(&stats.TotalNotes)
	if err != nil {
		return nil, fmt.Errorf("failed to get total notes: %w", err)
	}

	// Get active notes count
	err = s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND is_archived = 0").Scan(&stats.ActiveNotes)
	if err != nil {
		return nil, fmt.Errorf("failed to get active notes: %w", err)
	}

	// Get archived notes count
	err = s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND is_archived = 1").Scan(&stats.ArchivedNotes)
	if err != nil {
		return nil, fmt.Errorf("failed to get archived notes: %w", err)
	}

	// Get weekly count
	weekAgo := time.Now().AddDate(0, 0, -7)
	err = s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND created_at >= ?", weekAgo).Scan(&stats.WeeklyCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get weekly count: %w", err)
	}

	// Get monthly count
	monthAgo := time.Now().AddDate(0, -1, 0)
	err = s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND created_at >= ?", monthAgo).Scan(&stats.MonthlyCount)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly count: %w", err)
	}

	// Get all unique tags
	stats.AllTags = s.getAllTags()

	return stats, nil
}

// GetAllTags returns all unique tags
func (s *NoteService) GetAllTags() []string {
	return s.getAllTags()
}

func (s *NoteService) getAllTags() []string {
	tagInfos := s.getTagsWithCount()
	tags := make([]string, len(tagInfos))
	for i, info := range tagInfos {
		tags[i] = info.Name
	}
	return tags
}

// getTagsWithCount returns all tags with their usage counts, sorted by frequency
func (s *NoteService) getTagsWithCount() []*models.TagInfo {
	rows, err := s.db.Query("SELECT tags FROM notes WHERE is_deleted = 0 AND tags IS NOT NULL AND tags != '' AND tags != '[]'")
	if err != nil {
		return []*models.TagInfo{}
	}
	defer rows.Close()

	tagCount := make(map[string]int)
	for rows.Next() {
		var tagsJSON string
		if err := rows.Scan(&tagsJSON); err != nil {
			continue
		}
		var tags []string
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err != nil {
			continue
		}
		for _, tag := range tags {
			if tag != "" {
				tagCount[tag]++
			}
		}
	}

	// Convert to slice and sort by count (descending), then by name (ascending)
	tagInfos := make([]*models.TagInfo, 0, len(tagCount))
	for name, count := range tagCount {
		tagInfos = append(tagInfos, &models.TagInfo{
			Name:  name,
			Count: count,
		})
	}

	// Sort: first by count (descending), then by name (ascending)
	for i := 0; i < len(tagInfos); i++ {
		for j := i + 1; j < len(tagInfos); j++ {
			if tagInfos[i].Count < tagInfos[j].Count ||
				(tagInfos[i].Count == tagInfos[j].Count && tagInfos[i].Name > tagInfos[j].Name) {
				tagInfos[i], tagInfos[j] = tagInfos[j], tagInfos[i]
			}
		}
	}

	return tagInfos
}

// GetTagsWithCount returns all tags with usage counts
func (s *NoteService) GetTagsWithCount() []*models.TagInfo {
	return s.getTagsWithCount()
}

// BatchDelete deletes multiple notes
func (s *NoteService) BatchDelete(ids []int64) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	// 直接物理删除这些笔记行。
	// 注意：这里使用 DELETE 而不是软删除，
	// 主要用于“清空数据”等场景，彻底移除表中记录。
	// FTS 触发器会在 DELETE 时同步更新 notes_fts 索引。
	query := fmt.Sprintf("DELETE FROM notes WHERE id IN (%s)", strings.Join(placeholders, ","))
	result, err := s.db.Exec(query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to batch delete notes: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get affected rows: %w", err)
	}

	return int(affected), nil
}

// BatchArchive archives multiple notes
func (s *NoteService) BatchArchive(ids []int64, archive bool) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids)+2)
	args[0] = archive
	args[1] = time.Now()
	for i, id := range ids {
		placeholders[i] = "?"
		args[i+2] = id
	}

	query := fmt.Sprintf("UPDATE notes SET is_archived = ?, updated_at = ? WHERE id IN (%s) AND is_deleted = 0", strings.Join(placeholders, ","))
	result, err := s.db.Exec(query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to batch archive notes: %w", err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get affected rows: %w", err)
	}

	return int(affected), nil
}

// IsFTSEnabled returns whether FTS5 is enabled
func (s *NoteService) IsFTSEnabled() bool {
	return s.ftsEnabled
}

// SetSetting upserts a settings key/value pair.
func (s *NoteService) SetSetting(key, value string) error {
	if strings.TrimSpace(key) == "" {
		return fmt.Errorf("setting key cannot be empty")
	}
	_, err := s.db.Exec(`
		INSERT INTO settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
	`, key, value, time.Now())
	if err != nil {
		return fmt.Errorf("failed to set setting: %w", err)
	}
	return nil
}

// GetSetting retrieves a settings value by key.
func (s *NoteService) GetSetting(key string) (string, error) {
	if strings.TrimSpace(key) == "" {
		return "", fmt.Errorf("setting key cannot be empty")
	}
	var value string
	if err := s.db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&value); err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("setting not found")
		}
		return "", fmt.Errorf("failed to get setting: %w", err)
	}
	return value, nil
}

func draftScope(noteID *int64) string {
	if noteID == nil {
		return "global"
	}
	return fmt.Sprintf("note:%d", *noteID)
}

// SaveDraft creates or updates a draft payload for a note scope.
func (s *NoteService) SaveDraft(noteID *int64, payload string) error {
	scope := draftScope(noteID)
	_, err := s.db.Exec(`
		INSERT INTO drafts (scope, note_id, payload, updated_at)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(scope) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
	`, scope, noteID, payload, time.Now())
	if err != nil {
		return fmt.Errorf("failed to save draft: %w", err)
	}
	return nil
}

// GetDraft returns the draft payload for a note scope.
func (s *NoteService) GetDraft(noteID *int64) (string, error) {
	scope := draftScope(noteID)
	var payload string
	if err := s.db.QueryRow(`SELECT payload FROM drafts WHERE scope = ?`, scope).Scan(&payload); err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("draft not found")
		}
		return "", fmt.Errorf("failed to get draft: %w", err)
	}
	return payload, nil
}

// DeleteDraft removes a draft by scope.
func (s *NoteService) DeleteDraft(noteID *int64) error {
	scope := draftScope(noteID)
	_, err := s.db.Exec(`DELETE FROM drafts WHERE scope = ?`, scope)
	if err != nil {
		return fmt.Errorf("failed to delete draft: %w", err)
	}
	return nil
}

// ResetAllData drops note-related tables and recreates them,
// effectively achieving a "delete table & rebuild" reset.
func (s *NoteService) ResetAllData() error {
	// Drop FTS table first because it depends on notes content
	if _, err := s.db.Exec(`DROP TABLE IF EXISTS notes_fts`); err != nil {
		return fmt.Errorf("failed to drop notes_fts: %w", err)
	}

	// Drop main notes table
	if _, err := s.db.Exec(`DROP TABLE IF EXISTS notes`); err != nil {
		return fmt.Errorf("failed to drop notes: %w", err)
	}

	// We保留 settings 表，只是清空笔记数据。
	// 重新运行迁移，重建 notes/notes_fts 及索引和触发器。
	if err := db.RunMigrations(s.db); err != nil {
		return fmt.Errorf("failed to run migrations after reset: %w", err)
	}

	// Re-check FTS 状态
	s.checkFTSEnabled()
	return nil
}
