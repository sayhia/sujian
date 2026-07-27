# 素笺 Sujian

A time capsule note application built with Wails v3, combining Go backend with Vue.js frontend.

## Default App Routes (2026-03-08)

The default app flow is now locked to the Editorial experience:

1. `/` -> Editorial Home
2. `/notes/new` -> Editorial Editor (quick note mode)
3. `/notes/new/article` -> Editorial Editor (article mode)
4. `/notes/:id/edit` -> Editorial Editor (edit mode)
5. `/settings` -> Editorial Settings

## Editorial Behavior Baseline

1. Home supports keyword/tag/time filtering in the reading stream.
2. Editor supports route-driven `create/article/edit` save behavior.
3. Settings values persist to local storage and restore on load.

## Features

- 📝 **Rich Text Editing**: Support for multiple text formats with TipTap editor
- ⏳ **Time Capsule**: Create and manage time-based notes
- 📅 **Timeline View**: Visual timeline to browse notes chronologically
- 🌍 **Multi-language Support**: Chinese, English, Japanese, Korean
- 🏷️ **Tag Management**: Organize notes with customizable tags
- 🎨 **Modern UI**: Clean and intuitive interface built with Tailwind CSS
- 💾 **Local Storage**: SQLite database for reliable data persistence

## Tech Stack

### Backend
- **Go 1.25**: Core backend language
- **Wails v3**: Cross-platform desktop application framework
- **SQLite**: Embedded database

### Frontend
- **Vue 3**: Progressive JavaScript framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **TipTap**: Rich text editor
- **Pinia**: State management
- **Vue Router**: Routing
- **Vue I18n**: Internationalization

## Project Structure

```
sujian/
├── frontend/               # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── composables/    # Reusable composition functions
│   │   ├── language/       # i18n translations
│   │   ├── stores/         # Pinia stores
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── handlers/               # Go HTTP handlers
├── models/                 # Go data models
├── services/               # Business logic
├── db/                     # Database setup
├── build/                  # Build scripts and configs
└── main.go                 # Application entry point
```

## Getting Started

### Prerequisites

- Go 1.25 or higher
- Node.js 18 or higher
- Task (taskfile) for build automation

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sujian.git
cd sujian
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

### Development

Run the application in development mode:
```bash
task dev
```

This will start:
- Go backend with hot reload
- Vite dev server (default port: 9245)
- Auto-open the application window

### Building

Build for your current platform:
```bash
task build
```

Package for production:
```bash
task package
```

## Available Commands

| Command | Description |
|---------|-------------|
| `task dev` | Run in development mode |
| `task run` | Run the application |
| `task build` | Build the application |
| `task package` | Package production build |

## Components

- **Editor**: Main note editing interface
- **Timeline**: Chronological note viewer
- **NoteCapsule**: Time capsule feature
- **SettingsPanel**: Application settings
- **ArticleEditor**: Rich text editor component

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
