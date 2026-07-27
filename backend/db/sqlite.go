package db

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	db *sql.DB
}

func New() (*Database, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	appDir := filepath.Join(homeDir, ".sujian")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(appDir, "sujian.db")
	log.Printf("Database path: %s", dbPath)

	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, err
	}

	// Enable foreign keys and optimize for performance
	db.Exec("PRAGMA foreign_keys = ON")
	db.Exec("PRAGMA synchronous = NORMAL")
	db.Exec("PRAGMA cache_size = 10000")
	db.Exec("PRAGMA temp_store = MEMORY")

	if err := runMigrations(db); err != nil {
		return nil, err
	}

	return &Database{db: db}, nil
}

// RunMigrations is the exported migration entrypoint so that
// other packages (e.g. services) can recreate tables/triggers
// after a destructive reset.
func RunMigrations(db *sql.DB) error {
	// Create notes table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS notes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			tags TEXT DEFAULT '[]',
			type TEXT DEFAULT 'quick',
			version INTEGER DEFAULT 1,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			is_archived BOOLEAN DEFAULT 0,
			is_deleted BOOLEAN DEFAULT 0
		)
	`)
	if err != nil {
		return err
	}

	// Add type column if it doesn't exist (migration for existing databases)
	_, err = db.Exec(`
		ALTER TABLE notes ADD COLUMN type TEXT DEFAULT 'quick'
	`)
	// Ignore error if column already exists
	if err != nil {
		log.Printf("Note: type column may already exist: %v", err)
	}

	// Add version column if it doesn't exist (for optimistic locking)
	_, err = db.Exec(`
		ALTER TABLE notes ADD COLUMN version INTEGER DEFAULT 1
	`)
	// Ignore error if column already exists
	if err != nil {
		log.Printf("Note: version column may already exist: %v", err)
	}

	// Create settings table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at DATETIME NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	// Create drafts table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS drafts (
			scope TEXT PRIMARY KEY,
			note_id INTEGER,
			payload TEXT NOT NULL,
			updated_at DATETIME NOT NULL
		)
	`)
	if err != nil {
		return err
	}

	// Create indexes for better query performance
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(is_archived)",
		"CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted)",
		"CREATE INDEX IF NOT EXISTS idx_notes_archived_deleted ON notes(is_archived, is_deleted)",
		"CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)",
	}

	for _, idx := range indexes {
		if _, err := db.Exec(idx); err != nil {
			log.Printf("Warning: failed to create index: %v", err)
		}
	}

	// Create FTS5 virtual table for full-text search
	_, err = db.Exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
			title,
			content,
			tags,
			content='notes',
			content_rowid='id',
			tokenize='unicode61 remove_diacritics 2'
		)
	`)
	if err != nil {
		log.Printf("Warning: failed to create FTS5 table: %v", err)
		// Continue without FTS5 if it fails (older SQLite versions)
	} else {
		// Create triggers to keep FTS index in sync
		createFTSTriggers(db)

		// Rebuild FTS index if empty
		rebuildFTSIndex(db)
	}

	return nil
}

// internal wrapper to keep existing call sites unchanged
func runMigrations(db *sql.DB) error {
	return RunMigrations(db)
}

func createFTSTriggers(db *sql.DB) {
	// Trigger for INSERT
	db.Exec(`
		CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
			INSERT INTO notes_fts(rowid, title, content, tags)
			VALUES (new.id, new.title, new.content, new.tags);
		END
	`)

	// Trigger for DELETE
	db.Exec(`
		CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
			INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
			VALUES ('delete', old.id, old.title, old.content, old.tags);
		END
	`)

	// Trigger for UPDATE
	db.Exec(`
		CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
			INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
			VALUES ('delete', old.id, old.title, old.content, old.tags);
			INSERT INTO notes_fts(rowid, title, content, tags)
			VALUES (new.id, new.title, new.content, new.tags);
		END
	`)

	log.Println("FTS5 triggers created successfully")
}

func rebuildFTSIndex(db *sql.DB) {
	// Check if FTS index is empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM notes_fts").Scan(&count)
	if err != nil {
		log.Printf("Warning: failed to check FTS index: %v", err)
		return
	}

	var notesCount int
	db.QueryRow("SELECT COUNT(*) FROM notes").Scan(&notesCount)

	// If FTS is empty but notes exist, rebuild the index
	if count == 0 && notesCount > 0 {
		log.Println("Rebuilding FTS5 index...")
		_, err := db.Exec(`
			INSERT INTO notes_fts(rowid, title, content, tags)
			SELECT id, title, content, tags FROM notes
		`)
		if err != nil {
			log.Printf("Warning: failed to rebuild FTS index: %v", err)
		} else {
			log.Printf("FTS5 index rebuilt with %d notes", notesCount)
		}
	}
}

func (d *Database) GetDB() *sql.DB {
	return d.db
}

func (d *Database) Close() error {
	return d.db.Close()
}

// RebuildFTSIndex manually rebuilds the FTS index
func (d *Database) RebuildFTSIndex() error {
	// Delete all from FTS
	_, err := d.db.Exec("DELETE FROM notes_fts")
	if err != nil {
		return err
	}

	// Reinsert all notes
	_, err = d.db.Exec(`
		INSERT INTO notes_fts(rowid, title, content, tags)
		SELECT id, title, content, tags FROM notes WHERE is_deleted = 0
	`)
	return err
}
