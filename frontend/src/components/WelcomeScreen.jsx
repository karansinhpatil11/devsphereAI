import React, { useState } from 'react'
import {
  FileCode,
  FilePlus,
  FolderOpen,
  GitBranch,
  Terminal as TerminalIcon,
  Search,
  ChevronRight,
  Code2,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react'
import useStore from '../store/useStore'

const VSCODE_LANGUAGES = [
  { id: 'python', name: 'Python', ext: 'py', file: 'main.py', icon: 'PY', color: 'text-sky-400' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', file: 'index.js', icon: 'JS', color: 'text-amber-300' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', file: 'index.ts', icon: 'TS', color: 'text-blue-400' },
  { id: 'java', name: 'Java', ext: 'java', file: 'Main.java', icon: '☕', color: 'text-orange-400' },
  { id: 'cpp', name: 'C++', ext: 'cpp', file: 'main.cpp', icon: 'C++', color: 'text-cyan-400' },
  { id: 'c', name: 'C', ext: 'c', file: 'main.c', icon: 'C', color: 'text-slate-300' },
  { id: 'go', name: 'Go', ext: 'go', file: 'main.go', icon: 'GO', color: 'text-teal-400' },
  { id: 'rust', name: 'Rust', ext: 'rs', file: 'main.rs', icon: 'RS', color: 'text-rose-400' },
  { id: 'html', name: 'HTML', ext: 'html', file: 'index.html', icon: 'HTML', color: 'text-orange-500' },
  { id: 'css', name: 'CSS', ext: 'css', file: 'styles.css', icon: 'CSS', color: 'text-blue-300' },
  { id: 'json', name: 'JSON', ext: 'json', file: 'data.json', icon: '{}', color: 'text-yellow-400' },
  { id: 'sql', name: 'SQL', ext: 'sql', file: 'query.sql', icon: 'SQL', color: 'text-indigo-400' },
  { id: 'yaml', name: 'YAML', ext: 'yml', file: 'config.yml', icon: '⚙', color: 'text-purple-400' },
  { id: 'markdown', name: 'Markdown', ext: 'md', file: 'README.md', icon: 'MD', color: 'text-ide-text' },
]

const RECENT_FILES = [
  { name: 'AppService.java', path: 'src/main/java/com/company/service' },
  { name: 'AppController.java', path: 'src/main/java/com/company/service' },
  { name: 'application.yml', path: 'src/main/resources' },
  { name: 'AppControllerTest.java', path: 'src/test/java/com/company/service' },
  { name: 'pom.xml', path: 'core-service' },
]

export default function WelcomeScreen() {
  const { createFile, openFile, setSidebarSection } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [fileNameInput, setFileNameInput] = useState('')

  const filteredLanguages = VSCODE_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.ext.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectLanguage = (lang) => {
    createFile(lang.file)
  }

  const handleCreateCustomFile = (e) => {
    e.preventDefault()
    const trimmed = fileNameInput.trim()
    if (!trimmed) return
    createFile(trimmed)
    setFileNameInput('')
    setShowNewFileInput(false)
  }

  return (
    <div className="flex-1 h-full bg-[#0b1021] overflow-y-auto font-sans text-ide-text select-none p-8 md:p-14">
      {/* VS Code Quick Input Modal */}
      {showNewFileInput && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-20">
          <div className="w-full max-w-lg bg-ide-panel border border-ide-border rounded-xl shadow-2xl overflow-hidden slide-in text-xs">
            <div className="p-2 border-b border-ide-border flex items-center gap-2">
              <span className="text-ide-accent font-mono text-sm px-1.5">{'>'}</span>
              <input
                type="text"
                value={fileNameInput}
                onChange={(e) => setFileNameInput(e.target.value)}
                placeholder="Enter file name (e.g. main.py, app.js, UserService.java)..."
                className="flex-1 bg-transparent text-xs text-ide-text-bright outline-none font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCustomFile(e)
                  if (e.key === 'Escape') setShowNewFileInput(false)
                }}
              />
              <button
                onClick={() => setShowNewFileInput(false)}
                className="text-ide-text/40 hover:text-ide-text px-1.5"
              >
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-ide-border/30">
              <div className="px-3 py-1 text-[10px] text-ide-text/40 uppercase font-semibold">
                Or select language mode:
              </div>
              {filteredLanguages.slice(0, 8).map((lang) => (
                <div
                  key={lang.id}
                  onClick={() => {
                    handleSelectLanguage(lang)
                    setShowNewFileInput(false)
                  }}
                  className="px-3 py-2 flex items-center justify-between hover:bg-ide-accent/15 hover:text-ide-text-bright cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 font-mono text-[10px] font-bold ${lang.color}`}>{lang.icon}</span>
                    <span className="font-medium text-xs">{lang.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ide-text/40">.{lang.ext} ({lang.file})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-10">
        {/* VS Code Title Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-light text-ide-text-bright tracking-tight">
            DevSphere Code
          </h1>
          <p className="text-sm text-ide-text/50">Editing evolved</p>
        </div>

        {/* 2-Column VS Code Layout: Start & Recent (Left) + Languages & Shortcuts (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Start + Recent */}
          <div className="space-y-8">
            {/* Start Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-ide-text-bright uppercase tracking-wider">
                Start
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => setShowNewFileInput(true)}
                  className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs text-ide-accent hover:bg-ide-panel/80 hover:text-ide-accent-hover transition-colors text-left cursor-pointer group"
                >
                  <FilePlus size={15} className="shrink-0" />
                  <span className="font-medium group-hover:underline">New File...</span>
                  <span className="text-[10px] text-ide-text/40 font-mono ml-auto">Ctrl+Alt+N</span>
                </button>

                <button
                  onClick={() => setSidebarSection('repositories')}
                  className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs text-ide-accent hover:bg-ide-panel/80 hover:text-ide-accent-hover transition-colors text-left cursor-pointer group"
                >
                  <FolderOpen size={15} className="shrink-0" />
                  <span className="font-medium group-hover:underline">Open File...</span>
                </button>

                <button
                  onClick={() => setSidebarSection('repositories')}
                  className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs text-ide-accent hover:bg-ide-panel/80 hover:text-ide-accent-hover transition-colors text-left cursor-pointer group"
                >
                  <GitBranch size={15} className="shrink-0" />
                  <span className="font-medium group-hover:underline">Clone Git Repository...</span>
                </button>
              </div>
            </div>

            {/* Recent Files Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-ide-text-bright uppercase tracking-wider">
                Recent
              </h2>
              <div className="space-y-1">
                {RECENT_FILES.map((file) => (
                  <div
                    key={file.name}
                    onClick={() => openFile(file.name)}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-ide-panel/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={14} className="text-ide-accent shrink-0" />
                      <span className="text-xs text-ide-text group-hover:text-ide-text-bright truncate font-medium">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-ide-text/40 font-mono truncate ml-2">
                      {file.path}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Select Language (VS Code QuickPick style) + Shortcuts */}
          <div className="space-y-8">
            {/* Select a Language Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-ide-text-bright uppercase tracking-wider">
                  Select a language
                </h2>
                <span className="text-[10px] text-ide-text/40">to get started</span>
              </div>

              {/* Search filter input */}
              <div className="flex items-center gap-2 bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1.5 text-xs">
                <Search size={13} className="text-ide-text/40 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Select language mode (type to filter)..."
                  className="w-full bg-transparent text-xs text-ide-text-bright placeholder-ide-text/30 outline-none"
                />
              </div>

              {/* VS Code Language List */}
              <div className="bg-ide-panel/40 border border-ide-border/80 rounded-xl divide-y divide-ide-border/40 max-h-64 overflow-y-auto">
                {filteredLanguages.map((lang) => (
                  <div
                    key={lang.id}
                    onClick={() => handleSelectLanguage(lang)}
                    className="flex items-center justify-between px-3 py-2 hover:bg-ide-accent/15 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 font-mono text-[11px] font-bold ${lang.color}`}>
                        {lang.icon}
                      </span>
                      <span className="text-xs text-ide-text group-hover:text-ide-text-bright font-medium">
                        {lang.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-ide-text/40 font-mono">
                        .{lang.ext}
                      </span>
                      <ChevronRight size={12} className="text-ide-text/30 group-hover:text-ide-accent transition-colors" />
                    </div>
                  </div>
                ))}

                {filteredLanguages.length === 0 && (
                  <div className="p-3 text-center text-xs text-ide-text/40">
                    No language matched "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div className="space-y-2.5 pt-1">
              <h2 className="text-xs font-semibold text-ide-text-bright uppercase tracking-wider">
                Keyboard Shortcuts
              </h2>
              <div className="space-y-1.5 text-xs text-ide-text/70">
                <div className="flex items-center justify-between py-1 px-2 rounded bg-ide-panel/40 border border-ide-border/40">
                  <span>Toggle Integrated Terminal</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border text-[10px] font-mono text-ide-accent">
                    Ctrl + `
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1 px-2 rounded bg-ide-panel/40 border border-ide-border/40">
                  <span>Compile & Run Active Code</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border text-[10px] font-mono text-emerald-400">
                    Ctrl + Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1 px-2 rounded bg-ide-panel/40 border border-ide-border/40">
                  <span>Create New File Prompt</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-ide-bg border border-ide-border text-[10px] font-mono text-ide-purple">
                    Ctrl + Alt + N
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
