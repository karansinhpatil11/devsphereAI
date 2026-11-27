import React from 'react'
import ActivityBar from '../components/ActivityBar'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'
import AIAssistant from '../components/AIAssistant'
import useStore from '../store/useStore'
import { Globe, RefreshCw, ChevronDown, Terminal as TerminalIcon, X, Bug, ListChecks } from 'lucide-react'

import CodeEditor from '../components/CodeEditor'
import Terminal from '../components/Terminal'
import WelcomeScreen from '../components/WelcomeScreen'

function EditorArea() {
  const { activeEditorTab, openTabs } = useStore()

  if (!activeEditorTab || activeEditorTab === 'welcome' || openTabs.length === 0) {
    return <WelcomeScreen />
  }

  // Render file editor for selected file tabs
  return <CodeEditor key={activeEditorTab} tabId={activeEditorTab} />
}

// VS Code-style bottom panel: Terminal, Output, Problems, Debug Console
function BottomPanel({ visible, onToggle, onClose, activeBottomTab, setActiveBottomTab, compilerOutput }) {
  if (!visible) return null

  const problemCount = 0
  const outputLines = compilerOutput || null

  return (
    <div className="flex flex-col bg-ide-panel border-t border-ide-border shrink-0" style={{ height: '220px' }}>
      {/* Panel tab bar */}
      <div className="flex items-center justify-between px-2 h-8 bg-ide-sidebar border-b border-ide-border shrink-0 select-none">
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
  const { setActiveEditorTab, openTabs, activeEditorTab, activeRepoName, isSidebarOpen } = useStore()
  const [fullscreen, setFullscreen] = React.useState(false)
  const [showBottomPanel, setShowBottomPanel] = React.useState(false)
  const [activeBottomTab, setActiveBottomTab] = React.useState('terminal')
  const [compilerOutput, setCompilerOutput] = React.useState(null)

  // Expose a way for CodeEditor to send output to the bottom panel
  React.useEffect(() => {
    window.__ideSetCompilerOutput = (output) => {
      setCompilerOutput(output)
      setShowBottomPanel(true)
      setActiveBottomTab('output')
    }
    return () => { delete window.__ideSetCompilerOutput }
  }, [])

  // Ctrl+` keyboard shortcut to toggle terminal/bottom panel
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        setShowBottomPanel((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ide-bg border border-ide-border/60">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-ide-sidebar border-b border-ide-border shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Traffic lights with functionality */}
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => window.close()}
              title="Close workspace"
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-pointer"
            />
            <button
              onClick={() => setShowBottomPanel(!showBottomPanel)}
              title="Toggle Panel"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 cursor-pointer"
            />
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-pointer"
            />
          </div>
        </div>

        {/* URL / Workspace bar */}
        <div className="flex items-center gap-2 bg-ide-bg border border-ide-border/80 focus-within:border-ide-accent/60 rounded-md px-3 py-1 flex-1 mx-6 max-w-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
          <Globe size={11} className="text-ide-accent/70 shrink-0" />
          <span className="text-xs text-ide-text truncate">
            {`devsphere://${activeRepoName || 'workspace'}/${activeEditorTab || 'welcome'}`}
          </span>
          <button
            onClick={handleRefresh}
            title="Reload IDE"
            className="ml-auto text-ide-text/50 hover:text-ide-accent cursor-pointer transition-colors"
          >
            <RefreshCw size={11} className="shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-2" />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar with Slide Menu Transition */}
        <div
          className={`transition-all duration-300 ease-in-out flex shrink-0 overflow-hidden ${
            isSidebarOpen ? 'w-64 border-r border-ide-border' : 'w-0 border-none opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-64 h-full flex flex-col overflow-hidden">
            <Sidebar />
          </div>
        </div>

        {/* Editor + Tabs + Bottom Panel */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            <EditorArea />
          </div>
          {/* VS Code-style bottom panel */}
          <BottomPanel
            visible={showBottomPanel}
            onToggle={() => setShowBottomPanel(!showBottomPanel)}
            onClose={() => setShowBottomPanel(false)}
            activeBottomTab={activeBottomTab}
            setActiveBottomTab={setActiveBottomTab}
            compilerOutput={compilerOutput}
          />
        </div>

        {/* AI Assistant Panel */}
        <AIAssistant />
      </div>
    </div>
  )
}
