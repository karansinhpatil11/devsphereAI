import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import {
  Home,
  Building2,
  FileText,
  Users,
  Grid,
  TrendingUp,
  Bell,
  Megaphone,
  CreditCard,
  Settings,
  LogOut,
  Search,
  Terminal as TerminalIcon,
  ChevronDown,
  X,
  Code2,
  Bot,
  Sparkles,
  CheckSquare,
  BookOpen,
  GitPullRequest,
  Globe,
  RefreshCw,
} from 'lucide-react'

import ProtocolDashboard from '../components/ProtocolDashboard'
import CompilerView from '../components/CompilerView'
import AIAssistant from '../components/AIAssistant'
import TaskPanel from '../components/TaskPanel'
import DocPanel from '../components/DocPanel'
import SettingsPanel from '../components/SettingsPanel'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'
import CodeEditor from '../components/CodeEditor'
import Terminal from '../components/Terminal'
import WelcomeScreen from '../components/WelcomeScreen'

function EditorArea() {
  const { activeEditorTab, openTabs } = useStore()

  if (!activeEditorTab || activeEditorTab === 'welcome' || openTabs.length === 0) {
    return <WelcomeScreen />
  }

  return <CodeEditor tabId={activeEditorTab} />
}

// VS Code-style bottom panel: Terminal, Output, Problems, Debug Console
function BottomPanel({ visible, onToggle, onClose, activeBottomTab, setActiveBottomTab, compilerOutput }) {
  if (!visible) return null

  const problemCount = 0
  const outputLines = compilerOutput || null

  return (
    <div className="flex flex-col bg-[#070b16] border-t border-ide-border shrink-0" style={{ height: '220px' }}>
      {/* Panel tab bar */}
      <div className="flex items-center justify-between px-2 h-8 bg-[#090d1c] border-b border-ide-border shrink-0 select-none">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveBottomTab('terminal')}
            className={`px-2.5 py-1 text-[11px] rounded-t transition-colors cursor-pointer ${
              activeBottomTab === 'terminal'
                ? 'text-ide-text-bright border-b-2 border-ide-accent font-semibold'
                : 'text-ide-text/50 hover:text-ide-text'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TerminalIcon size={11} />
              TERMINAL
            </span>
          </button>
          <button
            onClick={() => setActiveBottomTab('output')}
            className={`px-2.5 py-1 text-[11px] rounded-t transition-colors cursor-pointer ${
              activeBottomTab === 'output'
                ? 'text-ide-text-bright border-b-2 border-ide-accent font-semibold'
                : 'text-ide-text/50 hover:text-ide-text'
            }`}
          >
            OUTPUT
          </button>
          <button
            onClick={() => setActiveBottomTab('problems')}
            className={`px-2.5 py-1 text-[11px] rounded-t transition-colors cursor-pointer ${
              activeBottomTab === 'problems'
                ? 'text-ide-text-bright border-b-2 border-ide-accent font-semibold'
                : 'text-ide-text/50 hover:text-ide-text'
            }`}
          >
            <span className="flex items-center gap-1.5">
              PROBLEMS
              {problemCount > 0 && (
                <span className="px-1.5 py-0 rounded-full bg-ide-red/20 text-ide-red text-[9px] font-bold">{problemCount}</span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveBottomTab('debug')}
            className={`px-2.5 py-1 text-[11px] rounded-t transition-colors cursor-pointer ${
              activeBottomTab === 'debug'
                ? 'text-ide-text-bright border-b-2 border-ide-accent font-semibold'
                : 'text-ide-text/50 hover:text-ide-text'
            }`}
          >
            <span className="flex items-center gap-1.5">
              DEBUG CONSOLE
            </span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            title="Toggle Panel"
            className="p-1 text-ide-text/40 hover:text-ide-text cursor-pointer"
          >
            <ChevronDown size={12} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel (Ctrl + `)"
            className="p-1 text-ide-text/40 hover:text-ide-text cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto">
        {activeBottomTab === 'terminal' && <Terminal />}
        {activeBottomTab === 'output' && (
          <div className="h-full font-mono text-xs">
            {outputLines ? (
              <div className="p-3 space-y-2">
                {outputLines.status === 'RUNNING' && (
                  <div className="text-amber-400 italic animate-pulse">⟳ Compiling and executing...</div>
                )}
                {outputLines.status !== 'RUNNING' && (
                  <>
                    {outputLines.stdout && (
                      <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">{outputLines.stdout}</pre>
                    )}
                    {outputLines.stderr && (
                      <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed">{outputLines.stderr}</pre>
                    )}
                    {!outputLines.stdout && !outputLines.stderr && (
                      <div className="text-ide-text/40 italic">Process finished with no output.</div>
                    )}
                    <div className="text-[10px] text-ide-text/30 flex items-center gap-3 pt-1 border-t border-ide-border/30 mt-2">
                      {outputLines.success !== undefined && (
                        <span className={outputLines.success ? 'text-emerald-400' : 'text-rose-400'}>
                          {outputLines.success ? '✓ Success' : '✗ Failed'} (exit code: {outputLines.exitCode ?? '?'})
                        </span>
                      )}
                      {outputLines.executionTimeMs !== undefined && (
                        <span>⏱ {outputLines.executionTimeMs}ms</span>
                      )}
                      {outputLines.runner && <span>Engine: {outputLines.runner}</span>}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 text-ide-text/40 italic">
                No output yet. Run code from the editor (Ctrl + Enter) to see output here.
              </div>
            )}
          </div>
        )}
        {activeBottomTab === 'problems' && (
          <div className="p-3 text-xs font-mono text-ide-text/40 italic">
            No problems detected in workspace.
          </div>
        )}
        {activeBottomTab === 'debug' && (
          <div className="p-3 text-xs font-mono text-ide-text/40 italic">
            Debug console is ready. Run code with breakpoints to see debug output.
          </div>
        )}
      </div>
    </div>
  )
}

export default function IDELayout() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { currentView, setCurrentView } = useStore()

  const [showBottomPanel, setShowBottomPanel] = useState(false)
  const [activeBottomTab, setActiveBottomTab] = useState('terminal')
  const [compilerOutput, setCompilerOutput] = useState(null)
  const [headerSearch, setHeaderSearch] = useState('')

  // Expose compiler output trigger to bottom panel
  useEffect(() => {
    window.__ideSetCompilerOutput = (output) => {
      setCompilerOutput(output)
      setShowBottomPanel(true)
      setActiveBottomTab('output')
    }
    return () => { delete window.__ideSetCompilerOutput }
  }, [])

  // Ctrl+` keyboard shortcut for terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        setShowBottomPanel((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    navigate('/login')
  }

  // ── Navigation Items (Exact from Reference Image) ────────────────────
  const navMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      targetView: 'dashboard',
    },
    {
      id: 'department',
      label: 'Department',
      icon: Building2,
      targetView: 'editor',
    },
    {
      id: 'accounting',
      label: 'Accounting and Finance',
      icon: FileText,
      targetView: 'compiler',
    },
    {
      id: 'employee',
      label: 'Employee',
      icon: Users,
      targetView: 'ai_assistant',
    },
    {
      id: 'token',
      label: 'Token',
      icon: Grid,
      targetView: 'tasks',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: TrendingUp,
      targetView: 'dashboard',
    },
    {
      id: 'notification',
      label: 'Notification',
      icon: Bell,
      targetView: 'docs',
    },
    {
      id: 'announcement',
      label: 'Announcement',
      icon: Megaphone,
      targetView: 'github',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      targetView: 'settings',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      targetView: 'settings',
    },
  ]

  return (
    <div className="w-screen h-screen bg-[#d8e7f3] p-3 md:p-5 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* ── Main Application Container (Curved card with shadow) ──────── */}
      <div className="w-full h-full bg-white rounded-3xl shadow-2xl border border-[#c6dcee] flex overflow-hidden">
        {/* ── Left Sidebar: Deep Navy Blue Theme ──────────────────────── */}
        <aside className="w-60 bg-[#093557] text-white p-5 flex flex-col justify-between shrink-0 select-none shadow-md z-20">
          <div>
            {/* Logo Brand Header */}
            <div className="flex items-center gap-3 mb-6 pl-1">
              <div className="w-9 h-9 rounded-full bg-[#05233a] border border-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                <span className="text-base font-black tracking-tight">P</span>
              </div>
              <div className="font-bold text-[15px] tracking-wide text-white">
                Micon Protocol
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1">
              {navMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.targetView

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.targetView)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#093557] font-semibold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Bottom Log Out Section */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-white/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-full transition-colors cursor-pointer"
            >
              <LogOut size={16} strokeWidth={1.75} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* ── Right Content Area ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#eef5fa]">
          {/* Top Header Bar */}
          <header className="h-14 px-6 flex items-center justify-between bg-transparent shrink-0">
            {/* Search Pill Input */}
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search here"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full bg-[#d7e7f2] text-slate-700 text-xs pl-4 pr-9 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#093557]/20 placeholder-slate-400"
              />
              <Search
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                {isAuthenticated && user?.name ? user.name : 'Alex Tori'}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shadow-sm cursor-pointer hover:ring-2 hover:ring-[#093557]/20 transition-all">
                <img
                  src={
                    isAuthenticated && user?.avatar
                      ? user.avatar
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://ui-avatars.com/api/?name=Alex+Tori&background=093557&color=fff'
                  }}
                />
              </div>
            </div>
          </header>

          {/* ── Dynamic Main View Content ─────────────────────────────── */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* 1. Protocol Dashboard (Matches User's Screenshot) */}
            {currentView === 'dashboard' && (
              <ProtocolDashboard onNavigateView={(view) => setCurrentView(view)} />
            )}

            {/* 2. Code Studio (Department / Editor) */}
            {currentView === 'editor' && (
              <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <TabBar />
                  <div className="flex-1 overflow-hidden">
                    <EditorArea />
                  </div>
                  <BottomPanel
                    visible={showBottomPanel}
                    onToggle={() => setShowBottomPanel(!showBottomPanel)}
                    onClose={() => setShowBottomPanel(false)}
                    activeBottomTab={activeBottomTab}
                    setActiveBottomTab={setActiveBottomTab}
                    compilerOutput={compilerOutput}
                  />
                </div>
                <AIAssistant />
              </div>
            )}

            {/* 3. Compiler Hub (Accounting & Finance) */}
            {currentView === 'compiler' && (
              <div className="flex-1 overflow-auto bg-[#1a1b26] p-4">
                <CompilerView />
              </div>
            )}

            {/* 4. AI Agent Chat (Employee) */}
            {currentView === 'ai_assistant' && (
              <div className="flex-1 flex overflow-hidden">
                <AIAssistant />
              </div>
            )}

            {/* 5. Task Tracker (Token) */}
            {currentView === 'tasks' && (
              <div className="flex-1 overflow-auto bg-[#1a1b26] p-6">
                <div className="max-w-4xl mx-auto">
                  <TaskPanel />
                </div>
              </div>
            )}

            {/* 6. Documentation (Notification) */}
            {currentView === 'docs' && (
              <div className="flex-1 overflow-auto bg-[#1a1b26] p-6">
                <div className="max-w-4xl mx-auto">
                  <DocPanel />
                </div>
              </div>
            )}

            {/* 7. Settings & Billing */}
            {currentView === 'settings' && (
              <div className="flex-1 overflow-auto bg-[#1a1b26] p-6">
                <div className="max-w-3xl mx-auto">
                  <SettingsPanel />
                </div>
              </div>
            )}

            {/* 8. Announcement / GitHub */}
            {currentView === 'github' && (
              <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <div className="flex-1 overflow-hidden">
                  <EditorArea />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
