import React, { useState, useEffect, useRef } from 'react'
import {
  Copy,
  Check,
  FileCode,
  Play,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal as TerminalIcon,
  X,
  ShieldAlert,
} from 'lucide-react'
import useStore from '../store/useStore'
import { githubAPI, compilerAPI, smartBugScan } from '../services/api'
import { fileCache, getOrCreateFile, detectLanguage, INITIAL_FILES } from '../store/fileStorage'

export const REPO_FILES = INITIAL_FILES
export { fileCache }

export default function CodeEditor({ tabId }) {
  const { setActiveEditorTab, activeRepoName, addChatMessage, lastFileAction } = useStore()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Compiler state for active editor
  const [isRunning, setIsRunning] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const textareaRef = useRef(null)

  // Resolve matching file key dynamically
  const resolveFileKey = (id) => {
    if (!id || id === 'welcome') return 'Main.java'
    if (fileCache[id]) return id
    if (fileCache[`${id}.c`]) return `${id}.c`
    if (fileCache[`${id}.cpp`]) return `${id}.cpp`
    if (fileCache[`${id}.java`]) return `${id}.java`
    if (fileCache[`${id}.py`]) return `${id}.py`
    if (fileCache[`${id}.js`]) return `${id}.js`
    const found = Object.keys(fileCache).find((k) => k.toLowerCase() === id.toLowerCase() || k.toLowerCase().startsWith(id.toLowerCase()))
    return found || id
  }

  const fileKey = resolveFileKey(tabId)
  const currentFile = fileCache[fileKey] || getOrCreateFile(fileKey)

  const [code, setCode] = useState(currentFile.content)

  // Sync editor content on tab switch
  useEffect(() => {
    const key = resolveFileKey(tabId)
    const file = fileCache[key] || getOrCreateFile(key)
    setCode(file.content)
    window.__ideActiveCode = {
      name: file.name,
      fileKey: key,
      lang: file.lang || detectLanguage(file.name),
      content: file.content,
    }
  }, [tabId, activeRepoName])

  // Sync editor content on AI or external file update
  useEffect(() => {
    if (!lastFileAction) return
    const target = lastFileAction.filename || ''
    const matches =
      target === currentFile.name ||
      target === fileKey ||
      resolveFileKey(target) === fileKey ||
      target.endsWith(`/${currentFile.name}`) ||
      currentFile.name.endsWith(`/${target}`) ||
      target.replace(/\.[^.]+$/, '') === currentFile.name.replace(/\.[^.]+$/, '')

    if (matches) {
      const file = fileCache[target] || fileCache[currentFile.name] || fileCache[fileKey]
      if (file && file.content !== undefined) {
        setCode(file.content)
        if (textareaRef.current) textareaRef.current.value = file.content
        window.__ideActiveCode = {
          name: currentFile.name,
          fileKey,
          lang: file.lang || detectLanguage(currentFile.name),
          content: file.content,
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    }
  }, [lastFileAction, currentFile.name, fileKey])

  // Direct editor update hook and custom event listener
  useEffect(() => {
    window.__ideSetEditorCode = (newContent, targetFilename) => {
      if (typeof newContent !== 'string') return
      setCode(newContent)
      if (textareaRef.current) textareaRef.current.value = newContent
      if (fileKey && fileCache[fileKey]) fileCache[fileKey].content = newContent
      if (currentFile?.name && fileCache[currentFile.name]) fileCache[currentFile.name].content = newContent
      if (targetFilename && fileCache[targetFilename]) fileCache[targetFilename].content = newContent
      const resolved = resolveFileKey(targetFilename || '')
      if (resolved && fileCache[resolved]) fileCache[resolved].content = newContent
      window.__ideActiveCode = {
        name: currentFile?.name || targetFilename || 'Main.java',
        fileKey: resolved || fileKey,
        lang: currentFile?.lang || detectLanguage(targetFilename || currentFile?.name || 'Main.java'),
        content: newContent,
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }

    const handleCustomUpdate = (e) => {
      if (!e.detail || typeof e.detail.code !== 'string') return
      const target = e.detail.filename || ''
      setCode(e.detail.code)
      if (textareaRef.current) textareaRef.current.value = e.detail.code
      if (fileKey && fileCache[fileKey]) fileCache[fileKey].content = e.detail.code
      if (currentFile?.name && fileCache[currentFile.name]) fileCache[currentFile.name].content = e.detail.code
      if (target && fileCache[target]) fileCache[target].content = e.detail.code
      const resolved = resolveFileKey(target || '')
      if (resolved && fileCache[resolved]) fileCache[resolved].content = e.detail.code
      window.__ideActiveCode = {
        name: currentFile?.name || target || 'Main.java',
        fileKey: resolved || fileKey,
        lang: currentFile?.lang || detectLanguage(currentFile?.name || target || 'Main.java'),
        content: e.detail.code,
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }

    window.addEventListener('ide-code-updated', handleCustomUpdate)
    return () => {
      window.removeEventListener('ide-code-updated', handleCustomUpdate)
    }
  }, [fileKey, currentFile])

  const handleCodeChange = (e) => {
    const val = e.target.value
    setCode(val)
    if (!fileCache[fileKey]) {
      fileCache[fileKey] = {
        name: currentFile.name,
        path: currentFile.path,
        lang: currentFile.lang,
        content: val,
      }
    } else {
      fileCache[fileKey].content = val
    }
    window.__ideActiveCode = {
      name: currentFile.name,
      fileKey,
      lang: currentFile.lang,
      content: val,
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const lines = (code || '').split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Compile & execute the current file — output goes to bottom panel
  const handleRunCode = async () => {
    if (isRunning) return
    setIsRunning(true)

    // Send "running" status to the bottom panel output
    if (window.__ideSetCompilerOutput) {
      window.__ideSetCompilerOutput({
        status: 'RUNNING',
        stdout: '',
        stderr: '',
        exitCode: null,
      })
    }

    try {
      const res = await compilerAPI.execute({
        language: currentFile.lang || 'java',
        code,
      })
      if (window.__ideSetCompilerOutput) {
        window.__ideSetCompilerOutput(res.data)
      }
    } catch (err) {
      if (window.__ideSetCompilerOutput) {
        window.__ideSetCompilerOutput({
          success: false,
          status: 'RUNTIME_ERROR',
          stdout: '',
          stderr: err.response?.data?.details || err.response?.data?.error || err.message,
          exitCode: 1,
          executionTimeMs: 0,
        })
      }
    } finally {
      setIsRunning(false)
    }
  }

  // Smart Bug Scan & Healing
  const handleScanCode = async () => {
    setIsScanning(true)
    try {
      const res = await smartBugScan({
        code,
        language: currentFile.lang || detectLanguage(currentFile.name),
        filename: currentFile.name,
      })
      const data = res.data || {}
      setScanResult(data)
      addChatMessage({
        role: 'assistant',
        thought: `Static analysis audit completed for ${currentFile.name}. Health score: ${data.healthScore}/100.`,
        content: `🛡️ **Code Scan Completed for \`${currentFile.name}\`**\n\n• **Health Score**: **${data.healthScore} / 100**\n• **Summary**: ${data.summary || 'Code audit complete.'}\n• **Security / Logic Bugs**: ${data.securityIssues?.length || 0}\n• **Performance Bottlenecks**: ${data.performanceIssues?.length || 0}\n\n${data.fixedCode ? '👇 Click below to apply the AI-fixed code directly to the editor:' : ''}`,
        code: data.fixedCode || null,
        codeLanguage: data.fixedLanguage || currentFile.lang,
        targetFile: currentFile.name,
      })
    } catch (err) {
      console.error('Scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }

  const handleApplyScanFix = () => {
    if (!scanResult || !scanResult.fixedCode) return
    const fixed = scanResult.fixedCode
    setCode(fixed)
    if (textareaRef.current) textareaRef.current.value = fixed
    if (fileKey && fileCache[fileKey]) fileCache[fileKey].content = fixed
    if (currentFile?.name && fileCache[currentFile.name]) fileCache[currentFile.name].content = fixed
    const resolved = resolveFileKey(currentFile?.name || fileKey)
    if (resolved && fileCache[resolved]) fileCache[resolved].content = fixed
    window.__ideActiveCode = {
      name: currentFile.name,
      fileKey: resolved || fileKey,
      lang: scanResult.fixedLanguage || currentFile.lang,
      content: fixed,
    }
    useStore.getState().updateFile(currentFile.name, fixed, 'ai')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    setScanResult((prev) => ({ ...prev, applied: true }))
  }

  // Keyboard shortcut listener on editor textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const val = e.target.value
      const updated = val.substring(0, start) + '    ' + val.substring(end)
      setCode(updated)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4
          textareaRef.current.selectionEnd = start + 4
        }
      }, 0)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleRunCode()
    }
  }

  return (
    <div className="flex flex-col h-full bg-ide-bg overflow-hidden text-xs font-mono">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-ide-sidebar border-b border-ide-border shrink-0 text-ide-text">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode size={13} className="text-ide-accent shrink-0" />
          <span className="text-ide-text-bright font-semibold truncate">{currentFile.name}</span>
          <span className="text-[10px] text-ide-text/40 hidden sm:inline">
            ({currentFile.path})
          </span>
          <select
            value={currentFile.lang || 'c'}
            onChange={(e) => {
              const newLang = e.target.value
              currentFile.lang = newLang
              if (window.__ideActiveCode) window.__ideActiveCode.lang = newLang
              setCode((prev) => prev)
            }}
            className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-ide-accent/15 text-ide-accent border border-ide-accent/30 outline-none cursor-pointer hover:border-ide-accent transition-colors"
            title="Language Mode (C, C++, Java, Python, JavaScript)"
          >
            <option value="c" className="bg-[#0b1021] text-ide-text">C</option>
            <option value="cpp" className="bg-[#0b1021] text-ide-text">C++</option>
            <option value="java" className="bg-[#0b1021] text-ide-text">Java</option>
            <option value="python" className="bg-[#0b1021] text-ide-text">Python</option>
            <option value="javascript" className="bg-[#0b1021] text-ide-text">JavaScript</option>
          </select>
          <span className="text-[10px] text-ide-text/40">({lines.length} lines)</span>
          {saved && (
            <span className="text-[10px] text-ide-green flex items-center gap-1 animate-pulse">
              <Check size={10} /> Saved
            </span>
          )}
          {lastFileAction?.by === 'ai' && (lastFileAction.filename === currentFile.name) && (
            <span className="text-[10px] text-ide-purple bg-ide-purple/15 border border-ide-purple/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold animate-pulse">
              <Sparkles size={10} /> AI Modified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Health Score Badge if scanned */}
          {scanResult && (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  scanResult.healthScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                title="Code Quality & Security Score"
              >
                Health: {scanResult.healthScore}/100
              </span>
              {scanResult.fixedCode && !scanResult.applied && (
                <button
                  onClick={handleApplyScanFix}
                  title="Apply AI fixed code to editor"
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition-colors cursor-pointer shadow-sm animate-pulse"
                >
                  <Sparkles size={11} />
                  <span>⚡ Apply Fix</span>
                </button>
              )}
              {scanResult.applied && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Fixed
                </span>
              )}
            </div>
          )}

          {/* Scan Code Button */}
          <button
            onClick={handleScanCode}
            disabled={isScanning}
            title="Scan code for bugs, errors, and performance"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ide-panel hover:bg-ide-border border border-ide-border text-ide-text-bright font-medium transition-colors cursor-pointer text-[11px] shadow-sm disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Sparkles size={11} className="text-amber-400 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={11} className="text-amber-400" />
                <span>Scan Code</span>
              </>
            )}
          </button>

          {/* Run / Compile button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            title="Run Code (Ctrl + Enter)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer text-[11px] shadow-sm disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Sparkles size={11} className="animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={11} fill="currentColor" />
                <span>Run Code</span>
                <span className="text-[9px] opacity-60 font-normal hidden md:inline">(Ctrl+↵)</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check size={11} className="text-ide-green" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor body with synchronized line numbers and textarea */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0b1021]">
        <div className="flex-1 flex overflow-hidden relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-ide-text/50">
              Loading file content...
            </div>
          ) : (
            <>
              {/* Line numbers column */}
              <div className="w-12 py-3 bg-[#080d1c] select-none border-r border-ide-border/50 text-right pr-3 text-ide-text/30 font-mono overflow-hidden shrink-0">
                {lines.map((_, idx) => (
                  <div key={idx} className="leading-6 h-6">
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Editable textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-ide-text-bright font-mono text-xs leading-6 resize-none outline-none overflow-auto whitespace-pre tab-4 border-none selection:bg-ide-accent/30 caret-ide-accent"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
