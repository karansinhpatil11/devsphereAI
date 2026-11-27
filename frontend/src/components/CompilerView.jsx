import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Terminal as TerminalIcon,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCode,
  CornerDownLeft,
  ChevronDown,
  Code2,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { compilerAPI } from '../services/api'
import useStore from '../store/useStore'

const LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js v25',
    ext: 'js',
    icon: 'JS',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    templates: {
      default: `// DevSphere AI JavaScript Sandbox (Node.js)
function solve() {
  console.log("⚡ DevSphere AI Compiler: JavaScript Runtime");
  const data = [12, 45, 68, 23, 89, 34];
  const total = data.reduce((sum, n) => sum + n, 0);
  const max = Math.max(...data);

  console.log("Input Array:", data);
  console.log("Computed Total Sum:", total);
  console.log("Maximum Value:", max);
}

solve();`,
      twoSum: `// Two Sum Problem in JavaScript
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

const nums = [2, 7, 11, 15];
const target = 9;
console.log("Target:", target);
console.log("Indices matching target:", twoSum(nums, target));`,
      fibonacci: `// Fibonacci Sequence Generator
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, n);
}

console.log("First 12 Fibonacci numbers:");
console.log(fibonacci(12).join(" -> "));`,
    },
  },
  {
    id: 'python',
    name: 'Python 3',
    version: 'Python 3.11',
    ext: 'py',
    icon: 'PY',
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    templates: {
      default: `# DevSphere AI Python 3 Sandbox
def main():
    print("⚡ DevSphere AI Compiler: Python 3")
    elements = ["FastAPI", "TensorFlow", "PyTorch", "NumPy", "Gemini 3.8"]
    print("Frameworks & AI Libraries:")
    for i, item in enumerate(elements, start=1):
        print(f"  [{i}] {item}")

    squares = {x: x**2 for x in range(1, 6)}
    print("Squares dictionary:", squares)

if __name__ == "__main__":
    main()`,
      twoSum: `# Two Sum in Python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

nums = [3, 2, 4]
target = 6
print(f"Two sum result for target {target}:", two_sum(nums, target))`,
      fibonacci: `# Fibonacci Generator in Python
def fib(n):
    a, b = 0, 1
    res = []
    for _ in range(n):
        res.append(a)
        a, b = b, a + b
    return res

print("Fibonacci sequence:", fib(10))`,
    },
  },
  {
    id: 'java',
    name: 'Java',
    version: 'OpenJDK 17',
    ext: 'java',
    icon: '☕',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    templates: {
      default: `// DevSphere AI Java 17 Compiler
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("⚡ DevSphere AI Java Compiler Active");
        List<String> list = Arrays.asList("Spring Boot 3.2", "Google Gemini Flash", "DevSphere IDE");
        
        System.out.println("Microservice Dependencies:");
        for (int i = 0; i < list.size(); i++) {
            System.out.printf("  (%d) %s%n", i + 1, list.get(i));
        }

        int[] scores = {98, 85, 92, 100, 78};
        int max = Arrays.stream(scores).max().orElse(0);
        System.out.println("Highest test score: " + max);
    }
}`,
      twoSum: `// Two Sum in Java
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                return new int[]{map.get(comp), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] res = twoSum(nums, target);
        System.out.println("Indices: " + Arrays.toString(res));
    }
}`,
      fibonacci: `// Fibonacci in Java
public class Main {
    public static void main(String[] args) {
        int n = 10;
        long a = 0, b = 1;
        System.out.println("First " + n + " Fibonacci numbers:");
        for (int i = 0; i < n; i++) {
            System.out.print(a + " ");
            long temp = a + b;
            a = b;
            b = temp;
        }
        System.out.println();
    }
}`,
    },
  },
  {
    id: 'cpp',
    name: 'C++',
    version: 'GCC 11 (C++17)',
    ext: 'cpp',
    icon: 'C++',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    templates: {
      default: `// DevSphere AI C++ Compiler (C++17)
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

int main() {
    std::cout << "⚡ DevSphere AI C++ Compiler (GCC 11)" << std::endl;
    std::vector<int> numbers = {14, 28, 5, 42, 99, 63};

    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    int maxVal = *std::max_element(numbers.begin(), numbers.end());

    std::cout << "Total elements: " << numbers.size() << std::endl;
    std::cout << "Accumulated sum: " << sum << std::endl;
    std::cout << "Peak element: " << maxVal << std::endl;
    return 0;
}`,
      twoSum: `// Two Sum in C++
#include <iostream>
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); ++i) {
        int comp = target - nums[i];
        if (map.count(comp)) {
            return {map[comp], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    auto res = twoSum(nums, target);
    if (!res.empty()) {
        std::cout << "Indices: [" << res[0] << ", " << res[1] << "]" << std::endl;
    }
    return 0;
}`,
      fibonacci: `// Fibonacci in C++
#include <iostream>
#include <vector>

int main() {
    int n = 12;
    std::vector<long long> fib(n);
    fib[0] = 0;
    fib[1] = 1;
    for (int i = 2; i < n; ++i) {
        fib[i] = fib[i - 1] + fib[i - 2];
    }

    std::cout << "Fibonacci sequence: ";
    for (auto val : fib) std::cout << val << " ";
    std::cout << std::endl;
    return 0;
}`,
    },
  },
  {
    id: 'c',
    name: 'C',
    version: 'GCC 11 (C11)',
    ext: 'c',
    icon: 'C',
    color: 'text-slate-300 bg-slate-300/10 border-slate-300/30',
    templates: {
      default: `// DevSphere AI C Compiler (C11)
#include <stdio.h>

int main() {
    printf("⚡ DevSphere AI C Compiler\\n");
    int arr[] = {10, 20, 30, 40, 50};
    int n = sizeof(arr) / sizeof(arr[0]);
    int sum = 0;

    for (int i = 0; i < n; i++) {
        sum += arr[i];
    }

    printf("Array elements count: %d\\n", n);
    printf("Computed sum: %d\\n", sum);
    return 0;
}`,
      twoSum: `// Linear search in C
#include <stdio.h>

int main() {
    int target = 42;
    int data[] = {10, 25, 42, 88, 99};
    int n = 5;

    for (int i = 0; i < n; i++) {
        if (data[i] == target) {
            printf("Found target %d at index %d\\n", target, i);
            return 0;
        }
    }
    printf("Target not found\\n");
    return 0;
}`,
      fibonacci: `// Fibonacci in C
#include <stdio.h>

int main() {
    int n = 10;
    long long t1 = 0, t2 = 1, next;
    printf("First %d terms of Fibonacci: ", n);

    for (int i = 1; i <= n; ++i) {
        printf("%lld ", t1);
        next = t1 + t2;
        t1 = t2;
        t2 = next;
    }
    printf("\\n");
    return 0;
}`,
    },
  },
]

export default function CompilerView() {
  const { aiModel, addChatMessage, setActiveTab } = useStore()

  // Selected language state
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].templates.default)
  const [stdin, setStdin] = useState('')
  const [showStdin, setShowStdin] = useState(false)

  // Execution state
  const [isRunning, setIsRunning] = useState(false)
  const [outputResult, setOutputResult] = useState(null)
  const [activeConsoleTab, setActiveConsoleTab] = useState('stdout') // 'stdout' | 'stderr' | 'stdin'
  const [copied, setCopied] = useState(false)
  const [savedBadge, setSavedBadge] = useState(false)
  const [fontSize, setFontSize] = useState(13) // px

  const textareaRef = useRef(null)

  // Switch language
  const handleSelectLanguage = (lang) => {
    setSelectedLang(lang)
    setCode(lang.templates.default)
    setOutputResult(null)
  }

  // Load preset template
  const handleLoadTemplate = (templateKey) => {
    if (selectedLang.templates[templateKey]) {
      setCode(selectedLang.templates[templateKey])
    }
  }

  // Handle Tab key in code editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const val = e.target.value
      const updated = val.substring(0, start) + '  ' + val.substring(end)
      setCode(updated)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleRunCode()
    }
  }

  // Execute Code via Compiler API
  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return
    setIsRunning(true)
    setOutputResult({
      status: 'RUNNING',
      stdout: '',
      stderr: '',
      exitCode: null,
    })

    try {
      const res = await compilerAPI.execute({
        language: selectedLang.id,
        code,
        stdin,
        model: aiModel || 'gemini-3.8-flash',
      })

      const data = res.data || {}
      setOutputResult(data)

      // Auto-switch to stderr tab if there's an error
      if (!data.success && data.stderr) {
        setActiveConsoleTab('stderr')
      } else {
        setActiveConsoleTab('stdout')
      }
    } catch (err) {
      setOutputResult({
        success: false,
        status: 'RUNTIME_ERROR',
        stdout: '',
        stderr: err.response?.data?.details || err.response?.data?.error || err.message,
        exitCode: 1,
        executionTimeMs: 0,
      })
      setActiveConsoleTab('stderr')
    } finally {
      setIsRunning(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClearCode = () => {
    setCode('')
    setOutputResult(null)
  }

  const handleResetCode = () => {
    setCode(selectedLang.templates.default)
    setOutputResult(null)
  }

  // Send compiler error to Gemini Agent
  const handleFixWithAI = () => {
    if (!outputResult) return
    const errorMsg = outputResult.stderr || outputResult.stdout || 'Unknown error'
    const prompt = `Please fix this ${selectedLang.name} code compiler/runtime error:

Error message:
\`\`\`
${errorMsg}
\`\`\`

Source code:
\`\`\`${selectedLang.ext}
${code}
\`\`\`
Explain the root cause and provide the corrected code.`

    addChatMessage({
      role: 'user',
      content: prompt,
    })
  }

  const lines = (code || '').split('\n')

  return (
    <div className="flex flex-col h-full bg-ide-bg text-xs font-mono overflow-hidden select-text">
      {/* ── Toolbar Header ── */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-ide-sidebar border-b border-ide-border gap-2 shrink-0">
        {/* Left: Language Selector & Presets */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-ide-accent/15 border border-ide-accent/30 text-ide-accent shrink-0">
            <Cpu size={14} />
            <span className="font-bold text-[11px] uppercase tracking-wider">DevSphere Compiler</span>
          </div>

          {/* Language selector buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[420px] p-0.5 rounded-lg bg-ide-bg border border-ide-border shrink-0">
            {LANGUAGES.map((lang) => {
              const active = selectedLang.id === lang.id
              return (
                <button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  title={`${lang.name} (${lang.version})`}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    active
                      ? `${lang.color} shadow-sm border`
                      : 'text-ide-text/60 hover:text-ide-text hover:bg-ide-panel/80'
                  }`}
                >
                  <span>{lang.icon}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                </button>
              )
            })}
          </div>

          {/* Template presets */}
          <div className="relative group shrink-0">
            <select
              onChange={(e) => handleLoadTemplate(e.target.value)}
              defaultValue="default"
              className="bg-ide-panel border border-ide-border text-ide-text hover:text-ide-text-bright rounded-lg px-2 py-1 text-[11px] outline-none cursor-pointer"
            >
              <option value="default">Template: Default</option>
              <option value="twoSum">Algorithm: Two Sum</option>
              <option value="fibonacci">Algorithm: Fibonacci</option>
            </select>
          </div>
        </div>

        {/* Right: Actions (Run, Clear, Reset, Copy, Stdin) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Stdin Toggle */}
          <button
            onClick={() => setShowStdin(!showStdin)}
            title="Toggle Custom Input (stdin)"
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
              showStdin
                ? 'bg-ide-purple/20 text-ide-purple border-ide-purple/40'
                : 'bg-ide-panel text-ide-text/60 border-ide-border hover:text-ide-text'
            }`}
          >
            📥 Stdin {stdin.trim() && '●'}
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetCode}
            title="Reset to Language Template"
            className="p-1.5 rounded-lg bg-ide-panel border border-ide-border hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopyCode}
            title="Copy Source Code"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ide-panel border border-ide-border hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check size={12} className="text-ide-green" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Run / Compile Primary Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
            title="Compile & Run Code (Ctrl + Enter)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-lg ${
              isRunning
                ? 'bg-amber-500/80 text-black cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/40'
            }`}
          >
            {isRunning ? (
              <>
                <Sparkles size={13} className="animate-spin text-black" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>Run Code</span>
                <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden md:inline">
                  (Ctrl+↵)
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Workspace: Split into Code Editor & Execution Console ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Top: Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-ide-border bg-ide-bg">
          {/* Subheader info bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-ide-sidebar border-b border-ide-border/50 text-[11px] text-ide-text/60">
            <div className="flex items-center gap-2">
              <FileCode size={12} className="text-ide-accent" />
              <span className="text-ide-text-bright font-semibold">
                Main.{selectedLang.ext}
              </span>
              <span className="text-[10px] text-ide-text/40">({selectedLang.version})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-ide-text/40">
                {lines.length} lines • {code.length} chars
              </span>
              {/* Font size toggle */}
              <div className="flex items-center gap-1 text-[10px] text-ide-text/40">
                <span>Font:</span>
                <button
                  onClick={() => setFontSize(Math.max(11, fontSize - 1))}
                  className="px-1 hover:text-ide-text-bright"
                >
                  -
                </button>
                <span className="text-ide-text-bright">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                  className="px-1 hover:text-ide-text-bright"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line numbers column */}
            <div className="w-12 py-3 bg-ide-sidebar select-none border-r border-ide-border/40 text-right pr-3 text-ide-text/30 font-mono overflow-hidden shrink-0">
              {lines.map((_, idx) => (
                <div
                  key={idx}
                  style={{ height: `${fontSize * 1.6}px`, lineHeight: `${fontSize * 1.6}px` }}
                  className="text-[11px]"
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Editable Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: `${fontSize * 1.6}px`,
              }}
              placeholder={`Write or paste your ${selectedLang.name} code here...`}
              className="flex-1 p-3 bg-transparent text-ide-text-bright font-mono resize-none outline-none overflow-auto whitespace-pre tab-2 border-none selection:bg-ide-accent/30 caret-ide-accent leading-relaxed"
            />
          </div>

          {/* Stdin Drawer (if toggled open) */}
          {showStdin && (
            <div className="p-2.5 bg-ide-panel/80 border-t border-ide-border/60 shrink-0 slide-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-ide-text-bright flex items-center gap-1">
                  <span>📥 Standard Input (stdin):</span>
                </span>
                <button
                  onClick={() => setStdin('')}
                  className="text-[10px] text-ide-text/40 hover:text-ide-text cursor-pointer"
                >
                  Clear stdin
                </button>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input values for your program (one per line or space-separated)..."
                rows={2}
                className="w-full bg-ide-sidebar border border-ide-border rounded-lg p-2 text-xs text-ide-text-bright font-mono outline-none focus:border-ide-accent resize-none placeholder-ide-text/30"
              />
            </div>
          )}
        </div>

        {/* Right / Bottom: Execution Results & Compiler Console */}
        <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col bg-ide-panel border-t md:border-t-0 border-ide-border overflow-hidden shrink-0">
          {/* Console Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-ide-sidebar border-b border-ide-border shrink-0">
            <div className="flex items-center gap-2">
              <TerminalIcon size={13} className="text-emerald-400" />
              <span className="font-semibold text-ide-text-bright text-[11px]">
                Compiler Console
              </span>
            </div>

            {/* Console Subtabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveConsoleTab('stdout')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeConsoleTab === 'stdout'
                    ? 'bg-ide-accent/20 text-ide-accent border border-ide-accent/30'
                    : 'text-ide-text/50 hover:text-ide-text'
                }`}
              >
                stdout
              </button>
              <button
                onClick={() => setActiveConsoleTab('stderr')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeConsoleTab === 'stderr'
                    ? 'bg-ide-red/20 text-ide-red border border-ide-red/30'
                    : 'text-ide-text/50 hover:text-ide-text'
                }`}
              >
                <span>stderr</span>
                {outputResult?.stderr && <span className="w-1.5 h-1.5 rounded-full bg-ide-red animate-pulse" />}
              </button>
              <button
                onClick={() => setActiveConsoleTab('stdin')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeConsoleTab === 'stdin'
                    ? 'bg-ide-purple/20 text-ide-purple border border-ide-purple/30'
                    : 'text-ide-text/50 hover:text-ide-text'
                }`}
              >
                stdin
              </button>
              <button
                onClick={() => setOutputResult(null)}
                title="Clear console output"
                className="p-1 text-ide-text/40 hover:text-ide-text transition-colors cursor-pointer ml-1"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          {/* Status & Benchmark Card */}
          {outputResult && (
            <div className="px-3 py-2 bg-ide-bg/80 border-b border-ide-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {outputResult.status === 'RUNNING' && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold animate-pulse">
                    <Sparkles size={12} className="animate-spin" /> Compiling & Executing...
                  </span>
                )}
                {outputResult.status === 'SUCCESS' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 size={12} /> Success (Exit Code: {outputResult.exitCode ?? 0})
                  </span>
                )}
                {outputResult.status === 'COMPILE_ERROR' && (
                  <span className="flex items-center gap-1 text-[11px] text-ide-red font-semibold">
                    <AlertTriangle size={12} /> Compilation Error
                  </span>
                )}
                {outputResult.status === 'RUNTIME_ERROR' && (
                  <span className="flex items-center gap-1 text-[11px] text-ide-red font-semibold">
                    <AlertTriangle size={12} /> Runtime Error (Exit: {outputResult.exitCode ?? 1})
                  </span>
                )}
                {outputResult.status === 'TIMEOUT' && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                    <Clock size={12} /> Execution Timed Out
                  </span>
                )}
              </div>

              {outputResult.executionTimeMs !== undefined && (
                <div className="flex items-center gap-2 text-[10px] text-ide-text/50">
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} /> {outputResult.executionTimeMs}ms
                  </span>
                  {outputResult.runner && (
                    <span className="px-1.5 py-0.2 rounded bg-ide-panel border border-ide-border text-[9px] text-ide-text/70 uppercase">
                      {outputResult.runner}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Console Body Output */}
          <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed">
            {!outputResult && (
              <div className="h-full flex flex-col items-center justify-center text-center text-ide-text/40 gap-2 p-4">
                <Play size={24} className="opacity-30" />
                <p className="text-xs">No execution output yet.</p>
                <p className="text-[10px] text-ide-text/30 max-w-xs">
                  Press <strong>"Run Code"</strong> or hit <strong>Ctrl + Enter</strong> to compile and execute your source code.
                </p>
              </div>
            )}

            {outputResult && activeConsoleTab === 'stdout' && (
              <div>
                {outputResult.stdout ? (
                  <pre className="text-emerald-300 whitespace-pre-wrap selection:bg-emerald-800/40">
                    {outputResult.stdout}
                  </pre>
                ) : (
                  <div className="text-ide-text/40 italic">
                    {outputResult.status === 'RUNNING'
                      ? 'Compiling in progress...'
                      : outputResult.status === 'COMPILE_ERROR'
                      ? 'No stdout produced due to compilation errors. Check stderr tab.'
                      : '(Program produced no stdout output)'}
                  </div>
                )}
              </div>
            )}

            {outputResult && activeConsoleTab === 'stderr' && (
              <div>
                {outputResult.stderr ? (
                  <pre className="text-rose-400 whitespace-pre-wrap selection:bg-rose-900/40">
                    {outputResult.stderr}
                  </pre>
                ) : (
                  <div className="text-ide-text/40 italic">
                    No errors or warnings recorded.
                  </div>
                )}
              </div>
            )}

            {activeConsoleTab === 'stdin' && (
              <div>
                <p className="text-[10px] text-ide-text/50 mb-1">Current Standard Input:</p>
                <pre className="text-ide-text-bright bg-ide-panel p-2 rounded border border-ide-border whitespace-pre-wrap">
                  {stdin || '(Empty stdin)'}
                </pre>
              </div>
            )}
          </div>

          {/* Gemini AI Fix Assistant Callout (Shown when error occurs) */}
          {outputResult && !outputResult.success && outputResult.stderr && (
            <div className="p-2.5 bg-ide-panel/90 border-t border-ide-red/30 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-ide-text-bright text-[11px]">
                <Sparkles size={13} className="text-ide-accent shrink-0" />
                <span className="truncate">Compiler error detected.</span>
              </div>
              <button
                onClick={handleFixWithAI}
                className="px-2.5 py-1 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Fix with Gemini AI</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

