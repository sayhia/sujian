# Panda Time-Note

A time capsule note application built with Wails v3, combining Go backend with Vue.js frontend.

## UI Demo Routes (2026-03)

This project includes four interaction/style demos for comparison, isolated from production routes:

1. `/demo/styles` (selector)
2. Minimal: `/demo/minimal`, `/demo/minimal/editor`, `/demo/minimal/settings`
3. Editorial: `/demo/editorial`, `/demo/editorial/editor`, `/demo/editorial/settings`
4. Dashboard: `/demo/dashboard`, `/demo/dashboard/editor`, `/demo/dashboard/settings`
5. Capsule: `/demo/capsule`, `/demo/capsule/editor`, `/demo/capsule/settings`

Details: [`docs/plans/2026-03-06-ui-interaction-demo-notes.md`](docs/plans/2026-03-06-ui-interaction-demo-notes.md)

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
panda-time-note/
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
git clone https://github.com/yourusername/panda-time-note.git
cd panda-time-note
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
