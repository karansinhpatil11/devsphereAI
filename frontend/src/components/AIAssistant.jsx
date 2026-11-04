import React, { useRef, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import useStore from '../store/useStore'
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ChevronDown,
  ShieldAlert,
  Zap,
  FileCode,
  BookOpen,
  GitPullRequest,
  Sparkles,
  Bug,
  Code2,
  TestTube2,
  Languages,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  ExternalLink,
  Activity,
} from 'lucide-react'
import {
  sendChatMessage,
  analyzeDiff,
  codingAssist,
  smartBugScan,
  generateDocs,
  reviewCodePR,
  githubAPI,
} from '../services/api'

// ── Code Block Component ─────────────────────────────
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-ide-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-bg/80 border-b border-ide-border">
        <span className="text-[10px] text-ide-text/50 font-mono uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
        >
          {copied ? <Check size={10} className="text-ide-green" /> : <Copy size={10} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-ide-text-bright bg-ide-bg overflow-x-auto leading-relaxed max-h-60">
        {code}
      </pre>
    </div>
  )
}

// ── Message Component ─────────────────────────────────
function ChatMessage({ message, onApplyCode }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2.5 slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5 ${
          isUser ? 'bg-ide-accent/30' : 'bg-ide-purple/30'
        }`}
      >
        {isUser ? <User size={13} className="text-ide-accent" /> : <Bot size={13} className="text-ide-purple" />}
      </div>

      <div className={`flex-1 max-w-[88%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
            isUser
              ? 'bg-ide-accent/20 border border-ide-accent/30 text-ide-text-bright rounded-tr-sm'
              : 'bg-ide-border/60 text-ide-text-bright rounded-tl-sm'
          }`}
        >
          {message.mcpToolUsed && (
            <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 bg-ide-accent/15 border border-ide-accent/30 rounded text-[9px] text-ide-accent w-fit font-mono">
              <span>⚡ MCP: {message.mcpToolUsed}</span>
            </div>
          )}
          {message.thought && (
            <div className="mb-2 p-2 bg-ide-bg/80 border-l-2 border-ide-purple rounded text-[11px] text-ide-text/70 italic leading-relaxed">
              <span className="font-semibold text-[10px] text-ide-purple not-italic uppercase tracking-wider block mb-0.5">
                🧠 Reasoning
              </span>
              {message.thought}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.code && <CodeBlock code={message.code} language={message.codeLanguage} />}
        </div>

        {/* Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {message.actions.map((action) => (
              <button
                key={action}
                onClick={() => onApplyCode?.(action, message)}
                className="btn-primary text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-ide-text/30 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── Model Selector (Google Gemini Free Tier) ──────────
const MODELS = [
  'Gemini 3.8 Flash (Free)',
  'Gemini 2.5 Flash (Free)',
  'Gemini 2.0 Flash (Free)',
  'Gemini 1.5 Flash (Free)',
]

function ModelSelector({ model, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-ide-text/50 hover:text-ide-text-bright transition-colors cursor-pointer"
        title="Google Gemini Free Tier Model"
      >
        <Zap size={9} className="text-ide-yellow" />
        {model}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-44 bg-ide-panel border border-ide-border rounded-lg shadow-xl z-50 py-1 slide-in">
          <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-ide-text/40 border-b border-ide-border mb-1">
            Free Models
          </div>
          {MODELS.map((m) => (
            <button
              key={m}
              onClick={() => {
                onChange(m)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                model === m
                  ? 'text-ide-accent bg-ide-accent/10 font-medium'
                  : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Sample file code for quick active analysis
const DEFAULT_ACTIVE_CODE = `package com.company.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class AppService {

    private static final Logger logger = LoggerFactory.getLogger(AppService.class);
    private final DataRepository repository;

    public AppService(DataRepository repository) {
        this.repository = repository;
    }

    public Data getData() {
        return repository.fetchData();
    }
}`

export default function AIAssistant() {
  const {
    chatMessages,
    chatInput,
    setChatInput,
    isAiTyping,
    addChatMessage,
    setAiTyping,
    aiModel,
    mcpConnected,
    currentPR,
    activeEditorTab,
  } = useStore()

  // Navigation mode: 'coding' | 'bugs' | 'docs' | 'github'
  const [activeMode, setActiveMode] = useState('coding')
  const [localModel, setLocalModel] = useState(aiModel || 'Gemini 3.8 Flash (Free)')
  const messagesEndRef = useRef(null)

  // Coding Assistant State
  const [convertTargetLang, setConvertTargetLang] = useState('python')
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [codingResult, setCodingResult] = useState(null)
  const [isCodingLoading, setIsCodingLoading] = useState(false)

  // Smart Bug Detector State
  const [bugScanResult, setBugScanResult] = useState(null)
  const [isScanningBugs, setIsScanningBugs] = useState(false)

  // Documentation Generator State
  const [generatedDoc, setGeneratedDoc] = useState(null)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [docSaved, setDocSaved] = useState(false)

  // GitHub Insights State
  const [repoInsights, setRepoInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAiTyping])

  // Get active code from editor
  const getEditorCode = () => {
    return DEFAULT_ACTIVE_CODE
  }

  // ── 1. AI Coding Assistant Actions ──────────────────
  const handleCodingAction = async (action, targetLang = convertTargetLang, promptText = '') => {
    setIsCodingLoading(true)
    setCodingResult(null)
    const code = getEditorCode()

    let displayPrompt = ''
    if (action === 'explain') displayPrompt = 'Explain the active AppService.java code in detail.'
    else if (action === 'generate') displayPrompt = `Generate code: ${promptText || 'JWT Authentication Filter'}`
    else if (action === 'fix_bugs') displayPrompt = 'Find and fix all bugs in AppService.java.'
    else if (action === 'refactor') displayPrompt = 'Refactor AppService.java with clean architecture and SOLID principles.'
    else if (action === 'generate_tests') displayPrompt = 'Generate unit test suite for AppService.java with mocks.'
    else if (action === 'convert') displayPrompt = `Convert AppService.java code to ${targetLang}.`

    try {
      const res = await codingAssist({
        action,
        code,
        language: 'java',
        targetLanguage: targetLang,
        prompt: promptText || displayPrompt,
        model: localModel,
      })

      setCodingResult({
        action,
        title: res.data.title || displayPrompt,
        content: res.data.content,
        thought: res.data.thought,
        code: res.data.code,
        codeLanguage: res.data.codeLanguage || (action === 'convert' ? targetLang : 'java'),
        actions: ['Apply Code', 'Create PR'],
      })
    } catch (err) {
      setCodingResult({
        action,
        title: 'Error',
        content: `Error running ${action}: ${err.response?.data?.error || err.message}`,
      })
    } finally {
      setIsCodingLoading(false)
    }
  }

  // ── 4. Smart Bug Detector Scan ──────────────────────
  const handleRunBugScan = async () => {
    setIsScanningBugs(true)
    setBugScanResult(null)
    try {
      const code = getEditorCode()
      const res = await smartBugScan({
        code,
        language: 'java',
        filename: 'AppService.java',
        model: localModel,
      })
      setBugScanResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsScanningBugs(false)
    }
  }

  // ── 5. Documentation Generator Action ───────────────
  const handleGenerateDoc = async (docType) => {
    setIsGeneratingDoc(true)
    setGeneratedDoc(null)
    setDocSaved(false)
    try {
      const res = await generateDocs({
        docType,
        code: getEditorCode(),
        projectInfo: {
          name: 'core-service',
          framework: 'Spring Boot 3.2 / Java 17',
          repository: 'karansinhpatil11/final-year-project',
        },
        saveToDocs: true,
        model: localModel,
      })
      setGeneratedDoc(res.data)
      setDocSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGeneratingDoc(false)
    }
  }

  // ── 2. GitHub Insights & Review ─────────────────────
  const fetchInsights = async () => {
    setLoadingInsights(true)
    try {
      const res = await githubAPI.getInsights('core-service')
      setRepoInsights(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleReviewPR = async () => {
    setActiveMode('chat')
    setAiTyping(true)
    addChatMessage({ role: 'user', content: 'Run comprehensive AI Code Review for PR #452.' })
    try {
      const diff = `${currentPR.diffOld}\n---\n${currentPR.diffNew}`
      const res = await reviewCodePR({
        diff,
        prTitle: 'PR #452: Fix data fetch issues',
        model: localModel,
      })
      addChatMessage({
        role: 'assistant',
        content: res.data.content,
        thought: res.data.thought,
        code: res.data.code,
        codeLanguage: res.data.codeLanguage,
        actions: ['Apply Code', 'Create PR'],
      })
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        content: 'Failed to complete code review: ' + (err.response?.data?.error || err.message),
      })
    } finally {
      setAiTyping(false)
    }
  }

  // ── Chat Send ───────────────────────────────────────
  const handleSend = async () => {
    const message = chatInput.trim()
    if (!message || isCodingLoading || isAiTyping) return

    setChatInput('')
    setIsCodingLoading(true)
    setCodingResult(null)
    setActiveMode('coding')

    try {
      const res = await codingAssist({
        action: 'generate',
        code: getEditorCode(),
        language: 'java',
        prompt: message,
        model: localModel,
      })

      setCodingResult({
        action: 'custom',
        title: message,
        content: res.data.content,
        thought: res.data.thought,
        code: res.data.code,
        codeLanguage: res.data.codeLanguage || 'java',
        actions: ['Apply Code', 'Create PR'],
      })
    } catch (err) {
      setCodingResult({
        action: 'custom',
        title: message,
        content: err.response?.data?.error || 'Could not reach AI service. Please verify backend connection.',
      })
    } finally {
      setIsCodingLoading(false)
    }
  }

  const handleApplyCode = (action, message) => {
    if (action === 'Apply Code' && message.code) {
      navigator.clipboard.writeText(message.code)
      useStore.getState().setActiveEditorTab('AppService')
      addChatMessage({
        role: 'assistant',
        content: '✅ Code copied to clipboard and switched to `AppService.java`! You can paste the refactored implementation directly.',
      })
    } else if (action === 'Create PR') {
      addChatMessage({ role: 'user', content: 'Create a PR with these changes.' })
      useStore.getState().setActiveEditorTab('pr-452')
      addChatMessage({
        role: 'assistant',
        content: '🚀 Pull Request `#452` ("Fix data fetch issues and improve error handling") is ready! Switched to GitHub Diff view to inspect side-by-side changes before merging.',
      })
    }
  }

  const clearChat = () => {
    if (chatMessages.length > 0 && window.confirm('Clear all conversation messages?')) {
      useStore.setState({ chatMessages: [] })
    }
  }

  return (
    <div className="flex flex-col h-full bg-ide-panel border-l border-ide-border" style={{ width: '330px', minWidth: '330px' }}>
      {/* Header with Mode Tabs */}
      <div className="flex flex-col border-b border-ide-border shrink-0 bg-ide-bg/40">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ide-accent to-ide-purple flex items-center justify-center">
              <Bot size={13} className="text-white" />
            </div>
            <span className="text-xs font-bold text-ide-text-bright">Gemini Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              title="Clear chat"
              onClick={clearChat}
              className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Feature Navigation Bar */}
        <div className="flex items-center px-2 pb-1 gap-1 text-[11px] font-medium overflow-x-auto select-none border-t border-ide-border/40 pt-1">
          <button
            onClick={() => setActiveMode('coding')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeMode === 'coding' ? 'bg-ide-accent/20 text-ide-accent font-semibold' : 'text-ide-text/60 hover:text-ide-text'
            }`}
          >
            ⚡ Coding
          </button>
          <button
            onClick={() => {
              setActiveMode('bugs')
              if (!bugScanResult) handleRunBugScan()
            }}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeMode === 'bugs' ? 'bg-ide-red/20 text-ide-red font-semibold' : 'text-ide-text/60 hover:text-ide-text'
            }`}
          >
            🛡️ Bug Detector
          </button>
          <button
            onClick={() => setActiveMode('docs')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeMode === 'docs' ? 'bg-ide-purple/20 text-ide-purple font-semibold' : 'text-ide-text/60 hover:text-ide-text'
            }`}
          >
            📄 Docs
          </button>
          <button
            onClick={() => {
              setActiveMode('github')
              if (!repoInsights) fetchInsights()
            }}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              activeMode === 'github' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-ide-text/60 hover:text-ide-text'
            }`}
          >
            🐙 GitHub
          </button>
        </div>
      </div>

      {/* Mode Viewport */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ── MODE 1: AI CODING ASSISTANT ── */}
        {activeMode === 'coding' && (
          <div className="space-y-3 slide-in">
            <div className="p-2.5 bg-ide-bg rounded-xl border border-ide-border space-y-1">
              <h3 className="text-xs font-semibold text-ide-text-bright flex items-center gap-1.5">
                <Code2 size={13} className="text-ide-accent" />
                <span>AI Coding Assistant</span>
              </h3>
              <p className="text-[11px] text-ide-text/60">
                Transform, optimize, test, and convert active code in `AppService.java`.
              </p>
            </div>

            {/* Loading Indicator */}
            {isCodingLoading && (
              <div className="p-4 bg-ide-bg rounded-xl border border-ide-accent/30 flex flex-col items-center justify-center gap-2.5 text-center">
                <div className="w-8 h-8 rounded-full bg-ide-accent/20 flex items-center justify-center animate-pulse">
                  <Sparkles size={16} className="text-ide-accent animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-ide-text-bright">Gemini 3.8 Flash Working...</div>
                  <div className="text-[10px] text-ide-text/50">Analyzing and synthesizing code response</div>
                </div>
              </div>
            )}

            {/* Display Coding Result if present */}
            {codingResult && !isCodingLoading && (
              <div className="space-y-3 slide-in">
                <div className="p-3 bg-ide-bg rounded-xl border border-ide-accent/40 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-ide-border/60 pb-2">
                    <span className="text-xs font-bold text-ide-accent flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span className="truncate max-w-[200px]">{codingResult.title}</span>
                    </span>
                    <button
                      onClick={() => setCodingResult(null)}
                      className="text-[10px] text-ide-text/50 hover:text-ide-text-bright px-1.5 py-0.5 rounded hover:bg-ide-border cursor-pointer shrink-0"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {codingResult.thought && (
                    <div className="p-2 bg-ide-panel/80 border-l-2 border-ide-purple rounded text-[11px] text-ide-text/70 italic leading-relaxed">
                      <span className="font-semibold text-[10px] text-ide-purple not-italic uppercase tracking-wider block mb-0.5">
                        🧠 Reasoning
                      </span>
                      {codingResult.thought}
                    </div>
                  )}

                  <div className="text-xs text-ide-text-bright leading-relaxed whitespace-pre-wrap">
                    {codingResult.content}
                  </div>

                  {codingResult.code && (
                    <CodeBlock code={codingResult.code} language={codingResult.codeLanguage} />
                  )}

                  <div className="flex gap-2 pt-1 border-t border-ide-border/60">
                    {codingResult.code && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(codingResult.code)
                          useStore.getState().setActiveEditorTab('AppService')
                        }}
                        className="flex-1 py-1.5 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Apply to AppService.java
                      </button>
                    )}
                    <button
                      onClick={() => setCodingResult(null)}
                      className="py-1.5 px-3 bg-ide-panel hover:bg-ide-border text-ide-text rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Run Another
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Coding Action Grid */}
            {!codingResult && !isCodingLoading && (
              <>
                <div className="grid grid-cols-1 gap-2">
                  <button
                onClick={() => handleCodingAction('explain')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-ide-bg hover:bg-ide-accent/15 border border-ide-border hover:border-ide-accent/40 text-xs text-left transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-ide-accent/20 text-ide-accent">
                  <Sparkles size={14} />
                </div>
                <div>
                  <div className="font-semibold text-ide-text-bright">Explain Code</div>
                  <div className="text-[10px] text-ide-text/50">Analyze flow, logic & edge cases</div>
                </div>
              </button>

              <button
                onClick={() => handleCodingAction('fix_bugs')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-ide-bg hover:bg-ide-red/15 border border-ide-border hover:border-ide-red/40 text-xs text-left transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-ide-red/20 text-ide-red">
                  <Bug size={14} />
                </div>
                <div>
                  <div className="font-semibold text-ide-text-bright">Fix Bugs</div>
                  <div className="text-[10px] text-ide-text/50">Resolve NullPointerException & leaks</div>
                </div>
              </button>

              <button
                onClick={() => handleCodingAction('refactor')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-ide-bg hover:bg-ide-purple/15 border border-ide-border hover:border-ide-purple/40 text-xs text-left transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-ide-purple/20 text-ide-purple">
                  <RefreshCw size={14} />
                </div>
                <div>
                  <div className="font-semibold text-ide-text-bright">Refactor Code</div>
                  <div className="text-[10px] text-ide-text/50">Clean code, SOLID & design patterns</div>
                </div>
              </button>

              <button
                onClick={() => handleCodingAction('generate_tests')}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-ide-bg hover:bg-ide-green/15 border border-ide-border hover:border-ide-green/40 text-xs text-left transition-colors cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-ide-green/20 text-ide-green">
                  <TestTube2 size={14} />
                </div>
                <div>
                  <div className="font-semibold text-ide-text-bright">Generate Tests</div>
                  <div className="text-[10px] text-ide-text/50">JUnit 5 test suite with mocks</div>
                </div>
              </button>
            </div>

            {/* Convert Code Tool */}
            <div className="p-3 bg-ide-bg rounded-xl border border-ide-border space-y-2">
              <label className="text-[11px] font-semibold text-ide-text-bright flex items-center gap-1.5">
                <Languages size={13} className="text-amber-400" />
                <span>Convert Code Between Languages</span>
              </label>
              <div className="flex gap-1.5">
                {['python', 'typescript', 'go', 'csharp'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setConvertTargetLang(lang)}
                    className={`flex-1 py-1 text-[10px] uppercase font-semibold rounded-lg border transition-colors cursor-pointer ${
                      convertTargetLang === lang
                        ? 'bg-amber-400/20 text-amber-400 border-amber-400/40'
                        : 'bg-ide-panel text-ide-text/50 border-ide-border hover:text-ide-text'
                    }`}
                  >
                    {lang === 'csharp' ? 'C#' : lang}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleCodingAction('convert', convertTargetLang)}
                className="w-full py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Convert to {convertTargetLang.toUpperCase()}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Generate Code Tool */}
            <div className="p-3 bg-ide-bg rounded-xl border border-ide-border space-y-2">
              <label className="text-[11px] font-semibold text-ide-text-bright flex items-center gap-1.5">
                <FileCode size={13} className="text-ide-accent" />
                <span>Generate New Code</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cache layer with Caffeine"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1.5 text-xs text-ide-text-bright outline-none focus:border-ide-accent placeholder-ide-text/30"
              />
              <button
                onClick={() => handleCodingAction('generate', 'java', generatePrompt)}
                className="w-full py-1.5 text-xs bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Generate Code
              </button>
            </div>
          </>
        )}
      </div>
    )}

        {/* ── MODE 3: SMART BUG DETECTOR ── */}
        {activeMode === 'bugs' && (
          <div className="space-y-3 slide-in">
            <div className="flex items-center justify-between p-3 bg-ide-bg rounded-xl border border-ide-border">
              <div>
                <h3 className="text-xs font-semibold text-ide-text-bright flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-ide-red" />
                  <span>Smart Bug Detector</span>
                </h3>
                <p className="text-[10px] text-ide-text/50">Security, performance & root-cause analysis</p>
              </div>
              <button
                onClick={handleRunBugScan}
                disabled={isScanningBugs}
                className="px-2.5 py-1.5 bg-ide-red hover:bg-ide-red/80 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {isScanningBugs ? <RefreshCw size={12} className="animate-spin" /> : <ShieldAlert size={12} />}
                <span>Scan Code</span>
              </button>
            </div>

            {isScanningBugs && (
              <div className="p-6 text-center space-y-2 text-xs text-ide-text/60">
                <RefreshCw size={18} className="animate-spin text-ide-red mx-auto" />
                <p>Auditing bytecode & AST for vulnerabilities...</p>
              </div>
            )}

            {bugScanResult && (
              <div className="space-y-3">
                {/* Health Score Card */}
                <div className="p-3 bg-ide-bg rounded-xl border border-ide-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-ide-text/50 uppercase font-semibold">Health Score</div>
                    <div className="text-lg font-bold text-ide-text-bright">{bugScanResult.healthScore} / 100</div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      bugScanResult.healthScore >= 80
                        ? 'bg-ide-green/20 text-ide-green'
                        : 'bg-ide-red/20 text-ide-red'
                    }`}
                  >
                    {bugScanResult.healthScore >= 80 ? 'Grade A' : 'Action Required'}
                  </div>
                </div>

                <p className="text-[11px] text-ide-text/70 leading-relaxed bg-ide-panel p-2.5 rounded-lg border border-ide-border/60">
                  {bugScanResult.summary}
                </p>

                {/* Security Issues */}
                {bugScanResult.securityIssues?.map((issue, idx) => (
                  <div key={idx} className="p-2.5 bg-ide-red/10 border border-ide-red/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ide-red flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>Line {issue.line}: {issue.title}</span>
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-ide-red/20 text-ide-red font-bold">
                        {issue.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-ide-text-bright block">Why this issue exists:</span>
                      <p className="text-[11px] text-ide-text/80 leading-relaxed mt-0.5">{issue.whyItExists}</p>
                    </div>
                    <div className="pt-1 border-t border-ide-red/20">
                      <span className="text-[10px] font-semibold text-ide-green block">Suggested Fix:</span>
                      <p className="text-[11px] text-ide-text/90 font-mono mt-0.5 bg-ide-bg/80 p-1.5 rounded">
                        {issue.suggestedFix}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Performance Issues */}
                {bugScanResult.performanceIssues?.map((perf, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-400 flex items-center gap-1">
                        <Zap size={12} />
                        <span>Line {perf.line}: {perf.title}</span>
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 font-bold">
                        {perf.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-ide-text-bright block">Why this issue exists:</span>
                      <p className="text-[11px] text-ide-text/80 leading-relaxed mt-0.5">{perf.whyItExists}</p>
                    </div>
                    <div className="pt-1 border-t border-amber-400/20">
                      <span className="text-[10px] font-semibold text-ide-green block">Optimized Fix:</span>
                      <p className="text-[11px] text-ide-text/90 font-mono mt-0.5 bg-ide-bg/80 p-1.5 rounded">
                        {perf.suggestedFix}
                      </p>
                    </div>
                  </div>
                ))}

                {bugScanResult.fixedCode && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bugScanResult.fixedCode)
                      useStore.getState().setActiveEditorTab('AppService')
                      alert('Hardened code copied to clipboard & switched to AppService.java!')
                    }}
                    className="w-full py-2 bg-ide-green hover:bg-ide-green/80 text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>Apply Hardened Fix to AppService.java</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MODE 4: DOCUMENTATION GENERATOR ── */}
        {activeMode === 'docs' && (
          <div className="space-y-3 slide-in">
            <div className="p-2.5 bg-ide-bg rounded-xl border border-ide-border space-y-1">
              <h3 className="text-xs font-semibold text-ide-text-bright flex items-center gap-1.5">
                <BookOpen size={13} className="text-ide-purple" />
                <span>Documentation Generator</span>
              </h3>
              <p className="text-[11px] text-ide-text/60">
                Automatically author production documentation and persist to project knowledge base.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleGenerateDoc('readme')}
                disabled={isGeneratingDoc}
                className="p-2.5 rounded-xl bg-ide-bg hover:bg-ide-purple/15 border border-ide-border hover:border-ide-purple/40 text-left transition-colors cursor-pointer flex flex-col gap-1 disabled:opacity-50"
              >
                <div className="font-semibold text-ide-text-bright">📘 README</div>
                <div className="text-[10px] text-ide-text/50">Badges, overview & quickstart</div>
              </button>

              <button
                onClick={() => handleGenerateDoc('api_docs')}
                disabled={isGeneratingDoc}
                className="p-2.5 rounded-xl bg-ide-bg hover:bg-ide-accent/15 border border-ide-border hover:border-ide-accent/40 text-left transition-colors cursor-pointer flex flex-col gap-1 disabled:opacity-50"
              >
                <div className="font-semibold text-ide-text-bright">📑 API Docs</div>
                <div className="text-[10px] text-ide-text/50">Endpoints, schemas & curls</div>
              </button>

              <button
                onClick={() => handleGenerateDoc('installation')}
                disabled={isGeneratingDoc}
                className="p-2.5 rounded-xl bg-ide-bg hover:bg-ide-green/15 border border-ide-border hover:border-ide-green/40 text-left transition-colors cursor-pointer flex flex-col gap-1 disabled:opacity-50"
              >
                <div className="font-semibold text-ide-text-bright">⚙️ Install Guide</div>
                <div className="text-[10px] text-ide-text/50">Prerequisites & local setup</div>
              </button>

              <button
                onClick={() => handleGenerateDoc('summary')}
                disabled={isGeneratingDoc}
                className="p-2.5 rounded-xl bg-ide-bg hover:bg-amber-400/15 border border-ide-border hover:border-amber-400/40 text-left transition-colors cursor-pointer flex flex-col gap-1 disabled:opacity-50"
              >
                <div className="font-semibold text-ide-text-bright">📊 Project Summary</div>
                <div className="text-[10px] text-ide-text/50">Architecture & milestones</div>
              </button>
            </div>

            {isGeneratingDoc && (
              <div className="p-6 text-center space-y-2 text-xs text-ide-text/60">
                <RefreshCw size={18} className="animate-spin text-ide-purple mx-auto" />
                <p>Synthesizing documentation with Gemini...</p>
              </div>
            )}

            {generatedDoc && (
              <div className="p-3 bg-ide-bg rounded-xl border border-ide-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ide-text-bright truncate">{generatedDoc.title}</span>
                  {docSaved && (
                    <span className="text-[10px] text-ide-green flex items-center gap-1 font-semibold">
                      <BookmarkCheck size={12} /> Saved in Docs
                    </span>
                  )}
                </div>
                <pre className="p-2.5 bg-ide-panel rounded-lg text-[11px] font-mono text-ide-text-bright/90 overflow-x-auto max-h-56 whitespace-pre-wrap leading-relaxed border border-ide-border/50">
                  {generatedDoc.content}
                </pre>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedDoc.content)
                      alert('Documentation copied to clipboard!')
                    }}
                    className="flex-1 py-1.5 bg-ide-panel hover:bg-ide-border text-ide-text rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Copy Markdown
                  </button>
                  <button
                    onClick={() => {
                      useStore.getState().setSidebarSection('docs')
                    }}
                    className="flex-1 py-1.5 bg-ide-purple hover:bg-ide-purple/80 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Open in Doc Panel →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE 5: GITHUB INTEGRATION ── */}
        {activeMode === 'github' && (
          <div className="space-y-3 slide-in text-xs">
            <div className="p-2.5 bg-ide-bg rounded-xl border border-ide-border space-y-1">
              <h3 className="text-xs font-semibold text-ide-text-bright flex items-center gap-1.5">
                <GitPullRequest size={13} className="text-emerald-400" />
                <span>GitHub Integration & Insights</span>
              </h3>
              <p className="text-[10px] text-ide-text/50">Pull requests, commit velocity, and AI code reviews.</p>
            </div>

            {/* Quick Review Actions */}
            <button
              onClick={handleReviewPR}
              className="w-full p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>Run AI Code Review on PR #452</span>
              </div>
              <ArrowRight size={13} />
            </button>

            {loadingInsights && (
              <div className="p-6 text-center space-y-2 text-xs text-ide-text/60">
                <RefreshCw size={18} className="animate-spin text-emerald-400 mx-auto" />
                <p>Querying GitHub REST API & insights metrics...</p>
              </div>
            )}

            {repoInsights && (
              <div className="space-y-2.5">
                <div className="p-3 bg-ide-bg rounded-xl border border-ide-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ide-text-bright">{repoInsights.fullName}</div>
                      <div className="text-[10px] text-ide-text/50">{repoInsights.description}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Score: {repoInsights.healthScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className="p-2 bg-ide-panel rounded-lg border border-ide-border/50">
                      <div className="text-[9px] text-ide-text/50 uppercase">Commits</div>
                      <div className="font-bold text-ide-text-bright">{repoInsights.stats.commitsCount}</div>
                    </div>
                    <div className="p-2 bg-ide-panel rounded-lg border border-ide-border/50">
                      <div className="text-[9px] text-ide-text/50 uppercase">Open PRs</div>
                      <div className="font-bold text-ide-text-bright">{repoInsights.stats.pullRequests.open}</div>
                    </div>
                    <div className="p-2 bg-ide-panel rounded-lg border border-ide-border/50">
                      <div className="text-[9px] text-ide-text/50 uppercase">Issues</div>
                      <div className="font-bold text-ide-text-bright">{repoInsights.stats.issues.open}</div>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1 text-[11px] text-ide-text/70">
                    <div className="flex justify-between">
                      <span>Default Branch:</span>
                      <strong className="text-ide-text-bright">{repoInsights.stats.defaultBranch}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Code Quality:</span>
                      <strong className="text-emerald-400">{repoInsights.codeQuality.maintainabilityIndex}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Status:</span>
                      <strong className="text-emerald-400">{repoInsights.codeQuality.securityStatus}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => useStore.getState().setActiveEditorTab('pr-452')}
                    className="flex-1 py-1.5 bg-ide-panel hover:bg-ide-border text-ide-text rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Inspect PR Diff
                  </button>
                  <a
                    href="https://github.com/karansinhpatil11/final-year-project"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Open GitHub</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bottom Bar (available when in Chat mode or general prompt) */}
      <div className="p-3 border-t border-ide-border shrink-0 bg-ide-bg/30">
        <div className="flex items-end gap-2 bg-ide-bg rounded-xl border border-ide-border focus-within:border-ide-accent/50 transition-colors px-3 py-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask about your code, bugs, or docs..."
            rows={1}
            className="flex-1 bg-transparent text-xs text-ide-text-bright placeholder-ide-text/40 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isAiTyping}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              chatInput.trim() && !isAiTyping
                ? 'bg-ide-accent hover:bg-ide-accent-hover text-white'
                : 'bg-ide-border text-ide-text/40 cursor-not-allowed'
            }`}
          >
            <Send size={13} />
          </button>
        </div>

        {/* Status bar with MCP and Model Selector */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${mcpConnected ? 'bg-ide-green' : 'bg-ide-red'}`} />
            <span className="text-[10px] text-ide-text/40">
              {mcpConnected ? 'MCP: GitHub Connected' : 'MCP: GitHub Connected'}
            </span>
          </div>
          <ModelSelector model={localModel} onChange={setLocalModel} />
        </div>
      </div>
    </div>
  )
}
