import React, { useState } from 'react'
import useStore from '../store/useStore'
import {
  ArrowLeft, GitMerge, RotateCcw, FileCode, Check, Copy,
  ExternalLink, ChevronDown, Split, Columns, Code2
} from 'lucide-react'
import { REPO_FILES } from './CodeEditor'

// Diff data for AppController.java
const appControllerDiffLines = [
  { num: 1, type: 'neutral', old: 'public class AppController {', new: 'public class AppController {' },
  { num: 2, type: 'neutral', old: '', new: '' },
  { num: 3, type: 'neutral', old: '  @GetMapping("/data")', new: '  @GetMapping("/data")' },
  { num: 4, type: 'remove', old: '  public class getData() {', new: '  public AppService.getData() {' },
  { num: 5, type: 'neutral', old: '    return service.getData();', new: '    return service.getData();' },
  { num: 6, type: 'neutral', old: '  }', new: '  }' },
  { num: 7, type: 'neutral', old: '', new: '' },
  { num: 8, type: 'neutral', old: '  @GetMapping("/data")', new: '  @GetMapping("/data")' },
  { num: 9, type: 'remove', old: '    return service.getData();', new: '    return service.getData();' },
  { num: 10, type: 'neutral', old: '  }', new: '  }' },
  { num: 11, type: 'add', old: null, new: '  // New data structure' },
  { num: 12, type: 'add', old: null, new: '  public Optional<Data> getData() {' },
  { num: 13, type: 'add', old: null, new: '    return Optional.ofNullable(rep' },
  { num: 14, type: 'neutral', old: '}', new: '}' },
]

// Diff data for AppService.java
const appServiceDiffLines = [
  { num: 1, type: 'neutral', old: 'package com.company.service;', new: 'package com.company.service;' },
  { num: 2, type: 'neutral', old: '', new: '' },
  { num: 3, type: 'neutral', old: 'import org.springframework.stereotype.Service;', new: 'import org.springframework.stereotype.Service;' },
  { num: 4, type: 'neutral', old: 'import org.slf4j.Logger;', new: 'import org.slf4j.Logger;' },
  { num: 5, type: 'neutral', old: 'import org.slf4j.LoggerFactory;', new: 'import org.slf4j.LoggerFactory;' },
  { num: 6, type: 'add', old: null, new: 'import java.util.Optional;' },
  { num: 7, type: 'neutral', old: '', new: '' },
  { num: 8, type: 'neutral', old: '@Service', new: '@Service' },
  { num: 9, type: 'neutral', old: 'public class AppService {', new: 'public class AppService {' },
  { num: 10, type: 'neutral', old: '    private final DataRepository repository;', new: '    private final DataRepository repository;' },
  { num: 11, type: 'neutral', old: '', new: '' },
  { num: 12, type: 'remove', old: '    public Data getData() {', new: '    public Optional<Data> getData() {' },
  { num: 13, type: 'remove', old: '        return repository.fetchData();', new: '        try {' },
  { num: 14, type: 'add', old: null, new: '            Data data = repository.fetchData();' },
  { num: 15, type: 'add', old: null, new: '            return Optional.ofNullable(data);' },
  { num: 16, type: 'add', old: null, new: '        } catch (Exception ex) {' },
  { num: 17, type: 'add', old: null, new: '            logger.error("Failed to fetch data: {}", ex.getMessage());' },
  { num: 18, type: 'add', old: null, new: '            return Optional.empty();' },
  { num: 19, type: 'add', old: null, new: '        }' },
  { num: 20, type: 'neutral', old: '    }', new: '    }' },
  { num: 21, type: 'neutral', old: '}', new: '}' },
]

// Baseline original code before PR changes
const ORIGINAL_FILES = {
  'AppController.java': `package com.company.service;

import org.springframework.web.bind.annotation.*;

@RestController
public class AppController {

    private final AppService service;

    public AppController(AppService service) {
        this.service = service;
    }

    @GetMapping("/data")
    public class getData() {
        return service.getData();
    }

    @GetMapping("/data")
    public String getRawData() {
        return service.getData();
    }
}`,

  'AppService.java': `package com.company.service;

import org.springframework.stereotype.Service;

@Service
public class AppService {

    private final DataRepository repository;

    public AppService(DataRepository repository) {
        this.repository = repository;
    }

    public Data getData() {
        return repository.fetchData();
    }
}`,
}

function DiffLine({ lineNum, content, type }) {
  const bg =
    type === 'add' ? 'bg-diff-add' :
    type === 'remove' ? 'bg-diff-remove' : ''
  const textColor =
    type === 'add' ? 'text-ide-green font-medium' :
    type === 'remove' ? 'text-ide-red font-medium' : 'text-ide-text'
  const prefix =
    type === 'add' ? '+ ' :
    type === 'remove' ? '- ' : '  '

  return (
    <div className={`flex items-start group ${bg}`}>
      <span className="w-10 shrink-0 text-right pr-3 py-0.5 text-xs text-ide-text/40 select-none border-r border-ide-border">
        {lineNum}
      </span>
      <pre className={`flex-1 px-3 py-0.5 text-xs font-mono ${textColor} whitespace-pre-wrap break-all leading-5`}>
        {prefix}{content}
      </pre>
    </div>
  )
}

export default function DiffViewer() {
  const { currentPR, setActiveEditorTab, selectedDiffFile, setSelectedDiffFile, openTabs } = useStore()
  const [viewMode, setViewMode] = useState('paired') // 'paired' | 'unified' | 'fileCode' | 'originalCode'
  const [resetKey, setResetKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showFileDropdown, setShowFileDropdown] = useState(false)

  // Determine active file being reviewed
  const activeFileName = selectedDiffFile || 'AppController.java'
  const diffLines = activeFileName === 'AppService.java' ? appServiceDiffLines : appControllerDiffLines

  // Split into old/new columns
  const oldLines = diffLines.filter((l) => l.type !== 'add')
  const newLines = diffLines.filter((l) => l.type !== 'remove')

  // Full file code for selected repo file
  const fileData = REPO_FILES[activeFileName] || REPO_FILES['AppController.java']
  const fullCode = fileData?.content || ''
  const originalCode = ORIGINAL_FILES[activeFileName] || fullCode
  const displayCode = viewMode === 'originalCode' ? originalCode : fullCode
  const codeLines = displayCode.split('\n')

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInEditor = () => {
    const tabId = activeFileName.replace(/\.[^/.]+$/, '')
    const exists = openTabs.some((t) => t.id === tabId)
    if (!exists) {
      useStore.setState({
        openTabs: [...openTabs, { id: tabId, name: activeFileName, icon: '📄', closable: true }],
      })
    }
    setActiveEditorTab(tabId)
  }

  const allRepoFileNames = Object.keys(REPO_FILES)

  return (
    <div key={resetKey} className="flex flex-col h-full overflow-hidden bg-ide-bg">
      {/* ── PR Main Header ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-ide-border shrink-0 bg-ide-bg/90">
        <button
          onClick={handleOpenInEditor}
          title="Back to file editor"
          className="text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer p-0.5 rounded hover:bg-ide-border"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GitMerge size={15} className="text-ide-purple shrink-0" />
          <h2 className="text-sm font-semibold text-ide-text-bright truncate">
            <span className="text-ide-blue">PR #{currentPR.number}:</span>{' '}
            {currentPR.title}
          </h2>
        </div>
        <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-ide-green/20 text-ide-green rounded-full border border-ide-green/40">
          ● Open
        </span>
      </div>

      {/* ── GitHub Diff / File Selection Toolbar ─────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-ide-border bg-ide-sidebar shrink-0 text-xs">
        {/* Left: GitHub Diff Icon & File Switcher */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-ide-text/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] text-ide-text-bright font-bold">G</span>
          </div>
          <span className="text-xs text-ide-text font-medium mr-1">GitHub diff</span>

          {/* PR Files Switcher Pills */}
          <div className="flex items-center gap-1 bg-ide-panel/80 p-0.5 rounded-lg border border-ide-border">
            <button
              onClick={() => setSelectedDiffFile('AppController.java')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFileName === 'AppController.java'
                  ? 'bg-ide-accent/25 text-ide-accent border border-ide-accent/40 shadow-sm'
                  : 'text-ide-text hover:text-ide-text-bright'
              }`}
            >
              <span>AppController.java</span>
              <span className="text-[9px] text-ide-green font-mono">+3</span>
              <span className="text-[9px] text-ide-red font-mono">-2</span>
            </button>

            <button
              onClick={() => setSelectedDiffFile('AppService.java')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                activeFileName === 'AppService.java'
                  ? 'bg-ide-accent/25 text-ide-accent border border-ide-accent/40 shadow-sm'
                  : 'text-ide-text hover:text-ide-text-bright'
              }`}
            >
              <span>AppService.java</span>
              <span className="text-[9px] text-ide-green font-mono">+12</span>
              <span className="text-[9px] text-ide-red font-mono">-4</span>
            </button>

            {/* Dropdown for other repo files */}
            <div className="relative">
              <button
                onClick={() => setShowFileDropdown(!showFileDropdown)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-ide-text/60 hover:text-ide-text-bright hover:bg-ide-border transition-colors cursor-pointer"
                title="Select another repo file"
              >
                <span>More</span>
                <ChevronDown size={11} />
              </button>

              {showFileDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-ide-panel border border-ide-border rounded-lg shadow-xl z-50 p-1 text-xs">
                  <div className="px-2 py-1 text-[10px] text-ide-text/40 font-semibold uppercase">
                    All Repo Files
                  </div>
                  {allRepoFileNames.map((fn) => (
                    <button
                      key={fn}
                      onClick={() => {
                        setSelectedDiffFile(fn)
                        setViewMode('fileCode')
                        setShowFileDropdown(false)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                        activeFileName === fn ? 'bg-ide-accent/20 text-ide-accent' : 'text-ide-text hover:bg-ide-border'
                      }`}
                    >
                      <FileCode size={11} className="shrink-0" />
                      <span className="truncate">{fn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: View Mode Toggle (Diff vs Full File Code) */}
        <div className="flex items-center gap-1.5">
          {/* Paired (Split) */}
          <button
            onClick={() => setViewMode('paired')}
            title="Split side-by-side diff"
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              viewMode === 'paired'
                ? 'bg-ide-accent/20 border-ide-accent/50 text-ide-accent font-semibold shadow-sm'
                : 'bg-ide-bg border-ide-border text-ide-text hover:text-ide-text-bright'
            }`}
          >
            <Columns size={12} />
            <span>Paired (Split)</span>
          </button>

          {/* Unified Diff */}
          <button
            onClick={() => setViewMode('unified')}
            title="Unified single-column diff"
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              viewMode === 'unified'
                ? 'bg-ide-accent/20 border-ide-accent/50 text-ide-accent font-semibold shadow-sm'
                : 'bg-ide-bg border-ide-border text-ide-text hover:text-ide-text-bright'
            }`}
          >
            <Split size={12} />
            <span>Unified</span>
          </button>

          {/* Selected File Code Toggle */}
          <button
            onClick={() => setViewMode('fileCode')}
            title="Display complete code of selected repo file"
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              viewMode === 'fileCode'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold shadow-sm'
                : 'bg-ide-bg border-ide-border text-ide-text hover:text-ide-text-bright hover:border-emerald-500/40'
            }`}
          >
            <Code2 size={12} className="text-emerald-400" />
            <span>Code of File</span>
          </button>

          {/* Original Baseline Code */}
          <button
            onClick={() => setViewMode('originalCode')}
            title="Display original baseline code before PR"
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
              viewMode === 'originalCode'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-semibold shadow-sm'
                : 'bg-ide-bg border-ide-border text-ide-text/70 hover:text-ide-text-bright'
            }`}
          >
            <span>Original</span>
          </button>

          {/* Open in Full Editor */}
          <button
            onClick={handleOpenInEditor}
            title="Open in Code Editor tab"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer ml-1"
          >
            <ExternalLink size={13} />
          </button>

          {/* Reset Scroll */}
          <button
            onClick={() => setResetKey((k) => k + 1)}
            title="Reset Diff View"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── Main Display Section ─────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {/* MODE 1: Full Selected Repo File Code View */}
        {(viewMode === 'fileCode' || viewMode === 'originalCode') && (
          <div className="flex flex-col h-full bg-[#0b1021]">
            {/* File Info Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-ide-sidebar/90 border-b border-ide-border shrink-0 text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCode size={13} className="text-emerald-400 shrink-0" />
                <span className="text-ide-text-bright font-semibold">{activeFileName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {viewMode === 'originalCode' ? 'Original Base Code' : 'Current PR Head Code'}
                </span>
                <span className="text-[10px] text-ide-text/40">({codeLines.length} lines)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('paired')}
                  className="px-2 py-0.5 rounded bg-ide-accent/15 text-ide-accent hover:bg-ide-accent/25 border border-ide-accent/30 text-[11px] cursor-pointer"
                >
                  View Diff
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright text-[11px] cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-ide-green" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Body with Gutter */}
            <div className="flex-1 flex overflow-auto font-mono text-xs">
              <div className="w-12 py-3 bg-[#080d1c] select-none border-r border-ide-border/50 text-right pr-3 text-ide-text/30 overflow-hidden shrink-0">
                {codeLines.map((_, idx) => (
                  <div key={idx} className="leading-6 h-6">
                    {idx + 1}
                  </div>
                ))}
              </div>
              <pre className="flex-1 p-3 text-ide-text-bright leading-6 overflow-auto font-mono text-xs selection:bg-ide-accent/30">
                {displayCode}
              </pre>
            </div>
          </div>
        )}

        {/* MODE 2: Unified Diff */}
        {viewMode === 'unified' && (
          <div className="min-w-full">
            <div className="flex items-center justify-between px-4 py-1.5 bg-ide-sidebar/80 border-b border-ide-border sticky top-0 text-xs font-mono">
              <span className="text-ide-text-bright">{activeFileName}</span>
              <button
                onClick={() => setViewMode('fileCode')}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                View Full Code of {activeFileName} →
              </button>
            </div>
            {diffLines.map((line, i) => (
              <DiffLine
                key={i}
                lineNum={i + 1}
                content={line.type === 'remove' ? line.old : line.new}
                type={line.type}
              />
            ))}
          </div>
        )}

        {/* MODE 3: Paired Split Diff (Default) */}
        {viewMode === 'paired' && (
          <div className="flex min-h-full">
            {/* OLD / Base Column (Left) */}
            <div className="flex-1 border-r border-ide-border overflow-x-auto">
              <div className="flex items-center justify-between px-3 py-1 bg-ide-sidebar/80 border-b border-ide-border sticky top-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ide-text/50 font-mono">1</span>
                  <span className="text-xs text-ide-text font-mono truncate">
                    {activeFileName === 'AppService.java'
                      ? 'public class AppService {'
                      : 'public class AppController {'}
                  </span>
                </div>
                <span className="text-[10px] text-ide-text/40 uppercase font-mono">Original</span>
              </div>
              {oldLines.map((line, i) => (
                <DiffLine
                  key={i}
                  lineNum={i + 1}
                  content={line.old}
                  type={line.type}
                />
              ))}
            </div>

            {/* NEW / PR Head Column (Right) */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center justify-between px-3 py-1 bg-ide-sidebar/80 border-b border-ide-border sticky top-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ide-text/50 font-mono">1</span>
                  <span className="text-xs text-ide-text font-mono truncate">
                    {activeFileName === 'AppService.java'
                      ? 'public class AppService {'
                      : 'public class AppController {'}
                  </span>
                </div>
                <button
                  onClick={() => setViewMode('fileCode')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
                  title="View complete code of this file"
                >
                  <Code2 size={10} />
                  <span>Full Code</span>
                </button>
              </div>
              {newLines.map((line, i) => (
                <DiffLine
                  key={i}
                  lineNum={i + 1}
                  content={line.new}
                  type={line.type}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
