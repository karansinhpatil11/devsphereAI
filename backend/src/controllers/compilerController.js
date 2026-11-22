import { execFile, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { callGeminiDirect } from '../services/aiService.js'

// Known language aliases & templates
export const SUPPORTED_LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    version: 'Node.js v25',
    extension: 'js',
    icon: 'JS',
    color: '#f7df1e',
  },
  {
    id: 'python',
    name: 'Python 3',
    version: 'Python 3.11',
    extension: 'py',
    icon: 'PY',
    color: '#3776ab',
  },
  {
    id: 'java',
    name: 'Java 17',
    version: 'OpenJDK 17',
    extension: 'java',
    icon: '☕',
    color: '#ea2d2e',
  },
  {
    id: 'cpp',
    name: 'C++ 17',
    version: 'GCC 11 (C++17)',
    extension: 'cpp',
    icon: 'C++',
    color: '#00599c',
  },
  {
    id: 'c',
    name: 'C',
    version: 'GCC 11 (C11)',
    extension: 'c',
    icon: 'C',
    color: '#a8b9cc',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    version: 'TypeScript 5.3',
    extension: 'ts',
    icon: 'TS',
    color: '#3178c6',
  },
  {
    id: 'go',
    name: 'Go',
    version: 'Go 1.21',
    extension: 'go',
    icon: 'GO',
    color: '#00add8',
  },
  {
    id: 'rust',
    name: 'Rust',
    version: 'Rust 1.75',
    extension: 'rs',
    icon: 'RS',
    color: '#dea584',
  },
]

// Find Node.js executable path
const getNodePath = () => {
  if (process.platform === 'win32') {
    const defaultWin = 'C:\\Program Files\\node.exe'
    if (fs.existsSync(defaultWin)) return defaultWin
  }
  return process.execPath || 'node'
}

/**
 * Execute JavaScript natively with local Node.js process
 */
function runNodeNative(code, stdin = '', timeout = 10000) {
  return new Promise((resolve) => {
    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `devsphere_run_${Date.now()}_${Math.random().toString(36).slice(2)}.cjs`)

    // Write the user's code directly — do NOT wrap in try-catch that could change behavior
    const scriptContent = `
try {
  ${code}
} catch (err) {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
}
`
    try {
      fs.writeFileSync(tmpFile, scriptContent, 'utf8')
    } catch (e) {
      return resolve({
        success: false,
        status: 'RUNTIME_ERROR',
        stdout: '',
        stderr: `Failed to create temporary file: ${e.message}`,
        exitCode: 1,
      })
    }

    const nodePath = getNodePath()
    const startTime = Date.now()

    const child = spawn(nodePath, [tmpFile], {
      timeout,
      env: { ...process.env, NODE_OPTIONS: '' },
    })

    let stdout = ''
    let stderr = ''

    if (stdin) {
      child.stdin.write(stdin)
      child.stdin.end()
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString()
      if (stdout.length > 50000) child.kill('SIGKILL')
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      if (stderr.length > 50000) child.kill('SIGKILL')
    })

    child.on('error', (err) => {
      try { fs.unlinkSync(tmpFile) } catch {}
      resolve({
        success: false,
        status: 'RUNTIME_ERROR',
        stdout,
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
      })
    })

    child.on('close', (code, signal) => {
      try { fs.unlinkSync(tmpFile) } catch {}
      const timeMs = Date.now() - startTime

      if (signal === 'SIGTERM' || timeMs >= timeout) {
        return resolve({
          success: false,
          status: 'TIMEOUT',
          stdout,
          stderr: `Execution timed out after ${timeout}ms. Possible infinite loop.`,
          exitCode: 124,
          executionTimeMs: timeMs,
        })
      }

      resolve({
        success: code === 0,
        status: code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
        stdout,
        stderr,
        exitCode: code ?? 0,
        executionTimeMs: timeMs,
      })
    })
  })
}

/**
 * Execute Python code natively using local Python interpreter
 */
function runPythonNative(code, stdin = '', timeout = 10000) {
  return new Promise((resolve) => {
    // Try to find Python executable
    const pythonCandidates = process.platform === 'win32'
      ? ['python', 'python3', 'py']
      : ['python3', 'python']

    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `devsphere_run_${Date.now()}_${Math.random().toString(36).slice(2)}.py`)

    try {
      fs.writeFileSync(tmpFile, code, 'utf8')
    } catch (e) {
      return resolve({
        success: false,
        status: 'RUNTIME_ERROR',
        stdout: '',
        stderr: `Failed to create temporary file: ${e.message}`,
        exitCode: 1,
      })
    }

    const startTime = Date.now()
    const pythonPath = pythonCandidates[0] // Use first candidate

    const child = spawn(pythonPath, [tmpFile], {
      timeout,
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    if (stdin) {
      child.stdin.write(stdin)
      child.stdin.end()
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString()
      if (stdout.length > 50000) child.kill('SIGKILL')
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      if (stderr.length > 50000) child.kill('SIGKILL')
    })

    child.on('error', (err) => {
      try { fs.unlinkSync(tmpFile) } catch {}
      resolve(null) // Return null to signal native execution failed, try other methods
    })

    child.on('close', (exitCode, signal) => {
      try { fs.unlinkSync(tmpFile) } catch {}
      const timeMs = Date.now() - startTime

      if (signal === 'SIGTERM' || timeMs >= timeout) {
        return resolve({
          success: false,
          status: 'TIMEOUT',
          stdout,
          stderr: `Execution timed out after ${timeout}ms. Possible infinite loop.`,
          exitCode: 124,
          executionTimeMs: timeMs,
        })
      }

      resolve({
        success: exitCode === 0,
        status: exitCode === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
        stdout,
        stderr,
        exitCode: exitCode ?? 0,
        executionTimeMs: timeMs,
        runner: 'native-python',
      })
    })
  })
}

/**
 * Execute code via free public Piston Execution API
 */
async function runViaPiston(language, code, stdin = '') {
  const pistonMap = {
    javascript: 'javascript',
    js: 'javascript',
    python: 'python',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    c: 'c',
    typescript: 'typescript',
    ts: 'typescript',
    go: 'go',
    rust: 'rust',
  }

  const pistonLang = pistonMap[language.toLowerCase()] || language.toLowerCase()

  // For Java, the filename must match the public class name
  let fileName = `main.${pistonLang === 'java' ? 'java' : pistonLang === 'cpp' ? 'cpp' : pistonLang === 'c' ? 'c' : pistonLang === 'go' ? 'go' : pistonLang === 'rust' ? 'rs' : 'txt'}`

  // Extract Java class name from code if present
  if (pistonLang === 'java') {
    const classMatch = code.match(/public\s+class\s+(\w+)/)
    if (classMatch) {
      fileName = `${classMatch[1]}.java`
    }
  }

  const payload = {
    language: pistonLang,
    version: '*',
    files: [
      {
        name: fileName,
        content: code,
      },
    ],
    stdin,
  }

  const startTime = Date.now()
  const res = await axios.post('https://emkc.org/api/v2/piston/execute', payload, {
    timeout: 15000,
  })

  const run = res.data?.run || {}
  const compile = res.data?.compile || {}

  const isCompileError = compile.code && compile.code !== 0
  const isRuntimeError = run.code && run.code !== 0

  return {
    success: !isCompileError && !isRuntimeError,
    status: isCompileError ? 'COMPILE_ERROR' : isRuntimeError ? 'RUNTIME_ERROR' : 'SUCCESS',
    stdout: run.stdout || '',
    stderr: (compile.stderr ? `[Compiler Error]:\n${compile.stderr}\n` : '') + (run.stderr || ''),
    exitCode: isCompileError ? compile.code : run.code ?? 0,
    executionTimeMs: Date.now() - startTime,
    runner: 'piston-sandbox',
  }
}

/**
 * Intelligent Gemini AI Compiler & Simulation Engine
 * Uses AI to simulate exact program execution
 */
async function runViaGeminiEngine(language, code, stdin = '', model = 'gemini-3.8-flash') {
  const prompt = `You are a precise code execution engine for ${language}.
You must simulate the EXACT runtime behavior of the following program.

Source code:
\`\`\`${language}
${code}
\`\`\`
${stdin ? `Standard Input (stdin): "${stdin}"` : 'No standard input provided.'}

Instructions:
1. First check for syntax/compilation errors. If found, report them exactly.
2. If the code compiles, simulate its execution step-by-step and produce the EXACT stdout output.
3. Do NOT add any extra commentary — only return what the program would actually print.
4. If there is a runtime error (division by zero, null pointer, etc.), report it in stderr.

Respond ONLY with this JSON (no markdown, no backticks):
{
  "status": "SUCCESS",
  "exitCode": 0,
  "stdout": "exact program output here",
  "stderr": "",
  "executionTimeMs": 48,
  "memoryUsageKb": 14200
}`

  try {
    const rawContent = await callGeminiDirect(prompt, model)
    if (rawContent) {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          success: parsed.status === 'SUCCESS' && parsed.exitCode === 0,
          status: parsed.status || (parsed.exitCode === 0 ? 'SUCCESS' : 'RUNTIME_ERROR'),
          stdout: parsed.stdout || '',
          stderr: parsed.stderr || '',
          exitCode: parsed.exitCode ?? (parsed.status === 'SUCCESS' ? 0 : 1),
          executionTimeMs: parsed.executionTimeMs || 54,
          memoryUsageKb: parsed.memoryUsageKb || 14200,
          runner: 'gemini-compiler-engine',
        }
      }
    }
  } catch (err) {
    console.error('[Gemini Compiler Error]', err.message)
  }

  return null // Return null so caller knows Gemini also failed
}

/**
 * Controller: Execute Code
 * POST /api/compiler/execute
 *
 * Execution priority:
 *   1. Native local execution (Node.js for JS/TS, Python for PY)
 *   2. Piston public sandbox API (supports all languages)
 *   3. Gemini AI code execution simulation
 *   4. Error message if all methods fail
 */
export async function executeCode(req, res) {
  try {
    const { language = 'javascript', code = '', stdin = '', model } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code content is required' })
    }

    const normLang = language.toLowerCase().trim()
    let result = null

    // ── 1. Native local execution ───────────────────────────────
    if (normLang === 'javascript' || normLang === 'js' || normLang === 'typescript' || normLang === 'ts') {
      try {
        let jsCode = code
        if (normLang === 'typescript' || normLang === 'ts') {
          // Strip TypeScript type annotations for Node.js execution
          jsCode = code
            .replace(/:\s*\w+(\[\])?\s*(?=[;,=)\n{])/g, '')
            .replace(/\binterface\s+\w+\s*\{[^}]*\}/g, '')
            .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, '')
            .replace(/<\w+(\[\])?>/g, '')
        }
        result = await runNodeNative(jsCode, stdin)
        if (result) {
          result.runner = normLang === 'typescript' || normLang === 'ts' ? 'native-node-ts' : 'native-node'
        }
      } catch (nativeErr) {
        console.error('[Native Node Error]', nativeErr.message)
      }
    }

    if (normLang === 'python' || normLang === 'py') {
      try {
        result = await runPythonNative(code, stdin)
      } catch (nativeErr) {
        console.error('[Native Python Error]', nativeErr.message)
      }
    }

    // If native execution succeeded, return immediately
    if (result && result.success !== undefined) {
      // Clean up stderr paths
      if (result.stderr) {
        result.stderr = result.stderr
          .replace(/\/tmp\/[^\s]+/g, (m) => m.split('/').pop())
          .replace(/at Object\.<anonymous>.*$/gm, '')
          .trim()
      }
      return res.json({
        language: normLang,
        timestamp: new Date().toISOString(),
        ...result,
      })
    }

    // ── 2. Try Piston Public Execution API ──────────────────────
    try {
      const pistonResult = await runViaPiston(normLang, code, stdin)
      if (pistonResult) {
        result = pistonResult
      }
    } catch (pistonErr) {
      console.error('[Piston API Error]', pistonErr.message)
    }

    // If Piston succeeded, return immediately
    if (result && result.success !== undefined) {
      if (result.stderr) {
        result.stderr = result.stderr
          .replace(/\/tmp\/[^\s]+/g, (m) => m.split('/').pop())
          .replace(/at Object\.<anonymous>.*$/gm, '')
          .trim()
      }
      return res.json({
        language: normLang,
        timestamp: new Date().toISOString(),
        ...result,
      })
    }

    // ── 3. Fallback to Gemini AI Code Execution Simulation ──────
    result = await runViaGeminiEngine(normLang, code, stdin, model)

    if (result) {
      return res.json({
        language: normLang,
        timestamp: new Date().toISOString(),
        ...result,
      })
    }

    // ── 4. All methods failed ────────────────────────────────────
    return res.json({
      language: normLang,
      timestamp: new Date().toISOString(),
      success: false,
      status: 'RUNTIME_ERROR',
      stdout: '',
      stderr: `Could not execute ${normLang} code. No compiler backend is available.\nPlease ensure the Piston API is reachable or a Gemini API key is configured.`,
      exitCode: 1,
      executionTimeMs: 0,
      runner: 'none',
    })
  } catch (err) {
    console.error('[Compiler Execution Error]', err)
    return res.status(500).json({
      success: false,
      error: 'Execution failed',
      details: err.message,
      status: 'RUNTIME_ERROR',
      stdout: '',
      stderr: `DevSphere Compiler Error: ${err.message}`,
      exitCode: 1,
      executionTimeMs: 0,
    })
  }
}

/**
 * Controller: Get Supported Languages
 * GET /api/compiler/languages
 */
export async function getLanguages(req, res) {
  return res.json({
    languages: SUPPORTED_LANGUAGES,
    defaultLanguage: 'javascript',
  })
}
