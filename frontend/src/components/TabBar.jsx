import React, { useState } from 'react'
import useStore from '../store/useStore'
import {
  X,
  FileCode,
  Terminal as TerminalIcon,
  Plus,
  Sparkles,
} from 'lucide-react'

function TabIcon({ tab }) {
  if (tab.id === 'welcome') return <span className="text-[11px]">✨</span>
  if (tab.id === 'terminal') return <TerminalIcon size={12} className="text-ide-green" />
  // compiler now opens in bottom panel, not as a tab

  const ext = (tab.name || tab.id).split('.').pop()?.toLowerCase()
  const iconMap = {
    py: <span className="text-[10px] font-bold text-sky-400 select-none">PY</span>,
    js: <span className="text-[10px] font-bold text-yellow-400 select-none">JS</span>,
    jsx: <span className="text-[10px] font-bold text-yellow-400 select-none">JSX</span>,
    ts: <span className="text-[10px] font-bold text-blue-400 select-none">TS</span>,
    tsx: <span className="text-[10px] font-bold text-blue-400 select-none">TSX</span>,
    java: <span className="text-[11px] font-bold text-amber-500 select-none leading-none">☕</span>,
    cpp: <span className="text-[10px] font-bold text-cyan-400 select-none">C++</span>,
    c: <span className="text-[10px] font-bold text-slate-300 select-none">C</span>,
    go: <span className="text-[10px] font-bold text-teal-400 select-none">GO</span>,
    rs: <span className="text-[10px] font-bold text-rose-400 select-none">RS</span>,
    html: <span className="text-[10px] font-bold text-orange-400 select-none">HTML</span>,
    css: <span className="text-[10px] font-bold text-blue-300 select-none">CSS</span>,
    json: <span className="text-[10px] text-yellow-300 font-mono select-none">{'{}'}</span>,
    yml: <span className="text-[10px] text-purple-400 select-none">⚙</span>,
    yaml: <span className="text-[10px] text-purple-400 select-none">⚙</span>,
    xml: <span className="text-[10px] text-red-400 select-none">XML</span>,
    sql: <span className="text-[10px] text-indigo-400 select-none">SQL</span>,
  }
  return iconMap[ext] || <FileCode size={12} className="text-ide-text" />
}

export default function TabBar() {
  const { openTabs, activeEditorTab, setActiveEditorTab, closeTab, createFile } = useStore()
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const handleCreateFileSubmit = (e) => {
    e.preventDefault()
    const trimmed = newFileName.trim()
    if (!trimmed) return
    createFile(trimmed)
    setNewFileName('')
    setShowNewFileModal(false)
  }

  const handleQuickLanguage = (langExt) => {
    const defaultNames = {
      py: 'main.py',
      js: 'index.js',
      ts: 'index.ts',
      cpp: 'main.cpp',
      java: 'Main.java',
      go: 'main.go',
      rs: 'main.rs',
      html: 'index.html',
    }
    const name = defaultNames[langExt] || `file.${langExt}`
    createFile(name)
    setShowNewFileModal(false)
  }

  return (
    <div className="flex items-center bg-ide-sidebar border-b border-ide-border overflow-x-auto shrink-0 relative" style={{ minHeight: '35px', height: '35px' }}>
      {/* Tabs List */}
      <div className="flex items-stretch h-full overflow-x-auto">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeEditorTab
          return (
            <div
              key={tab.id}
              onClick={() => setActiveEditorTab(tab.id)}
              className={`
                flex items-center gap-2 px-3.5 text-xs cursor-pointer whitespace-nowrap border-r border-ide-border shrink-0 transition-all group relative select-none
                ${isActive
                  ? 'bg-ide-panel text-ide-text-bright'
                  : 'text-ide-text hover:bg-ide-panel/50 hover:text-ide-text-bright'
                }
              `}
            >
              {/* Active tab top border indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-ide-accent" />
              )}
              <TabIcon tab={tab} />
              <span>{tab.name}</span>
              {tab.closable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                  title="Close tab"
                  className="opacity-0 group-hover:opacity-100 hover:text-white transition-all rounded p-0.5 hover:bg-ide-border cursor-pointer ml-1"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* VS Code New File (+) Button */}
      <div className="relative flex items-center px-1 shrink-0">
        <button
          onClick={() => setShowNewFileModal(!showNewFileModal)}
          title="New File (Python, JS, C++, Java, etc.)"
          className="p-1.5 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
        >
          <Plus size={14} />
        </button>

        {/* New File Inline Dropdown */}
        {showNewFileModal && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-ide-panel border border-ide-border rounded-xl shadow-2xl z-50 p-3 text-xs slide-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-ide-text-bright text-[11px] uppercase tracking-wider">
                Create New File
              </span>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="text-ide-text/40 hover:text-ide-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="space-y-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. main.c, main.cpp, Main.java, main.py, index.js"
                autoFocus
                className="w-full bg-ide-bg border border-ide-border rounded-lg px-2.5 py-1.5 text-xs text-ide-text-bright font-mono outline-none focus:border-ide-accent placeholder-ide-text/30"
              />
              <button
                type="submit"
                disabled={!newFileName.trim()}
                className="w-full py-1.5 bg-ide-accent hover:bg-ide-accent-hover disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Create File
              </button>
            </form>

            <div className="mt-2 pt-2 border-t border-ide-border/60">
              <span className="text-[10px] text-ide-text/40 block mb-1 font-semibold uppercase">
                Select language mode:
              </span>
              <div className="max-h-36 overflow-y-auto divide-y divide-ide-border/30">
                {[
                  { label: 'C', ext: 'c' },
                  { label: 'C++', ext: 'cpp' },
                  { label: 'Java', ext: 'java' },
                  { label: 'Python', ext: 'py' },
                  { label: 'JavaScript', ext: 'js' },
                ].map((item) => (
                  <div
                    key={item.ext}
                    onClick={() => handleQuickLanguage(item.ext)}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-ide-accent/15 cursor-pointer text-ide-text hover:text-ide-text-bright rounded transition-colors text-xs"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono text-ide-text/40">.{item.ext}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
