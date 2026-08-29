# 素笺 Sujian

A time capsule note application built with Wails v3, combining Go backend with Vue.js frontend.

**素笺 · 时间的信笺** —— 全新「纸墨 Paper & Ink」设计语言（2026-08-28 完全重构）。

## Routes

| Route | Description |
|---|---|
| `/` | Home · time-stream (timeline / grid) |
| `/notes/new` | Editor · quick note mode |
| `/notes/new/article` | Editor · article mode |
| `/notes/:id/edit` | Editor · edit mode |

## Features

- 📝 **Markdown Editing**: write / preview / split panes, syntax highlighting (highlight.js), outline
- ⏳ **Time Capsule**: time-grouped timeline (`今天 / 昨天 / 更早`)
- 🏷️ **Tags**: inline editing, suggestion, count & color-coded filtering
- 🔍 **Full-text Search**: FTS5 with highlighted snippets + search history (⌘K)
- 📦 **Archive & Trash**: archive / soft-delete / restore / purge
- 🎨 **Paper & Ink Theme System**: light/dark × 6 ink palettes, font size, glass, animations
- 💾 **Local Storage**: SQLite + autosave + draft recovery + JSON import/export
- 🌍 **i18n**: 中文 / English / 日本語 / 한국어
- ⌨️ **Shortcuts**: ⌘K · N · ⇧N · G · F · ⌘, · ?

## Tech Stack

- **Backend**: Go 1.25 · Wails v3 · SQLite (FTS5)
- **Frontend**: Vue 3 · TypeScript · Vite · Pinia · Vue Router · marked · highlight.js

## Project Structure

```
sujian/
├── backend/                  # Go backend
│   ├── models/               # data models & typed errors
│   ├── db/                   # SQLite + migrations + FTS5
│   ├── services/             # business logic
│   └── handlers/             # Wails service handlers
├── frontend/
│   ├── bindings/             # generated Wails bindings (do not edit)
│   └── src/
│       ├── styles/           # tokens.css · themes.css · base.css (design system)
│       ├── services/         # API layer over bindings
│       ├── stores/           # Pinia: notes · ui · settings
│       ├── composables/      # markdown · dates · tags · shortcuts · feedback
│       ├── components/
│       │   ├── ui/           # base components (Button/Modal/Toast/Drawer…)
│       │   ├── layout/       # AppHeader / AppSidebar
│       │   ├── notes/        # NoteCard / Timeline / Grid / FilterBar
│       │   ├── search/       # SearchPalette
│       │   ├── editor/       # Toolbar / Textarea / MarkdownViewer / TagEditor
│       │   └── settings/     # Appearance / Preference / Data / About
│       └── views/            # HomeView / EditorView
├── docs/plans/               # design & implementation docs
└── build/                    # build scripts & configs
```

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 18+
- Task (taskfile)

### Development

```bash
task dev        # wails3 dev (Vite at :9245)
```

### Build

```bash
task build      # build current platform
task package    # package production build
```

## Design System

Design tokens live in `frontend/src/styles/tokens.css` (colors / spacing / radius / shadow / motion).
Theme switching (`themes.css`) is driven by `<html data-theme data-accent>` attributes — zero reload, no flicker.

## License

MIT License
