# Panda Time-Note Feature Design (Full Upgrade)

Date: 2026-03-05  
Scope: Major version, mixed scenarios (life/study/work), system notifications, time-only capsule unlock  
Decision: **Destructive migration** (old note data is not preserved)

## 1. Product Goals

This version upgrades four experience areas in one release:

1. Faster note capture
2. Better timeline browsing and filtering
3. Time-capsule flow with time-based unlock and system notifications
4. Stronger tag/search retrieval

Target scenarios are mixed: personal life records, study notes, and work logs in one app.

## 2. Final Constraints and Decisions

Confirmed decisions from product discussion:

1. Release type: major version (not MVP)
2. Scenario: mixed usage
3. Notifications: system-level desktop notifications
4. Capsule unlock rule: time-only
5. Data compatibility: not required
6. Migration mode: call `ResetAllData` and rebuild schema/indexes

## 3. Current Codebase Fit (Conflict Assessment)

The existing app already provides reusable foundations:

1. Header new-note entry, search box, filter/sidebar, and timeline shell
2. Backend note CRUD/query/search services
3. SQLite + FTS5 indexing/triggers
4. Pinia stores and typed frontend models

Detected conflicts to avoid:

1. Current `type` (`quick|article`) and archive/delete flags are deeply used in UI and service logic.
2. Timeline currently has some frontend-side post-filtering that can diverge from backend filtering.
3. No system notification/scheduler layer currently exists.

Given the product decision to drop old data, we will replace old semantics directly and remove compatibility branches.

## 4. New Data Model (Source of Truth)

Replace old note semantics with new schema-first model:

### 4.1 `notes` table

Fields:

1. `id` INTEGER PRIMARY KEY AUTOINCREMENT
2. `title` TEXT NOT NULL
3. `content` TEXT NOT NULL
4. `tags` TEXT DEFAULT '[]'
5. `scene` TEXT NOT NULL DEFAULT 'mixed'  
   Allowed: `life | study | work | mixed`
6. `kind` TEXT NOT NULL DEFAULT 'note'  
   Allowed: `note | capsule`
7. `state` TEXT NOT NULL DEFAULT 'active'  
   Allowed: `draft | active | unlocked | archived`
8. `unlock_at` DATETIME NULL
9. `remind_at` DATETIME NULL
10. `remind_policy` TEXT NOT NULL DEFAULT 'once'  
    Allowed: `once | daily | weekly`
11. `notified_at` DATETIME NULL
12. `search_text` TEXT NOT NULL DEFAULT ''
13. `pinned` BOOLEAN NOT NULL DEFAULT 0
14. `created_at` DATETIME NOT NULL
15. `updated_at` DATETIME NOT NULL

Notes:

1. For capsules, `kind='capsule'` and `unlock_at` is required.
2. `state` replaces old archive/delete semantics.
3. `search_text` is normalized content for fast search fallback and future ranking.

### 4.2 Indexes

1. `idx_notes_timeline` on `(state, created_at DESC)`
2. `idx_notes_capsule_unlock` on `(kind, state, unlock_at)`
3. `idx_notes_scene_time` on `(scene, created_at DESC)`
4. `idx_notes_remind` on `(remind_at, state)`
5. `idx_notes_pinned` on `(pinned DESC, updated_at DESC)`

### 4.3 FTS

Rebuild FTS table against the new fields:

1. Include `title`, `content`, `tags`, `search_text`
2. Keep trigger-based sync on insert/update/delete
3. Rebuild index after migration

## 5. Destructive Migration Plan

Migration path is explicit and simple:

1. Call `ResetAllData`
2. Drop old `notes` + old `notes_fts`
3. Recreate `notes` with the new schema
4. Recreate indexes and FTS triggers
5. Keep `settings` table as-is unless a settings schema update is needed

No legacy data mapping, no dual-write compatibility, no fallback branch.

## 6. Backend Design

### 6.1 Services

Refactor note service into cohesive query paths:

1. `CreateNote` / `UpdateNote` on new model fields
2. `ListNotes` with combined filters:
   - scene
   - state
   - kind
   - tags
   - search
   - date range
3. `CapsuleSchedulerService`:
   - unlock due capsules (`now >= unlock_at`)
   - emit system notification
   - mark `notified_at`
4. Startup compensation job:
   - scan overdue locked capsules and unlock/notify

### 6.2 Handlers

Extend or replace handler signatures to match the new request model; avoid introducing parallel duplicate endpoints.

### 6.3 Notification abstraction

Introduce a platform notification interface:

1. `Notify(noteID, title, body, deepLink)`
2. platform implementations for macOS/Windows/Linux
3. safe fallback to in-app toast if OS notification is unavailable

## 7. Frontend Design

### 7.1 Types and Store

1. Replace old `Note` TS interface with new fields (`scene/kind/state/...`)
2. Update `noteStore` mapping and query parameter model
3. Keep existing list/pagination infrastructure

### 7.2 UI reuse strategy

Reuse existing components and extend behavior:

1. `Home.vue`:
   - keep header/search/filter shell
   - add scene/kind/state controls to existing filter area
2. `Timeline.vue`:
   - render from backend-filtered list as source of truth
   - keep timeline/grid toggle
3. `NoteCapsule.vue`:
   - add capsule lock badge/countdown
   - hide content when locked
   - show unlocked state transition indicators
4. Editor/new-note flow:
   - preserve existing quick-create and article-create affordances
   - add “convert to capsule” with `unlock_at` and reminder policy

### 7.3 Search behavior

1. Backend search is primary
2. Frontend only handles display/highlight
3. Remove redundant local second-pass filtering that may conflict with backend results

## 8. Error Handling

1. Notification permission denied:
   - show status in settings
   - degrade to in-app reminder
2. Scheduler miss:
   - startup compensation job ensures eventual unlock
3. Invalid capsule input:
   - reject `unlock_at` earlier than current time for new capsule creation
4. FTS failure:
   - fallback to LIKE query using `search_text`

## 9. Testing Strategy

### 9.1 Backend

1. Migration test: schema, indexes, triggers exist after reset
2. Query tests: scene/kind/state/tag/search/date combinations
3. Capsule unlock tests: before/on/after boundary times
4. Notification tests: permission denied path, fallback path

### 9.2 Frontend

1. Store mapping and filter state persistence
2. Timeline locked/unlocked capsule rendering
3. Search result consistency with backend
4. Create/edit capsule flow

### 9.3 Regression focus

1. Main list performance under pagination
2. FTS availability and fallback behavior
3. No duplicated note states across views

## 10. Release Strategy

Given destructive migration:

1. Release notes must explicitly warn existing users that note data will be reset in this major version.
2. Keep upgrade path deterministic: on first launch after update, execute reset + migration once.
3. If needed, provide optional export/import in a later iteration (out of scope for this version).

## 11. Non-goals

1. Legacy data compatibility/mapping
2. Conditional unlock rules beyond time
3. External channels (email/calendar push)
4. Multi-account/cloud sync

## 12. Implementation Readiness

Design is approved for planning and implementation with one explicit operational assumption:

1. Existing user data loss is acceptable for this version by product decision.

