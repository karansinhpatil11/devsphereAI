import React, { useState, useRef, useEffect } from 'react'
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  CornerDownLeft,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react'
import { sendChatMessage } from '../services/api'
import useStore from '../store/useStore'

const INITIAL_OUTPUT = [
  {
    type: 'system',
    text: '─── DevStudio Integrated Terminal (bash v5.2) ───\nWorkspace: ~/core-service | Branch: feature/fix-data-fetch\nType "help" for commands or "ai <question>" to ask Gemini.',
  },
  {
    type: 'command',
    command: 'git status',
  },
  {
    type: 'output',
    text: `On branch feature/fix-data-fetch
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
\x1b[31m  modified:   src/main/java/com/company/service/AppService.java\x1b[0m

no changes added to commit (use "git add")`,
  },
]

export default function Terminal() {
  const { aiModel } = useStore()
  const [history, setHistory] = useState(INITIAL_OUTPUT)
  const [inputVal, setInputVal] = useState('')
  const [commandHistory, setCommandHistory] = useState(['git status'])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [copied, setCopied] = useState(false)
  const [isRunningAI, setIsRunningAI] = useState(false)

  // Track simulated working state
  const [gitStaged, setGitStaged] = useState(false)
  const [currentBranch, setCurrentBranch] = useState('feature/fix-data-fetch')

  const inputRef = useRef(null)
  const terminalEndRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const focusInput = () => {
    inputRef.current?.focus()
  }

  const handleCopy = () => {
    const fullText = history
      .map((item) => {
        if (item.type === 'command') return `user@dev:~/core-service$ ${item.command}`
        return item.text
      })
      .join('\n')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setHistory([])
  }

  const handleReset = () => {
    setHistory(INITIAL_OUTPUT)
    setGitStaged(false)
    setCurrentBranch('feature/fix-data-fetch')
  }

  const executeCommand = async (rawCmd) => {
    const cmd = rawCmd.trim()
    if (!cmd) return

    // Save to command history for Up/Down arrows
    setCommandHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)])
    setHistoryIdx(-1)

    // Append executed command to output
    const newItems = [{ type: 'command', command: cmd }]

    const lower = cmd.toLowerCase()
    const parts = cmd.split(' ')
    const main = parts[0].toLowerCase()

    if (main === 'clear' || main === 'cls') {
      setHistory([])
      return
    }

    if (main === 'help') {
      newItems.push({
        type: 'output',
        text: `Available Terminal Commands:
  • git status           - Check working tree & staged files
  • git diff             - Inspect differences in AppService.java
  • git branch           - List repository branches
  • git log              - View recent commits
  • git add <file>       - Stage modified files (e.g., git add .)
  • git commit -m "msg"  - Commit staged changes
  • git checkout <br>    - Switch branches (e.g., git checkout main)
  • ls [-la] / dir       - List files in current directory
  • cat <file>           - Display file content (AppService.java, pom.xml)
  • pwd                  - Print working directory
  • whoami               - Display current user
  • date                 - Display current date and time
  • mvn clean install    - Build and package Spring Boot microservice
  • mvn spring-boot:run  - Launch application server on port 8080
  • npm test / npm run   - Run frontend scripts
  • ai <prompt>          - Ask Gemini AI directly from the CLI
  • clear                - Clear the terminal screen`,
      })
    } else if (main === 'ai' || main === 'gemini' || main === 'ask') {
      const prompt = parts.slice(1).join(' ')
      if (!prompt) {
        newItems.push({
          type: 'error',
          text: 'Usage: ai <your question or prompt here>\nExample: ai How does Optional handle null values in Java 17?',
        })
      } else {
        newItems.push({
          type: 'system',
          text: `[Gemini 3.8 Flash] Thinking and analyzing "${prompt}"...`,
        })
        setHistory((prev) => [...prev, ...newItems])
        setInputVal('')
        setIsRunningAI(true)

        try {
          const res = await sendChatMessage(prompt, [], aiModel || 'gemini-3.8-flash')
          const aiResponse = res.data.content || res.data.message || 'No response returned from AI service.'
          setHistory((prev) => [
            ...prev,
            {
              type: 'ai',
              text: `[Gemini AI Response]:\n${aiResponse}`,
            },
          ])
        } catch (err) {
          setHistory((prev) => [
            ...prev,
            {
              type: 'error',
              text: `AI Request Failed: ${err.response?.data?.error || err.message}`,
            },
          ])
        } finally {
          setIsRunningAI(false)
        }
        return
      }
    } else if (main === 'git') {
      const sub = parts[1]?.toLowerCase()
      if (!sub || sub === 'status') {
        if (!gitStaged) {
          newItems.push({
            type: 'output',
            text: `On branch ${currentBranch}
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
\x1b[31m  modified:   src/main/java/com/company/service/AppService.java\x1b[0m

no changes added to commit (use "git add")`,
          })
        } else {
          newItems.push({
            type: 'output',
            text: `On branch ${currentBranch}
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
\x1b[32m  modified:   src/main/java/com/company/service/AppService.java\x1b[0m`,
          })
        }
      } else if (sub === 'diff') {
        newItems.push({
          type: 'diff',
          text: `diff --git a/src/main/java/com/company/service/AppService.java b/src/main/java/com/company/service/AppService.java
index 4b921a..8f219c 100644
--- a/src/main/java/com/company/service/AppService.java
+++ b/src/main/java/com/company/service/AppService.java
@@ -10,6 +10,13 @@ public class AppService {
-    public Data getData() {
-        return repository.fetchData();
-    }
+    public Optional<Data> getData() {
+        try {
+            Data data = repository.fetchData();
+            return Optional.ofNullable(data);
+        } catch (Exception ex) {
+            logger.error("Failed to fetch data: {}", ex.getMessage());
+            return Optional.empty();
+        }
+    }`,
        })
      } else if (sub === 'branch') {
        newItems.push({
          type: 'output',
          text: `* \x1b[32m${currentBranch}\x1b[0m\n  main\n  develop\n  bugfix/session-store`,
        })
      } else if (sub === 'checkout') {
        const target = parts[2]
        if (!target) {
          newItems.push({ type: 'error', text: 'fatal: you must specify a branch to checkout.' })
        } else {
          setCurrentBranch(target)
          newItems.push({ type: 'output', text: `Switched to branch '${target}'` })
        }
      } else if (sub === 'add') {
        setGitStaged(true)
        newItems.push({
          type: 'output',
          text: `staged changes in working tree for ${parts[2] || '.'}`,
        })
      } else if (sub === 'commit') {
        if (!gitStaged) {
          newItems.push({
            type: 'error',
            text: 'no changes added to commit (use "git add")',
          })
        } else {
          const msg = parts.slice(parts.indexOf('-m') + 1).join(' ') || 'Update AppService implementation'
          setGitStaged(false)
          newItems.push({
            type: 'output',
            text: `[${currentBranch} a48f12d] ${msg.replace(/['"]/g, '')}\n 1 file changed, 8 insertions(+), 3 deletions(-)`,
          })
        }
      } else if (sub === 'log') {
        newItems.push({
          type: 'output',
          text: `commit 452a8b9 (HEAD -> ${currentBranch})
Author: DevUser <dev@example.com>
Date:   Mon Oct 12 18:30:00 2026 +0530

    Fix data fetch issues and improve error handling in AppService

commit e3f91c2 (origin/main, main)
Author: Karansinh Patil <karansinhpatil11@github.com>
Date:   Fri Oct 09 14:12:00 2026 +0530

    Initial service scaffold with Spring Boot 3.2 and Gemini Assistant`,
        })
      } else {
        newItems.push({
          type: 'output',
          text: `git: '${sub}' is executed. (Simulated Git environment linked to active repository)`,
        })
      }
    } else if (main === 'ls' || main === 'dir') {
      newItems.push({
        type: 'output',
        text: `pom.xml   README.md   application.yml   src/   target/`,
      })
    } else if (main === 'pwd') {
      newItems.push({
        type: 'output',
        text: '/home/user/core-service',
      })
    } else if (main === 'whoami') {
      newItems.push({
        type: 'output',
        text: 'user@dev',
      })
    } else if (main === 'date') {
      newItems.push({
        type: 'output',
        text: new Date().toString(),
      })
    } else if (main === 'echo') {
      newItems.push({
        type: 'output',
        text: parts.slice(1).join(' ').replace(/['"]/g, ''),
      })
    } else if (main === 'cat') {
      const fileName = parts[1]?.toLowerCase()
      if (!fileName) {
        newItems.push({ type: 'error', text: 'cat: missing file operand' })
      } else if (fileName.includes('pom')) {
        newItems.push({
          type: 'output',
          text: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.company</groupId>
  <artifactId>core-service</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.0</spring-boot.version>
  </properties>
</project>`,
        })
      } else if (fileName.includes('service') || fileName.includes('appservice')) {
        newItems.push({
          type: 'output',
          text: `package com.company.service;

@Service
public class AppService {
    public Optional<Data> getData() {
        return Optional.ofNullable(repository.fetchData());
    }
}`,
        })
      } else {
        newItems.push({
          type: 'output',
          text: `// Content of ${parts[1]}\n# Project documentation and module configuration.`,
        })
      }
    } else if (cmd.startsWith('mvn')) {
      newItems.push({
        type: 'system',
        text: `[INFO] Scanning for projects...
[INFO] --------------------< com.company:core-service >--------------------
[INFO] Building core-service 1.0.0-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] --- maven-compiler-plugin:3.11.0:compile (default-compile) @ core-service ---
[INFO] Compiling 2 source files with javac [Java 17] to target/classes
[INFO]
  .   ____          _            __ _ _
 /\\\\ / ___'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\
( ( )\\___ | '_ | '_| | '_ \\/ _\` | \\ \\ \\ \\
 \\\\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

2026-10-13 14:55:01.214  INFO 24102 --- [main] Tomcat initialized with port: 8080 (http)
2026-10-13 14:55:01.892  INFO 24102 --- [main] Started CoreServiceApplication in 1.482 seconds (process running)
\x1b[32m[INFO] BUILD SUCCESS\x1b[0m`,
      })
    } else if (cmd.startsWith('npm')) {
      newItems.push({
        type: 'system',
        text: `> ai-developer-assistant@1.0.0 ${parts.slice(1).join(' ') || 'test'}
✓ All test suites passed (14 tests passed in 2.14s)
\x1b[32m✨ Done in 2.31s\x1b[0m`,
      })
    } else {
      newItems.push({
        type: 'error',
        text: `bash: command not found: ${cmd}\nType "help" to see available commands or "ai <question>" to ask Gemini.`,
      })
    }

    setHistory((prev) => [...prev, ...newItems])
    setInputVal('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(inputVal)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length === 0) return
      const nextIdx = Math.min(historyIdx + 1, commandHistory.length - 1)
      setHistoryIdx(nextIdx)
      setInputVal(commandHistory[nextIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1
        setHistoryIdx(nextIdx)
        setInputVal(commandHistory[nextIdx])
      } else if (historyIdx === 0) {
        setHistoryIdx(-1)
        setInputVal('')
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      // Ctrl+C
      setHistory((prev) => [
        ...prev,
        { type: 'command', command: `${inputVal}^C` },
      ])
      setInputVal('')
    } else if (e.key === 'l' && e.ctrlKey) {
      // Ctrl+L
      e.preventDefault()
      setHistory([])
    }
  }

  const renderItemText = (text) => {
    // Replace simple ANSI color codes
    const parts = text.split(/(\x1b\[31m|\x1b\[32m|\x1b\[0m)/g)
    let currentColor = ''
    return parts.map((chunk, i) => {
      if (chunk === '\x1b[31m') {
        currentColor = 'text-ide-red'
        return null
      }
      if (chunk === '\x1b[32m') {
        currentColor = 'text-ide-green'
        return null
      }
      if (chunk === '\x1b[0m') {
        currentColor = ''
        return null
      }
      return (
        <span key={i} className={currentColor}>
          {chunk}
        </span>
      )
    })
  }

  const QUICK_COMMANDS = [
    'git status',
    'git diff',
    'git log',
    'mvn spring-boot:run',
    'ai explain PR #452 changes',
    'clear',
  ]

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="flex flex-col h-full bg-[#0a0f1d] font-mono text-xs overflow-hidden select-text border-t border-ide-border"
    >
      {/* Terminal Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-sidebar/90 border-b border-ide-border text-ide-text select-none shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={13} className="text-ide-accent" />
          <span className="font-semibold text-ide-text-bright text-[11px]">Integrated Terminal</span>
          <span className="text-[10px] text-ide-text/40 hidden sm:inline">bash (core-service)</span>
        </div>

        {/* Quick Command Buttons */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto text-[10px]">
          {QUICK_COMMANDS.map((qc) => (
            <button
              key={qc}
              onClick={(e) => {
                e.stopPropagation()
                executeCommand(qc)
              }}
              className="px-2 py-0.5 rounded bg-ide-panel hover:bg-ide-border text-ide-text hover:text-ide-accent transition-colors cursor-pointer border border-ide-border/60"
            >
              {qc}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            title="Copy Terminal Output"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-ide-green" /> : <Copy size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            title="Clear Terminal (Ctrl+L)"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReset()
            }}
            title="Reset Terminal Session"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Terminal History Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 leading-relaxed text-ide-text">
        {history.map((item, idx) => {
          if (item.type === 'system') {
            return (
              <div key={idx} className="text-ide-text/50 whitespace-pre-wrap pb-1 border-b border-ide-border/30">
                {item.text}
              </div>
            )
          }
          if (item.type === 'command') {
            return (
              <div key={idx} className="flex items-center gap-1.5 text-ide-text-bright font-medium">
                <span className="text-ide-accent select-none">user@dev</span>
                <span className="text-ide-text/40 select-none">:</span>
                <span className="text-ide-blue select-none">~/core-service</span>
                <span className="text-ide-text/50 select-none">$</span>
                <span className="text-emerald-400">{item.command}</span>
              </div>
            )
          }
          if (item.type === 'ai') {
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-ide-accent/10 border border-ide-accent/30 text-ide-text-bright whitespace-pre-wrap my-1 shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-ide-accent font-semibold mb-1 text-[11px]">
                  <Sparkles size={12} />
                  <span>Gemini AI CLI Assistant</span>
                </div>
                <div className="text-xs leading-relaxed">{item.text}</div>
              </div>
            )
          }
          if (item.type === 'error') {
            return (
              <div key={idx} className="text-ide-red whitespace-pre-wrap pl-1">
                {item.text}
              </div>
            )
          }
          if (item.type === 'diff') {
            return (
              <div key={idx} className="whitespace-pre-wrap font-mono text-[11px] bg-ide-bg/80 p-2 rounded border border-ide-border/50">
                {item.text.split('\n').map((line, lineIdx) => {
                  let lineClass = 'text-ide-text/80'
                  if (line.startsWith('+') && !line.startsWith('+++')) lineClass = 'text-ide-green bg-ide-green/10'
                  else if (line.startsWith('-') && !line.startsWith('---')) lineClass = 'text-ide-red bg-ide-red/10'
                  else if (line.startsWith('@@')) lineClass = 'text-ide-purple'
                  return (
                    <div key={lineIdx} className={lineClass}>
                      {line}
                    </div>
                  )
                })}
              </div>
            )
          }
          return (
            <div key={idx} className="text-ide-text whitespace-pre-wrap pl-1">
              {renderItemText(item.text)}
            </div>
          )
        })}

        {/* Current Active Command Input Line */}
        <div className="flex items-center gap-1.5 pt-1 text-ide-text-bright">
          <span className="text-ide-accent shrink-0 select-none">user@dev</span>
          <span className="text-ide-text/40 select-none">:</span>
          <span className="text-ide-blue shrink-0 select-none">~/core-service</span>
          <span className="text-ide-text/50 select-none">$</span>
          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunningAI}
              className="w-full bg-transparent border-none outline-none text-emerald-400 font-mono text-xs caret-emerald-400 p-0 m-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {isRunningAI && (
          <div className="flex items-center gap-2 text-ide-accent text-[11px] animate-pulse pl-1">
            <Sparkles size={11} className="animate-spin" />
            <span>AI generating response...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info Bar */}
      <div className="px-3 py-1 bg-ide-bg/80 border-t border-ide-border/50 flex items-center justify-between text-[10px] text-ide-text/40 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span>Git: <strong className="text-ide-text/70">{currentBranch}</strong></span>
          <span>Status: <strong className={gitStaged ? 'text-ide-green' : 'text-amber-400'}>{gitStaged ? 'Changes staged' : 'Unstaged changes'}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>Shortcuts: <kbd className="px-1 py-0.2 bg-ide-panel rounded border border-ide-border">Enter</kbd> run, <kbd className="px-1 py-0.2 bg-ide-panel rounded border border-ide-border">↑/↓</kbd> history</span>
        </div>
      </div>
    </div>
  )
}
