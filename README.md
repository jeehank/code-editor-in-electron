# The Ashmi Editor

A modern, VS Code-inspired desktop code editor built with **Electron**, **React**, **Vite**, and **Monaco Editor**. It features a full file explorer, multi-pane editing with split views, an integrated terminal powered by `node-pty` and `xterm.js`, workspace-wide search, and a familiar dark theme.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Monaco Editor** | Full-featured code editing with syntax highlighting, IntelliSense, minimap, and word-wrap — the same editor engine that powers VS Code. |
| **File Explorer** | Recursive, lazy-loaded directory tree in the sidebar. Open folders, browse files, create new files, and delete files via right-click context menu. |
| **Multi-Pane Editing** | Open multiple files in tabs. Split the editor horizontally to view files side-by-side. |
| **Integrated Terminal** | A fully functional terminal panel powered by `node-pty` + `xterm.js`. Runs your system shell (`cmd.exe` / `bash` / `zsh`) with proper resize support. |
| **Workspace Search** | Search for text across all files in the opened workspace. Results show file paths and matching line numbers — click to jump to the file. |
| **Unsaved Changes Detection** | Modified files are marked with an italic name and a dot indicator. Closing a dirty tab or the window prompts a Save/Don't Save/Cancel dialog. |
| **Run Current File** | Click **Run** in the menu bar to execute the active file with Node.js in the integrated terminal. |
| **Custom Title Bar** | Frameless window with a custom title bar featuring File menu, minimize/maximize/close buttons, and drag-to-move support. |
| **Settings Panel** | Basic settings UI for editor font size and word-wrap configuration. |
| **Extensions Panel** | Placeholder panel for future marketplace extension browsing. |
| **Dark Theme** | VS Code-inspired dark color scheme with custom scrollbar styling. |

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| [Electron](https://www.electronjs.org/) `v25` | Desktop application shell (Chromium + Node.js) |
| [React](https://react.dev/) `v18` | UI component framework |
| [Vite](https://vitejs.dev/) `v4` | Fast dev server and build tool |
| [vite-plugin-electron](https://github.com/nicepkg/vite-plugin-electron) | Vite integration for Electron main/preload processes |
| [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) | React wrapper for the Monaco Editor |
| [@xterm/xterm](https://xtermjs.org/) `v6` | Terminal emulator for the browser |
| [@xterm/addon-fit](https://www.npmjs.com/package/@xterm/addon-fit) | Auto-fit terminal dimensions to container |
| [node-pty](https://github.com/nicepkg/node-pty) | Pseudo-terminal binding for Node.js (spawns real shell processes) |
| [TailwindCSS](https://tailwindcss.com/) `v3` | Utility-first CSS framework |
| [Lucide React](https://lucide.dev/) | Icon library (Files, Search, Settings, etc.) |
| [electron-builder](https://www.electron.build/) | Packaging and distribution for production builds |

---

## 📁 Project Structure

```
code-editor-in-electron/
├── electron/                    # Electron main process
│   ├── main.js                  # App window, IPC handlers, file system ops, terminal spawning
│   └── preload.js               # Context bridge exposing safe APIs to renderer
├── src/                         # React renderer process
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component — layout, state management, keyboard shortcuts
│   ├── index.css                # Global styles (Tailwind directives + custom scrollbar)
│   └── components/
│       ├── ActivityBar.jsx      # Left icon bar (Explorer, Search, Extensions, Settings)
│       ├── Sidebar.jsx          # File tree with lazy-loaded directories & context menu
│       ├── Editor.jsx           # Monaco Editor wrapper with language detection
│       ├── TerminalPanel.jsx    # xterm.js terminal connected to node-pty
│       ├── SearchPanel.jsx      # Workspace-wide text search with results listing
│       ├── ExtensionsPanel.jsx  # Placeholder extensions marketplace panel
│       └── SettingsView.jsx     # Editor settings (font size, word wrap)
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite config with Electron plugin
├── tailwind.config.js           # Tailwind theme (VS Code color palette)
├── postcss.config.js            # PostCSS config for Tailwind
└── .gitignore
```

---

## 🏗 Architecture

The application follows Electron's standard **two-process model**:

### Main Process (`electron/main.js`)
- Creates the frameless `BrowserWindow` with a custom preload script.
- Handles all **IPC (Inter-Process Communication)** channels:
  - **Window controls**: minimize, maximize, close, close-confirm
  - **Dialogs**: open folder picker, message boxes (save prompts)
  - **File system**: read directory (recursive), read file, save file, create file, delete file, search workspace
  - **Terminal**: spawn PTY process, write data, resize
- Manages the PTY lifecycle via `node-pty`.
- Intercepts the window close event to allow the renderer to prompt for unsaved changes.

### Preload Script (`electron/preload.js`)
- Uses `contextBridge.exposeInMainWorld` to safely expose IPC methods as `window.electronAPI`.
- Provides a clean, typed API surface for the renderer without enabling `nodeIntegration`.

### Renderer Process (`src/`)
- A standard **React 18** app bundled by Vite.
- `App.jsx` manages all top-level state:
  - `workspacePath` — the currently opened folder
  - `panes[]` — array of open editor panes (each with `filePath`, `content`, `originalContent`)
  - `activePaneIndex` — which pane is focused
  - `activeTab` — which sidebar panel is shown (explorer / search / extensions / settings)
  - `isTerminalOpen` — terminal panel visibility
- Components communicate through props (no external state library).

```
┌──────────────────────────────────────────────────┐
│                  Title Bar                        │
│  [The Ashmi Editor]  File Edit View Run  [─ □ ✕] │
├────┬─────────┬───────────────────────────────────┤
│    │         │  Tab Bar: file1.js | file2.css ✕  │
│ A  │         ├───────────────────────────────────┤
│ c  │ Sidebar │                                   │
│ t  │ (File   │        Monaco Editor              │
│ i  │  Tree / │       (Active Pane)               │
│ v  │  Search │                                   │
│ i  │  / Ext) │                                   │
│ t  │         ├───────────────────────────────────┤
│ y  │         │  Terminal (xterm.js + node-pty)    │
│    │         │  $ _                               │
├────┴─────────┴───────────────────────────────────┤
│  Status Bar: main* | Errors | Terminal | Ln Col  │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 16 (recommended: 18 or 20)
- **npm** ≥ 8
- **Windows**: Visual Studio Build Tools (for `node-pty` native compilation)
  - Or install via: `npm install -g windows-build-tools`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd code-editor-in-electron

# Install dependencies
npm install

# Approve native package install scripts (electron, esbuild, node-pty)
npm approve-scripts electron esbuild node-pty

# Re-run install to execute the approved scripts
npm install
```

### Development

```bash
# Start the Vite dev server + Electron app
npm run dev
```

This will:
1. Start the Vite dev server at `http://localhost:5173`
2. Compile the Electron main and preload scripts
3. Launch the Electron window pointing to the dev server (with hot reload)

### Production Build

```bash
# Build the Vite bundle and package with electron-builder
npm run build
```

The packaged application will be output to the `dist/` directory.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save the active file |
| `Ctrl + `` ` `` | Toggle the integrated terminal |
| `Right-click` (on file in sidebar) | Open context menu (Delete) |

---

## 📝 IPC API Reference

The renderer accesses Node.js functionality exclusively through `window.electronAPI`, which exposes the following methods:

| Method | Description |
|---|---|
| `openFolderDialog()` | Opens a native folder picker; returns the selected path |
| `readDir(dirPath)` | Reads directory contents (sorted: folders first) |
| `readFile(filePath)` | Reads a file as UTF-8 string |
| `saveFile(filePath, content)` | Writes content to a file |
| `createFile(filePath)` | Creates a new empty file (fails if it already exists) |
| `deleteFile(filePath)` | Deletes a file |
| `searchWorkspace(dirPath, query)` | Searches all files in a directory for a text query |
| `spawnTerminal(cwd)` | Spawns a PTY shell process in the given directory |
| `writeTerminal(data)` | Sends keystrokes/data to the PTY process |
| `resizeTerminal(cols, rows)` | Resizes the PTY to match terminal dimensions |
| `onTerminalData(callback)` | Listens for output from the PTY process |
| `minimize()` | Minimizes the window |
| `maximize()` | Toggles maximize/unmaximize |
| `close()` | Initiates window close (triggers save prompt) |
| `confirmClose()` | Force-closes the window (after save prompts are handled) |
| `showMessageBox(options)` | Shows a native dialog (used for save confirmations) |
| `onWindowCloseRequest(callback)` | Listens for the close event from the main process |

---

## 🎨 Theming

The color palette is defined in `tailwind.config.js` under the `vscode` namespace and mirrors VS Code's dark theme:

| Token | Color | Usage |
|---|---|---|
| `vscode-bg` | `#1e1e1e` | Main background |
| `vscode-sidebar` | `#252526` | Sidebar background |
| `vscode-activityBar` | `#333333` | Activity bar background |
| `vscode-statusBar` | `#007acc` | Status bar (blue) |
| `vscode-titleBar` | `#3c3c3c` | Title bar background |
| `vscode-border` | `#3c3c3c` | Border color |
| `vscode-text` | `#cccccc` | Default text |
| `vscode-activeText` | `#ffffff` | Active/highlighted text |
| `vscode-accent` | `#007acc` | Accent color (buttons, highlights) |
| `vscode-hoverBg` | `#2a2d2e` | Hover background |
| `vscode-activeBg` | `#37373d` | Active item background |

Syntax colors (`syntaxKeyword`, `syntaxFunction`, `syntaxString`, etc.) are also available for custom highlighting outside Monaco.

---

## 🗂 Supported Languages

The editor auto-detects language from file extensions for syntax highlighting:

| Extensions | Language |
|---|---|
| `.js`, `.jsx` | JavaScript |
| `.ts`, `.tsx` | TypeScript |
| `.html` | HTML |
| `.css` | CSS |
| `.json` | JSON |
| `.md`, `.markdown` | Markdown |
| `.py` | Python |
| `.cpp`, `.c`, `.h` | C++ |
| `.txt` | Plain Text |

---

## 📄 License

This project is provided as-is for educational and personal use.

---

## 🙏 Acknowledgements

- [Microsoft Monaco Editor](https://microsoft.github.io/monaco-editor/) — the code editing experience
- [Electron](https://www.electronjs.org/) — cross-platform desktop framework
- [xterm.js](https://xtermjs.org/) — terminal emulation
- [node-pty](https://github.com/nicepkg/node-pty) — pseudo-terminal for Node.js
- [Lucide Icons](https://lucide.dev/) — beautiful open-source icons
- [Vite](https://vitejs.dev/) — lightning-fast build tooling

