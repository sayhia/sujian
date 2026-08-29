package services

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"sujian/backend/db"
	"sujian/backend/models"
)

// 分页常量：统一列表语义
const (
	defaultPageSize = 50
	maxPageSize     = 200
)

// NoteService 提供笔记、设置与草稿的领域逻辑。
type NoteService struct {
	db         *sql.DB
	ftsEnabled bool
}

// NewNoteService 创建服务并探测 FTS5 可用性。
func NewNoteService(db *sql.DB) *NoteService {
	service := &NoteService{db: db}
	service.checkFTSEnabled()
	return service
}

// checkFTSEnabled 探测 notes_fts 虚拟表是否可用。
func (s *NoteService) checkFTSEnabled() {
	var name string
	err := s.db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='notes_fts'").Scan(&name)
	s.ftsEnabled = err == nil && name == "notes_fts"
	if s.ftsEnabled {
		log.Println("FTS5 full-text search enabled")
	}
}

// normalizePageSize 规整分页参数：limit<=0 取默认，超过上限截断。
func normalizePageSize(limit int) int {
	if limit <= 0 {
		return defaultPageSize
	}
	if limit > maxPageSize {
		return maxPageSize
	}
	return limit
}

// errNotFound 构造统一的 not_found 错误。
func errNotFound(what string) error {
	return models.NewAppError(models.ErrorKindNotFound, what, nil)
}

// errStorage 包装存储层错误。
func errStorage(msg string, err error) error {
	return models.NewAppError(models.ErrorKindStorage, msg, err)
}

// errInvalid 构造校验错误。
func errInvalid(msg string) error {
	return models.NewAppError(models.ErrorKindValidation, msg, nil)
}

// scanNote 从一行查询结果扫描并解析 Note（tags JSON、type 兜底）。
func scanNote(scanner interface{ Scan(...any) error }) (*models.Note, error) {
	note := &models.Note{}
	var tagsJSON sql.NullString
	var typeStr sql.NullString
	if err := scanner.Scan(
		&note.ID, &note.Title, &note.Content, &tagsJSON, &typeStr,
		&note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted,
	); err != nil {
		return nil, err
	}
	note.Tags = []string{}
	if tagsJSON.Valid && tagsJSON.String != "" {
		_ = json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
	}
	if typeStr.Valid && typeStr.String != "" {
		note.Type = models.NoteType(typeStr.String)
	} else {
		note.Type = models.NoteTypeQuick
	}
	return note, nil
}

// Create 创建一条新笔记。
func (s *NoteService) Create(req *models.CreateNoteRequest) (*models.Note, error) {
	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}
	noteType := req.Type
	if noteType == "" {
		noteType = models.NoteTypeQuick
	}
	if !isValidNoteType(noteType) {
		return nil, errInvalid(fmt.Sprintf("unsupported note type: %q", noteType))
	}

	tagsJSON, err := json.Marshal(tags)
	if err != nil {
		return nil, errStorage("failed to marshal tags", err)
	}

	now := time.Now()
	result, err := s.db.Exec(`
		INSERT INTO notes (title, content, tags, type, created_at, updated_at, is_archived, is_deleted)
		VALUES (?, ?, ?, ?, ?, ?, 0, 0)
	`, req.Title, req.Content, tagsJSON, string(noteType), now, now)
	if err != nil {
		return nil, errStorage("failed to insert note", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, errStorage("failed to get last insert id", err)
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

func isValidNoteType(t models.NoteType) bool {
	return t == models.NoteTypeQuick || t == models.NoteTypeArticle
}

// GetByID 按 ID 获取未删除的笔记。
func (s *NoteService) GetByID(id int64) (*models.Note, error) {
	note, err := scanNote(s.db.QueryRow(`
		SELECT id, title, content, tags, type, created_at, updated_at, is_archived, is_deleted
		FROM notes WHERE id = ? AND is_deleted = 0
	`, id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errNotFound("note not found")
		}
		return nil, errStorage("failed to get note", err)
	}
	return note, nil
}

// buildListQuery 构造列表查询 SQL 与参数（FTS / LIKE 统一收敛）。
func (s *NoteService) buildListQuery(req *models.GetNotesRequest) (string, []interface{}) {
	useFTS := s.ftsEnabled && req.Search != ""

	if useFTS {
		query := `
			SELECT n.id, n.title, n.content, n.tags, n.type, n.created_at, n.updated_at, n.is_archived, n.is_deleted
			FROM notes n
			INNER JOIN notes_fts fts ON n.id = fts.rowid
			WHERE n.is_deleted = 0 AND notes_fts MATCH ?`
		args := []interface{}{s.buildFTSQuery(req.Search)}
		for _, tag := range req.Tags {
			query += " AND n.tags LIKE ?"
			args = append(args, "%\""+tag+"\"%")
		}
		if req.StartTime != nil && *req.StartTime != "" {
			query += " AND n.created_at >= ?"
			args = append(args, *req.StartTime)
		}
		if req.EndTime != nil && *req.EndTime != "" {
			query += " AND n.created_at <= ?"
			args = append(args, *req.EndTime)
		}
		if req.Archived != nil {
			query += " AND n.is_archived = ?"
			args = append(args, *req.Archived)
		}
		query += " ORDER BY rank, n.created_at DESC"
		return query, args
	}

	query := `
		SELECT id, title, content, tags, type, created_at, updated_at, is_archived, is_deleted
		FROM notes WHERE is_deleted = 0`
	args := []interface{}{}

	for _, tag := range req.Tags {
		query += " AND tags LIKE ?"
		args = append(args, "%\""+tag+"\"%")
	}
	if req.Search != "" {
		pattern := "%" + req.Search + "%"
		query += " AND (title LIKE ? OR content LIKE ?)"
		args = append(args, pattern, pattern)
	}
	if req.StartTime != nil && *req.StartTime != "" {
		query += " AND created_at >= ?"
		args = append(args, *req.StartTime)
	}
	if req.EndTime != nil && *req.EndTime != "" {
		query += " AND created_at <= ?"
		args = append(args, *req.EndTime)
	}
	if req.Archived != nil {
		query += " AND is_archived = ?"
		args = append(args, *req.Archived)
	}
	query += " ORDER BY created_at DESC"
	return query, args
}

// GetAll 按过滤条件分页获取笔记。
func (s *NoteService) GetAll(req *models.GetNotesRequest) ([]*models.Note, error) {
	query, args := s.buildListQuery(req)

	if limit := normalizePageSize(req.Limit); limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}
	if req.Offset > 0 {
		query += " OFFSET ?"
		args = append(args, req.Offset)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, errStorage("failed to query notes", err)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note, err := scanNote(rows)
		if err != nil {
			return nil, errStorage("failed to scan note", err)
		}
		notes = append(notes, note)
	}
	if err := rows.Err(); err != nil {
		return nil, errStorage("failed to iterate notes", err)
	}
	return notes, nil
}

// buildFTSQuery 将用户查询拆词并构造 FTS5 前缀匹配表达式。
func (s *NoteService) buildFTSQuery(query string) string {
	words := strings.Fields(query)
	if len(words) == 0 {
		return query
	}
	parts := make([]string, len(words))
	for i, word := range words {
		escaped := strings.ReplaceAll(word, "\"", "\"\"")
		parts[i] = fmt.Sprintf("\"%s\"*", escaped)
	}
	return strings.Join(parts, " ")
}

// Search 使用 FTS5（或 LIKE 兜底）搜索未归档笔记。
func (s *NoteService) Search(query string, limit int) (*models.SearchResult, error) {
	limit = normalizePageSize(limit)
	if !s.ftsEnabled {
		return s.searchWithLike(query, limit)
	}

	ftsQuery := s.buildFTSQuery(query)
	sqlQuery := `
		SELECT n.id, n.title, n.content, n.tags, n.type, n.created_at, n.updated_at, n.is_archived, n.is_deleted,
			   bm25(notes_fts, 10.0, 5.0, 1.0) as rank
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
		ORDER BY rank
		LIMIT ?`
	rows, err := s.db.Query(sqlQuery, ftsQuery, limit+1)
	if err != nil {
		return s.searchWithLike(query, limit)
	}
	defer rows.Close()

	notes, err := s.collectSearchRows(rows, limit)
	if err != nil {
		return nil, err
	}

	var total int
	_ = s.db.QueryRow(`
		SELECT COUNT(*)
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
	`, ftsQuery).Scan(&total)
	if total == 0 {
		total = len(notes)
	}

	return &models.SearchResult{Notes: notes, Total: total, HasMore: len(notes) > limit}, nil
}

// collectSearchRows 读取搜索行（额外 rank 列）并做 hasMore 截断。
func (s *NoteService) collectSearchRows(rows *sql.Rows, limit int) ([]*models.Note, error) {
	notes := []*models.Note{}
	for rows.Next() {
		note := &models.Note{}
		var tagsJSON sql.NullString
		var typeStr sql.NullString
		var rank float64
		if err := rows.Scan(
			&note.ID, &note.Title, &note.Content, &tagsJSON, &typeStr,
			&note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted, &rank,
		); err != nil {
			return nil, errStorage("failed to scan note", err)
		}
		note.Tags = []string{}
		if tagsJSON.Valid && tagsJSON.String != "" {
			_ = json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		if typeStr.Valid && typeStr.String != "" {
			note.Type = models.NoteType(typeStr.String)
		} else {
			note.Type = models.NoteTypeQuick
		}
		notes = append(notes, note)
	}
	if len(notes) > limit {
		notes = notes[:limit]
	}
	return notes, nil
}

// searchWithLike 是无 FTS 时的 LIKE 兜底搜索。
func (s *NoteService) searchWithLike(query string, limit int) (*models.SearchResult, error) {
	limit = normalizePageSize(limit)
	pattern := "%" + query + "%"

	sqlQuery := `
		SELECT id, title, content, tags, type, created_at, updated_at, is_archived, is_deleted
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
		LIMIT ?`
	rows, err := s.db.Query(sqlQuery, pattern, pattern, pattern, pattern, pattern, limit+1)
	if err != nil {
		return nil, errStorage("failed to search notes", err)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note, err := scanNote(rows)
		if err != nil {
			return nil, errStorage("failed to scan note", err)
		}
		notes = append(notes, note)
	}

	hasMore := len(notes) > limit
	if hasMore {
		notes = notes[:limit]
	}

	var total int
	_ = s.db.QueryRow(`
		SELECT COUNT(*) FROM notes
		WHERE is_deleted = 0 AND is_archived = 0
		AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
	`, pattern, pattern, pattern).Scan(&total)

	return &models.SearchResult{Notes: notes, Total: total, HasMore: hasMore}, nil
}

// SearchWithHighlight 搜索并返回带 <mark> 高亮的摘要（无 FTS 时回退普通搜索）。
func (s *NoteService) SearchWithHighlight(query string, limit int) (*models.SearchResult, error) {
	if !s.ftsEnabled {
		return s.Search(query, limit)
	}
	limit = normalizePageSize(limit)
	ftsQuery := s.buildFTSQuery(query)

	sqlQuery := `
		SELECT n.id,
			   highlight(notes_fts, 0, '<mark>', '</mark>') as title,
			   snippet(notes_fts, 1, '<mark>', '</mark>', '...', 64) as content,
			   n.tags, n.type, n.created_at, n.updated_at, n.is_archived, n.is_deleted,
			   bm25(notes_fts, 10.0, 5.0, 1.0) as rank
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
		ORDER BY rank
		LIMIT ?`
	rows, err := s.db.Query(sqlQuery, ftsQuery, limit+1)
	if err != nil {
		return s.Search(query, limit)
	}
	defer rows.Close()

	notes := []*models.Note{}
	for rows.Next() {
		note := &models.Note{}
		var tagsJSON sql.NullString
		var typeStr sql.NullString
		var rank float64
		if err := rows.Scan(
			&note.ID, &note.Title, &note.Content, &tagsJSON, &typeStr,
			&note.CreatedAt, &note.UpdatedAt, &note.IsArchived, &note.IsDeleted, &rank,
		); err != nil {
			continue
		}
		note.Tags = []string{}
		if tagsJSON.Valid && tagsJSON.String != "" {
			_ = json.Unmarshal([]byte(tagsJSON.String), &note.Tags)
		}
		if typeStr.Valid && typeStr.String != "" {
			note.Type = models.NoteType(typeStr.String)
		} else {
			note.Type = models.NoteTypeQuick
		}
		notes = append(notes, note)
	}

	hasMore := len(notes) > limit
	if hasMore {
		notes = notes[:limit]
	}

	var total int
	_ = s.db.QueryRow(`
		SELECT COUNT(*)
		FROM notes n
		INNER JOIN notes_fts fts ON n.id = fts.rowid
		WHERE n.is_deleted = 0 AND n.is_archived = 0 AND notes_fts MATCH ?
	`, ftsQuery).Scan(&total)

	return &models.SearchResult{Notes: notes, Total: total, HasMore: hasMore}, nil
}

// Update 更新笔记字段（部分更新 + 可选乐观锁版本校验）。
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
			return nil, errStorage("failed to marshal tags", err)
		}
		updates = append(updates, "tags = ?")
		args = append(args, tagsJSON)
	}

	if len(updates) == 0 {
		return s.GetByID(req.ID)
	}

	updates = append(updates, "updated_at = ?", "version = version + 1")
	args = append(args, time.Now(), req.ID)

	query := fmt.Sprintf("UPDATE notes SET %s WHERE id = ? AND is_deleted = 0", strings.Join(updates, ", "))
	if req.ExpectedVersion != nil {
		query += " AND version = ?"
		args = append(args, *req.ExpectedVersion)
	}

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, errStorage("failed to update note", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return nil, errStorage("failed to get affected rows", err)
	}

	if affected == 0 {
		if req.ExpectedVersion != nil {
			var exists int
			if err := s.db.QueryRow("SELECT COUNT(*) FROM notes WHERE id = ? AND is_deleted = 0", req.ID).Scan(&exists); err == nil && exists > 0 {
				return nil, models.NewAppError(models.ErrorKindConflict, "note version mismatch", nil)
			}
		}
		return nil, errNotFound("note not found")
	}
	return s.GetByID(req.ID)
}

// Delete 软删除一条笔记。
func (s *NoteService) Delete(id int64) error {
	result, err := s.db.Exec("UPDATE notes SET is_deleted = 1, updated_at = ? WHERE id = ?", time.Now(), id)
	if err != nil {
		return errStorage("failed to delete note", err)
	}
	if affected, err := result.RowsAffected(); err != nil {
		return errStorage("failed to get affected rows", err)
	} else if affected == 0 {
		return errNotFound("note not found")
	}
	return nil
}

// Restore 恢复一条已软删除的笔记。
func (s *NoteService) Restore(id int64) error {
	result, err := s.db.Exec("UPDATE notes SET is_deleted = 0, updated_at = ? WHERE id = ? AND is_deleted = 1", time.Now(), id)
	if err != nil {
		return errStorage("failed to restore note", err)
	}
	if affected, err := result.RowsAffected(); err != nil {
		return errStorage("failed to get affected rows", err)
	} else if affected == 0 {
		return errNotFound("note not found")
	}
	return nil
}

// Archive 归档或取消归档一条笔记。
func (s *NoteService) Archive(id int64, archive bool) error {
	result, err := s.db.Exec("UPDATE notes SET is_archived = ?, updated_at = ? WHERE id = ? AND is_deleted = 0", archive, time.Now(), id)
	if err != nil {
		return errStorage("failed to archive note", err)
	}
	if affected, err := result.RowsAffected(); err != nil {
		return errStorage("failed to get affected rows", err)
	} else if affected == 0 {
		return errNotFound("note not found")
	}
	return nil
}

// GetStats 返回笔记统计信息。
func (s *NoteService) GetStats() (*models.NoteStats, error) {
	stats := &models.NoteStats{}
	weekAgo := time.Now().AddDate(0, 0, -7)
	monthAgo := time.Now().AddDate(0, -1, 0)

	queries := []struct {
		sql  string
		dest *int
	}{
		{"SELECT COUNT(*) FROM notes WHERE is_deleted = 0", &stats.TotalNotes},
		{"SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND is_archived = 0", &stats.ActiveNotes},
		{"SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND is_archived = 1", &stats.ArchivedNotes},
		{"SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND created_at >= ?", &stats.WeeklyCount},
		{"SELECT COUNT(*) FROM notes WHERE is_deleted = 0 AND created_at >= ?", &stats.MonthlyCount},
	}
	for i, q := range queries {
		if i >= 3 {
			t := weekAgo
			if i == 4 {
				t = monthAgo
			}
			if err := s.db.QueryRow(q.sql, t).Scan(q.dest); err != nil {
				return nil, errStorage("failed to compute stats", err)
			}
			continue
		}
		if err := s.db.QueryRow(q.sql).Scan(q.dest); err != nil {
			return nil, errStorage("failed to compute stats", err)
		}
	}

	stats.AllTags = s.getAllTags()
	return stats, nil
}

// GetAllTags 返回全部去重标签名。
func (s *NoteService) GetAllTags() []string {
	return s.getAllTags()
}

func (s *NoteService) getAllTags() []string {
	infos := s.getTagsWithCount()
	tags := make([]string, len(infos))
	for i, info := range infos {
		tags[i] = info.Name
	}
	return tags
}

// GetTagsWithCount 返回标签及使用次数（按频率降序、名称升序）。
func (s *NoteService) GetTagsWithCount() []*models.TagInfo {
	return s.getTagsWithCount()
}

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

	infos := make([]*models.TagInfo, 0, len(tagCount))
	for name, count := range tagCount {
		infos = append(infos, &models.TagInfo{Name: name, Count: count})
	}

	// 排序：计数降序，其次名称升序
	for i := 0; i < len(infos); i++ {
		for j := i + 1; j < len(infos); j++ {
			if infos[i].Count < infos[j].Count ||
				(infos[i].Count == infos[j].Count && infos[i].Name > infos[j].Name) {
				infos[i], infos[j] = infos[j], infos[i]
			}
		}
	}
	return infos
}

// BatchDelete 物理删除多条笔记（用于清空/彻底移除，FTS 触发器同步索引）。
func (s *NoteService) BatchDelete(ids []int64) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}
	result, err := s.db.Exec(fmt.Sprintf("DELETE FROM notes WHERE id IN (%s)", placeholders), args...)
	if err != nil {
		return 0, errStorage("failed to batch delete notes", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return 0, errStorage("failed to get affected rows", err)
	}
	return int(affected), nil
}

// BatchArchive 批量归档或取消归档。
func (s *NoteService) BatchArchive(ids []int64, archive bool) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	args := make([]interface{}, 0, len(ids)+2)
	args = append(args, archive, time.Now())
	for _, id := range ids {
		args = append(args, id)
	}
	result, err := s.db.Exec(fmt.Sprintf(
		"UPDATE notes SET is_archived = ?, updated_at = ? WHERE id IN (%s) AND is_deleted = 0", placeholders), args...)
	if err != nil {
		return 0, errStorage("failed to batch archive notes", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return 0, errStorage("failed to get affected rows", err)
	}
	return int(affected), nil
}

// BatchRestore 批量恢复软删除笔记。
func (s *NoteService) BatchRestore(ids []int64) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	args := make([]interface{}, 0, len(ids)+1)
	args = append(args, time.Now())
	for _, id := range ids {
		args = append(args, id)
	}
	result, err := s.db.Exec(fmt.Sprintf(
		"UPDATE notes SET is_deleted = 0, updated_at = ? WHERE is_deleted = 1 AND id IN (%s)", placeholders), args...)
	if err != nil {
		return 0, errStorage("failed to batch restore notes", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return 0, errStorage("failed to get affected rows", err)
	}
	return int(affected), nil
}

// PurgeDeleted 物理删除给定时间之前软删除的笔记。
func (s *NoteService) PurgeDeleted(beforeTime time.Time) (int, error) {
	result, err := s.db.Exec("DELETE FROM notes WHERE is_deleted = 1 AND updated_at <= ?", beforeTime)
	if err != nil {
		return 0, errStorage("failed to purge deleted notes", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return 0, errStorage("failed to get affected rows", err)
	}
	return int(affected), nil
}

// IsFTSEnabled 返回 FTS5 是否可用。
func (s *NoteService) IsFTSEnabled() bool {
	return s.ftsEnabled
}

// SetSetting upsert 一条设置项。
func (s *NoteService) SetSetting(key, value string) error {
	if strings.TrimSpace(key) == "" {
		return errInvalid("setting key cannot be empty")
	}
	if _, err := s.db.Exec(`
		INSERT INTO settings (key, value, updated_at)
		VALUES (?, ?, ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
	`, key, value, time.Now()); err != nil {
		return errStorage("failed to set setting", err)
	}
	return nil
}

// GetSetting 按 key 读取设置项。
func (s *NoteService) GetSetting(key string) (string, error) {
	if strings.TrimSpace(key) == "" {
		return "", errInvalid("setting key cannot be empty")
	}
	var value string
	if err := s.db.QueryRow(`SELECT value FROM settings WHERE key = ?`, key).Scan(&value); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errNotFound("setting not found")
		}
		return "", errStorage("failed to get setting", err)
	}
	return value, nil
}

// draftScope 计算草稿作用域：nil 为全局，否则按笔记。
func draftScope(noteID *int64) string {
	if noteID == nil {
		return "global"
	}
	return fmt.Sprintf("note:%d", *noteID)
}

// maxDraftBytes 草稿负载上限（防滥用）。
const maxDraftBytes = 2 << 20 // 2 MiB

// SaveDraft 保存草稿（upsert）。
func (s *NoteService) SaveDraft(noteID *int64, payload string) error {
	if len(payload) > maxDraftBytes {
		return errInvalid("draft payload too large")
	}
	scope := draftScope(noteID)
	if _, err := s.db.Exec(`
		INSERT INTO drafts (scope, note_id, payload, updated_at)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(scope) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
	`, scope, noteID, payload, time.Now()); err != nil {
		return errStorage("failed to save draft", err)
	}
	return nil
}

// GetDraft 读取草稿。
func (s *NoteService) GetDraft(noteID *int64) (string, error) {
	scope := draftScope(noteID)
	var payload string
	if err := s.db.QueryRow(`SELECT payload FROM drafts WHERE scope = ?`, scope).Scan(&payload); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errNotFound("draft not found")
		}
		return "", errStorage("failed to get draft", err)
	}
	return payload, nil
}

// DeleteDraft 删除草稿。
func (s *NoteService) DeleteDraft(noteID *int64) error {
	scope := draftScope(noteID)
	if _, err := s.db.Exec(`DELETE FROM drafts WHERE scope = ?`, scope); err != nil {
		return errStorage("failed to delete draft", err)
	}
	return nil
}

// ResetAllData 删除笔记相关表并重建（保留 settings），事务化执行。
func (s *NoteService) ResetAllData() error {
	tx, err := s.db.Begin()
	if err != nil {
		return errStorage("failed to begin reset", err)
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.Exec(`DROP TABLE IF EXISTS notes_fts`); err != nil {
		return errStorage("failed to drop notes_fts", err)
	}
	if _, err := tx.Exec(`DROP TABLE IF EXISTS notes`); err != nil {
		return errStorage("failed to drop notes", err)
	}
	if _, err := tx.Exec(`DELETE FROM drafts`); err != nil {
		return errStorage("failed to clear drafts", err)
	}
	if err := tx.Commit(); err != nil {
		return errStorage("failed to commit reset", err)
	}

	if err := db.RunMigrations(s.db); err != nil {
		return errStorage("failed to run migrations after reset", err)
	}
	s.checkFTSEnabled()
	return nil
}
