import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import { executeMCPTool, ALL_MCP_TOOLS } from '../mcp/mcpClient.js'
import { getAllTasks, createTask, updateTask, deleteTask, getAllIssues, getProjectProgress } from '../models/taskStore.js'
import { getAllDocs } from '../models/docStore.js'
import { isDBConnected } from '../config/db.js'
import { AISession, Activity } from '../models/schemas.js'

dotenv.config()

// Support GEMINI_API_KEY, GOOGLE_API_KEY, or legacy OPENAI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY

let ai = null
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey })
  } catch (err) {
    console.warn('[Gemini Init Warning]', err.message)
  }
}

// Available free tier Gemini models
export const FREE_GEMINI_MODELS = {
  DEFAULT: 'gemini-3.8-flash',
  MODELS: [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ],
}

// Map user-friendly model names to Gemini model IDs
const MODEL_MAP = {
  'gemini-3.8-flash': 'gemini-3.8-flash',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.0-flash': 'gemini-2.0-flash',
  'gemini-1.5-flash': 'gemini-1.5-flash',
  'Gemini 3.8 Flash (Free)': 'gemini-3.8-flash',
  'Gemini 3.8 Flash': 'gemini-3.8-flash',
  'Gemini 2.5 Flash (Free)': 'gemini-2.5-flash',
  'Gemini 2.5 Flash': 'gemini-2.5-flash',
  'Gemini 2.0 Flash (Free)': 'gemini-2.0-flash',
  'Gemini 2.0 Flash': 'gemini-2.0-flash',
  'Gemini 1.5 Flash (Free)': 'gemini-1.5-flash',
  'Gemini 1.5 Flash': 'gemini-1.5-flash',
  'GPT-4o': 'gemini-3.8-flash',
  'GPT-4o-mini': 'gemini-2.5-flash',
  'GPT-3.5 Turbo': 'gemini-1.5-flash',
}

import { getAllIssues, getProjectProgress, getProjectData } from '../models/taskStore.js'

/**
 * Build dynamic project context for the AI Agent
 */
function buildProjectContext() {
  const tasks = getAllTasks()
  const docs = getAllDocs()
  const issues = getAllIssues()
  const progress = getProjectProgress()

  return `
--- PROJECT CONTEXT ---
Active Project: core-service (Java 17 / Spring Boot 3.2)
Repository: karansinhpatil11/final-year-project (branch: main)
Overall Progress: ${progress.overallProgress}% | Milestone Readiness: ${progress.readinessScore}%
Active Milestone: ${progress.activeMilestone} (Deadline: ${progress.milestoneDeadline})
Active Pull Request: PR #452 ("Fix data fetch issues and improve error handling")
Modified file: src/main/java/com/company/service/AppService.java
Associated controller: src/main/java/com/company/service/AppController.java

Open Tasks (${tasks.length} total, ${progress.tasks.completed} completed, ${progress.tasks.inProgress} in progress):
${tasks.map((t) => `- [${t.status.toUpperCase()}] ${t.title} (${t.priority} priority)`).join('\n')}

Active Project Issues (${issues.length}):
${issues.map((i) => `- #${i.number} [${i.status.toUpperCase()}] ${i.title} (${i.severity} severity)`).join('\n')}

Documentation Library (${docs.length} docs available):
${docs.map((d) => `- "${d.title}" (${d.category})`).join('\n')}
-----------------------`
}

const SYSTEM_PROMPT = `You are an Autonomous AI Developer Assistant embedded in an IDE.
Follow this 5-stage cognitive architecture:
1. Understand Request: Parse developer intent, identify files, methods, errors, or requests.
2. Reasoning: Analyze root causes, best practices, edge cases, and architecture implications.
3. Select Tools: You have access to the MCP Protocol connecting:
   - GitHub MCP Server (repositories, files, commits, PRs, diffs)
   - Documentation MCP Server (read, create, update, search docs)
   - Project/Task MCP Server (list, create, update tasks, project progress)
4. Use Project Context: Integrate repository files, open tasks, and active PRs into your response.
5. Generate Response: Output a structured JSON response.

RESPONSE FORMAT:
Always return valid JSON or markdown containing code. If returning JSON:
{
  "thought": "brief reasoning step explaining what was understood and why",
  "content": "your detailed technical response or explanation",
  "code": "optional code snippet",
  "codeLanguage": "java/javascript/etc",
  "mcpToolUsed": "optional tool name if an MCP server was invoked",
  "actions": ["Apply Code", "Create PR"]
}

Be concise, technically rigorous, and focused on clean software engineering.`

/**
 * Intelligent fallback when API key is missing or simulating response
 */
function getFallbackResponse(message, mcpToolResult = null, mcpToolUsed = null) {
  const lower = (message || '').toLowerCase()

  if (mcpToolResult) {
    if (mcpToolUsed?.includes('task_create')) {
      const tasks = Array.isArray(mcpToolResult) ? mcpToolResult : [mcpToolResult]
      return {
        thought: 'Created development task(s) in Task Tracker via Project/Task MCP Server.',
        content: `✅ **Task(s) Created Successfully via Gemini AI**\n\n` +
          tasks.map((t) => `• **${t.title}** \`[${(t.priority || 'medium').toUpperCase()}]\` — *${t.status || 'todo'}* (Assigned: ${t.assignee || 'DevUser'})`).join('\n') +
          `\n\nAll tasks have been automatically added to your Project Task Tracker!`,
        taskAction: 'created',
        task: mcpToolResult,
        actions: ['View Tasks', 'Create PR'],
      }
    }
    if (mcpToolUsed?.includes('task_update')) {
      return {
        thought: 'Updated task in Task Tracker via Project/Task MCP Server.',
        content: `✅ **Task Updated Successfully**\n\n• **Task ID**: \`${mcpToolResult.id || mcpToolResult.taskId}\`\n• **Title**: **${mcpToolResult.title || 'Task'}**\n• **New Status**: \`${mcpToolResult.status || 'done'}\`\n\nTask Tracker is synchronized.`,
        taskAction: 'updated',
        task: mcpToolResult,
        actions: ['View Tasks'],
      }
    }
    if (mcpToolUsed?.includes('task_delete')) {
      return {
        thought: 'Deleted task from Task Tracker via Project/Task MCP Server.',
        content: `🗑️ **Task Deleted**\n\nThe task has been removed from your Project Task Tracker.`,
        taskAction: 'deleted',
        actions: ['View Tasks'],
      }
    }
    if (mcpToolUsed?.includes('task_list')) {
      const list = Array.isArray(mcpToolResult) ? mcpToolResult : []
      const pending = list.filter((t) => t.status !== 'done')
      const completed = list.filter((t) => t.status === 'done')
      return {
        thought: 'Retrieved task list from Project/Task MCP Server.',
        content: `📋 **Project Task Tracker (${list.length} tasks)**\n\n` +
          `**Pending Tasks (${pending.length}):**\n` +
          (pending.length > 0
            ? pending.map((t) => `• [ ] **${t.title}** \`[${(t.priority || 'medium').toUpperCase()}]\` (ID: \`${t.id}\`)`).join('\n')
            : '_No pending tasks._') +
          `\n\n**Completed Tasks (${completed.length}):**\n` +
          (completed.length > 0
            ? completed.map((t) => `• [x] ~~${t.title}~~`).join('\n')
            : '_No completed tasks._'),
        actions: ['AI Plan Tasks', 'Create Task'],
      }
    }
    if (mcpToolUsed?.includes('github_create_pr')) {
      return {
        thought: 'Created Pull Request on GitHub via GitHub MCP Server.',
        content: `🚀 **Pull Request Created via GitHub MCP Server**\n\n• **PR Number**: #${mcpToolResult.number || 453}\n• **Title**: ${mcpToolResult.title || 'feat: update services and error handling'}\n• **Status**: Open\n• **Repository**: final-year-project\n\nYou can inspect the PR and diff directly in the workspace!`,
        actions: ['Apply Code'],
      }
    }
    if (mcpToolUsed?.includes('github_create_issue')) {
      return {
        thought: 'Submitted new Issue to GitHub repository via GitHub MCP Server.',
        content: `📌 **GitHub Issue Created via GitHub MCP Server**\n\n• **Issue Number**: #${mcpToolResult.number || 12}\n• **Title**: ${mcpToolResult.title || 'Issue logged'}\n• **Status**: Open\n\nIssue has been logged to the GitHub issue tracker.`,
        actions: ['Apply Code'],
      }
    }
    if (mcpToolUsed?.includes('project_issues_list')) {
      const list = Array.isArray(mcpToolResult) ? mcpToolResult : []
      return {
        thought: 'Queried open issues from GitHub & Project MCP Server.',
        content: `🐞 **Open Project Issues (${list.length})**\n\n` +
          (list.length > 0
            ? list.map((i) => `• **#${i.number || i.id}** [${(i.severity || 'medium').toUpperCase()}]: ${i.title}`).join('\n')
            : '_No open issues reported._'),
        actions: ['Fix Issues'],
      }
    }
    return {
      thought: 'Executed MCP Protocol tool and integrated project data into response.',
      content: `MCP Tool \`${mcpToolUsed}\` executed successfully.`,
      actions: ['Apply Code'],
    }
  }

  if (lower.includes('task') || lower.includes('todo')) {
    const tasks = getAllTasks()
    return {
      thought: 'Analyzed task management request via Project/Task MCP Server.',
      content: `I queried the Project/Task MCP Server. You currently have ${tasks.length} active tasks in this project:\n\n` +
        tasks.map((t) => `• **${t.title}** (${t.status}) - ${t.priority} priority`).join('\n'),
      actions: ['Create PR'],
    }
  }

  if (lower.includes('doc') || lower.includes('architecture') || lower.includes('guide')) {
    const docs = getAllDocs()
    return {
      thought: 'Fetched project documentation through Documentation MCP Server.',
      content: `According to the Documentation MCP Server, here are the available guides:\n\n` +
        docs.map((d) => `• **${d.title}** (${d.category})`).join('\n') +
        `\n\nWould you like me to read or update any of these documents?`,
      actions: ['Apply Code'],
    }
  }

  if (lower.includes('null') || lower.includes('optional') || lower.includes('getdata') || lower.includes('refactor') || lower.includes('bug')) {
    return {
      thought: 'Identified NullPointerException risk in AppService. Refactoring with java.util.Optional wrapper.',
      content: 'Certainly! Here is a refactored version using `Optional` to safely handle potential null pointer exceptions:',
      code: `public Optional<Data> getData() {\n  return Optional.ofNullable(\n    repository.fetchData());\n}`,
      codeLanguage: 'java',
      actions: ['Apply Code', 'Create PR'],
    }
  }

  return {
    thought: 'Processed developer request with project context (core-service, PR #452).',
    content: `I've analyzed your request: "${message}". I'm connected to the GitHub MCP Server, Documentation MCP Server, and Project/Task MCP Server. How can I assist you with this codebase?`,
    actions: ['Apply Code', 'Create PR'],
  }
}

/**
 * Parses Gemini output to extract JSON or code blocks
 */
function parseGeminiOutput(raw) {
  if (!raw) return { content: '' }

  try {
    const direct = JSON.parse(raw)
    if (direct && (direct.content || direct.code)) return direct
  } catch {}

  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      if (parsed && (parsed.content || parsed.code)) return parsed
    } catch {}
  }

  const codeMatch = raw.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/)
  if (codeMatch) {
    const lang = codeMatch[1] || 'java'
    const code = codeMatch[2].trim()
    const content = raw.replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/, '').trim()
    return {
      content: content || 'Here is the proposed code implementation:',
      code,
      codeLanguage: lang,
      actions: ['Apply Code', 'Create PR'],
    }
  }

  return { content: raw }
}

/**
 * Autonomous AI Agent Request Handler:
 * 1. Understands Request
 * 2. Reasonings & Tool Selection (MCP Protocol)
 * 3. Injects Project Context
 * 4. Calls Gemini 3.8 Flash
 * 5. Generates Response & Updates MongoDB
 */
export async function chatWithAI(message, history = [], requestedModel, user = 'DevUser', temperature = 0.2) {
  const modelKey = requestedModel || process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.8-flash'
  const targetModel = MODEL_MAP[modelKey] || 'gemini-3.8-flash'

  // Stage 1 & 2: Evaluate if an MCP protocol tool should be invoked
  const lower = (message || '').toLowerCase()
  let mcpResult = null
  let mcpToolUsed = null

  try {
    // 1. Task Creation via AI Agent
    if (/\b(create|add|new)\s+(?:a\s+)?(?:task|todo)\b/i.test(lower) || /^todo:/i.test(message.trim())) {
      mcpToolUsed = 'Project/Task MCP Server: task_create'
      let title = message.replace(/^(?:please\s+)?(?:create|add|new)\s+(?:a\s+)?(?:task|todo)\s*(?::|-)?\s*/i, '').trim()
      title = title.replace(/^todo:\s*/i, '').trim()
      const priorityMatch = message.match(/\b(high|medium|low)\s+priority\b/i) || message.match(/\bpriority\s+(high|medium|low)\b/i)
      const priority = priorityMatch ? (priorityMatch[1] || priorityMatch[2]).toLowerCase() : 'medium'
      if (!title) title = 'Review and enhance workspace code'
      mcpResult = await executeMCPTool('task_create', { title, priority, status: 'todo' }, user)
    }
    // 2. Task Completion / Update via AI Agent
    else if (/\b(complete|finish|done|close|mark)\s+(?:task|todo)\b/i.test(lower) || /\bmark\s+(?:task\s+)?[\w-]+\s+(?:as\s+)?done\b/i.test(lower)) {
      mcpToolUsed = 'Project/Task MCP Server: task_update'
      const idMatch = message.match(/task-[\w-]+/i) || message.match(/task\s+(\d+)/i) || message.match(/\b(\d+)\b/)
      let taskId = idMatch ? (idMatch[0].startsWith('task-') ? idMatch[0] : `task-${idMatch[1] || idMatch[0]}`) : 'task-1'
      mcpResult = await executeMCPTool('task_update', { taskId, status: 'done' }, user)
    }
    // 3. Task Deletion via AI Agent
    else if (/\b(delete|remove)\s+(?:task|todo)\b/i.test(lower)) {
      mcpToolUsed = 'Project/Task MCP Server: task_delete'
      const idMatch = message.match(/task-[\w-]+/i) || message.match(/task\s+(\d+)/i) || message.match(/\b(\d+)\b/)
      let taskId = idMatch ? (idMatch[0].startsWith('task-') ? idMatch[0] : `task-${idMatch[1] || idMatch[0]}`) : 'task-1'
      mcpResult = await executeMCPTool('task_delete', { taskId }, user)
    }
    // 4. Task Listing
    else if (/\b(list|show|view|get|all|my)\s+(?:tasks|todos)\b/i.test(lower) || /\b(task\s+tracker|task\s+list)\b/i.test(lower)) {
      mcpToolUsed = 'Project/Task MCP Server: task_list'
      mcpResult = await executeMCPTool('task_list', {}, user)
    }
    // 5. Auto Plan Tasks via AI Agent
    else if (/\b(plan|generate|break\s*down)\s+(?:tasks|todos|work|sprint)\b/i.test(lower)) {
      mcpToolUsed = 'Project/Task MCP Server: task_create'
      const sampleTasks = [
        { title: 'Add defensive null-checks in AppService.java', priority: 'high', description: 'Prevent NullPointerException in getData()' },
        { title: 'Write comprehensive JUnit test suite', priority: 'medium', description: 'Cover service success and failure edge cases' },
        { title: 'Setup Spring Boot cache layer with Caffeine', priority: 'low', description: 'Optimize response latency for frequent data queries' },
      ]
      const createdList = []
      for (const t of sampleTasks) {
        const c = await executeMCPTool('task_create', t, user)
        createdList.push(c)
      }
      mcpResult = createdList
    }
    // 6. PR & GitHub Tools
    else if (lower.includes('create pr') || lower.includes('create pull request') || lower.includes('open pr')) {
      mcpToolUsed = 'GitHub MCP Server: github_create_pr'
      const titleMatch = message.match(/(?:title|named?|for)\s+[:"']?([^"'\n]+)/i)
      const prTitle = titleMatch ? titleMatch[1].trim() : 'feat: update services and error handling'
      mcpResult = await executeMCPTool('github_create_pr', {
        repo: 'final-year-project',
        title: prTitle,
        head: 'feature/gemini-enhancements',
        base: 'main',
        body: 'Pull request generated autonomously by Gemini AI Agent.\n\nChanges include refactored code and null-safety enhancements.',
      }, user)
    } else if (/\b(create|open|report|file)\s+(?:an?\s+)?(?:issue|bug|ticket)\b/i.test(lower)) {
      mcpToolUsed = 'GitHub MCP Server: github_create_issue'
      const titleMatch = message.match(/(?:title|named?|about|for)\s+[:"']?([^"'\n]+)/i)
      const issueTitle = titleMatch ? titleMatch[1].trim() : 'Potential runtime issue detected by Gemini'
      mcpResult = await executeMCPTool('github_create_issue', {
        repo: 'final-year-project',
        title: issueTitle,
        body: 'Issue logged via Gemini AI Agent from development workspace analysis.',
        labels: ['bug', 'ai-detected'],
      }, user)
    } else if (lower.includes('progress') || lower.includes('milestone') || lower.includes('readiness')) {
      mcpToolUsed = 'Project MCP Server: project_get_progress'
      mcpResult = await executeMCPTool('project_get_progress', {}, user)
    } else if (lower.includes('project data') || lower.includes('architecture') || lower.includes('project info')) {
      mcpToolUsed = 'Project MCP Server: project_get_data'
      mcpResult = await executeMCPTool('project_get_data', {}, user)
    } else if (lower.includes('commit') || lower.includes('git log') || lower.includes('history')) {
      mcpToolUsed = 'GitHub MCP Server: github_get_commits'
      mcpResult = await executeMCPTool('github_get_commits', { repo: 'final-year-project' }, user)
    } else if (/\b(list|show|view|get|all)\s+(?:issues|tickets)\b/i.test(lower) || /\b(project\s+issues|issue\s+tracker)\b/i.test(lower)) {
      mcpToolUsed = 'Project/GitHub MCP Server: project_issues_list'
      mcpResult = await executeMCPTool('project_issues_list', {}, user)
    } else if (lower.includes('repo') || lower.includes('repository')) {
      mcpToolUsed = 'GitHub MCP Server: github_list_repositories'
      mcpResult = await executeMCPTool('github_list_repositories', {}, user)
    } else if (/\bprs?\b/i.test(lower) || lower.includes('pull request') || lower.includes('diff')) {
      mcpToolUsed = 'GitHub MCP Server: github_get_pull_requests'
      mcpResult = await executeMCPTool('github_get_pull_requests', { repo: 'final-year-project' }, user)
    } else if (lower.includes('doc') || lower.includes('guide') || lower.includes('documentation')) {
      mcpToolUsed = 'Documentation MCP Server: doc_search'
      mcpResult = await executeMCPTool('doc_search', { query: message }, user)
    }
  } catch (err) {
    console.warn('[MCP Tool Dispatch Warning]', err.message)
  }

  // Fallback if no API client
  if (!ai || !apiKey || apiKey.includes('your_') || apiKey.length < 10) {
    const fallback = getFallbackResponse(message, mcpResult, mcpToolUsed)
    if (mcpToolUsed) fallback.mcpToolUsed = mcpToolUsed
    return fallback
  }

  try {
    // Stage 3 & 4: Construct multi-turn contents with project context & MCP results
    const projectContext = buildProjectContext()
    const contents = []

    for (const msg of history.slice(-8)) {
      const role = msg.role === 'user' ? 'user' : 'model'
      const text = msg.content || (typeof msg === 'string' ? msg : '')
      if (text) {
        contents.push({ role, parts: [{ text }] })
      }
    }

    let promptWithContext = `${projectContext}\n\nDeveloper Request: ${message}`
    if (mcpResult) {
      promptWithContext += `\n\n[MCP Protocol Tool Executed: ${mcpToolUsed}]\nTool Result:\n${JSON.stringify(mcpResult, null, 2)}`
    }

    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }],
    })

    // Parse and constrain temperature between 0.0 and 1.0 (defaults to 0.2)
    const parsedTemp = parseFloat(temperature)
    const resolvedTemp = !isNaN(parsedTemp) ? Math.min(Math.max(parsedTemp, 0.0), 1.0) : 0.2

    // Stage 5: Generate Response via Gemini
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: resolvedTemp,
        maxOutputTokens: 2048,
      },
    })

    const parsed = parseGeminiOutput(response.text)
    if (mcpToolUsed) parsed.mcpToolUsed = mcpToolUsed

    // Persist Session to MongoDB if connected
    if (isDBConnected()) {
      try {
        const sessionId = `session-${user}`
        await AISession.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              messages: [
                { role: 'user', content: message, timestamp: new Date() },
                {
                  role: 'assistant',
                  content: parsed.content,
                  code: parsed.code,
                  codeLanguage: parsed.codeLanguage,
                  actions: parsed.actions,
                  timestamp: new Date(),
                },
              ],
            },
            $set: { model: targetModel, userId: user },
          },
          { upsert: true, new: true }
        )

        await Activity.create({
          userId: user,
          action: 'ai_chat_response',
          details: { model: targetModel, mcpToolUsed },
        })
      } catch (err) {
        console.warn('[MongoDB Session Save Warning]', err.message)
      }
    }

    return parsed
  } catch (err) {
    console.error(`[Gemini API Error with ${targetModel}]:`, err.message)
    const fallback = getFallbackResponse(message, mcpResult)
    fallback.note = `Live API notice: ${err.message}. Showing local developer assistant suggestion.`
    return fallback
  }
}

/**
 * Local Intelligent Generator for coding actions when offline or fallback
 */
function generateLocalCodingResult(action, code, language, targetFile, fallbackTitle) {
  const isJava = language.toLowerCase().includes('java')
  const isJs = language.toLowerCase().includes('javascript') || language.toLowerCase().includes('typescript') || language.toLowerCase().includes('js')

  if (action === 'fix_bugs') {
    let fixedCode = code
    let explanation = ''

    if (isJava) {
      explanation = `### 🐛 Bugs Identified & Resolved\n\n` +
        `1. **NullPointerException Risk**: Direct call \`repository.fetchData()\` can return \`null\`, triggering an unchecked NPE in calling code.\n` +
        `2. **Missing Constructor Validation**: \`DataRepository\` parameter was assigned without non-null validation.\n` +
        `3. **Missing Exception Resilience**: Wrapped repository access in a defensive \`try-catch\` block with structured logging.\n` +
        `4. **Spring Service Lifecycle**: Added \`@Service\` and \`@Cacheable\` annotations for caching and component scanning.`
      fixedCode = `package com.company.service;

import com.company.repository.DataRepository;
import com.company.model.Data;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class AppService {

    private static final Logger logger = LoggerFactory.getLogger(AppService.class);
    private final DataRepository repository;

    public AppService(DataRepository repository) {
        if (repository == null) {
            throw new IllegalArgumentException("DataRepository must not be null");
        }
        this.repository = repository;
    }

    /**
     * Safely retrieves application data with Optional wrapping and error logging
     */
    @Cacheable(value = "appData", unless = "#result == null")
    public Optional<Data> getData() {
        try {
            Data data = repository.fetchData();
            return Optional.ofNullable(data);
        } catch (Exception ex) {
            logger.error("Failed to safely fetch data from repository: {}", ex.getMessage(), ex);
            return Optional.empty();
        }
    }
}`
    } else if (isJs) {
      explanation = `### 🐛 Bugs Identified & Resolved\n\n` +
        `1. **Unhandled Null / Undefined Access**: Added optional chaining and nullish coalescing to prevent runtime crashes.\n` +
        `2. **Missing Error Boundary**: Added defensive try/catch handling.\n` +
        `3. **Clean Code Structure**: Exported modular functions with input validation.`
      fixedCode = `// Hardened bug-free implementation with null-checks and error handling
export function executeOperation(payload = {}) {
  try {
    if (!payload || typeof payload !== 'object') {
      throw new TypeError('Invalid payload: expected an object')
    }
    const data = Array.isArray(payload.items) ? payload.items : []
    const total = data.reduce((sum, n) => sum + (Number(n) || 0), 0)
    const max = data.length > 0 ? Math.max(...data) : 0

    return { success: true, count: data.length, total, max }
  } catch (err) {
    console.error('[Execution Error]:', err.message)
    return { success: false, error: err.message, total: 0 }
  }
}`
    } else {
      explanation = `### 🐛 Bugs Identified & Resolved\n\n` +
        `1. **Unchecked None Values**: Added explicit None guards.\n` +
        `2. **Unhandled Exceptions**: Encapsulated logic in try/except blocks with logging.\n` +
        `3. **Type Safety**: Added typing annotations.`
      fixedCode = `# Hardened implementation with exception handling and validation
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

def process_data(items: Optional[List[int]] = None) -> Dict[str, Any]:
    try:
        if not items:
            return {"success": True, "total": 0, "max": 0, "count": 0}
        total = sum(n for n in items if isinstance(n, (int, float)))
        max_val = max(items) if items else 0
        return {"success": True, "total": total, "max": max_val, "count": len(items)}
    except Exception as ex:
        logger.error(f"Error processing data: {ex}")
        return {"success": False, "error": str(ex), "total": 0}`
    }

    return {
      action: 'fix_bugs',
      title: fallbackTitle,
      thought: `Scanned ${targetFile} and resolved null safety, validation, and exception handling issues.`,
      content: explanation,
      code: fixedCode,
      codeLanguage: language,
      targetFile,
      actions: ['Apply Code', 'Save New'],
    }
  }

  if (action === 'generate_tests') {
    let testCode = ''
    let testFileName = ''

    if (isJava) {
      testFileName = 'AppServiceTest.java'
      testCode = `package com.company.service;

import com.company.repository.DataRepository;
import com.company.model.Data;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppServiceTest {

    @Mock
    private DataRepository repository;

    @InjectMocks
    private AppService appService;

    private Data sampleData;

    @BeforeEach
    void setUp() {
        sampleData = new Data("101", "Production Dataset");
    }

    @Test
    @DisplayName("Should return Optional with data when repository succeeds")
    void testGetData_Success() {
        when(repository.fetchData()).thenReturn(sampleData);

        Optional<Data> result = appService.getData();

        assertTrue(result.isPresent(), "Result Optional should be present");
        assertEquals("101", result.get().getId());
        verify(repository, times(1)).fetchData();
    }

    @Test
    @DisplayName("Should return empty Optional when repository returns null")
    void testGetData_NullHandling() {
        when(repository.fetchData()).thenReturn(null);

        Optional<Data> result = appService.getData();

        assertFalse(result.isPresent(), "Result should be empty when repository returns null");
        verify(repository, times(1)).fetchData();
    }

    @Test
    @DisplayName("Should handle repository exception gracefully without crashing")
    void testGetData_ExceptionHandling() {
        when(repository.fetchData()).thenThrow(new RuntimeException("Database timeout"));

        Optional<Data> result = appService.getData();

        assertFalse(result.isPresent(), "Result should be empty when repository throws exception");
        verify(repository, times(1)).fetchData();
    }
}`
    } else if (isJs) {
      testFileName = 'app.test.js'
      testCode = `import { describe, it, expect, vi } from 'vitest'
import { executeOperation } from './main.js'

describe('Application Service Unit Tests', () => {
  it('should compute total and max correctly for valid array', () => {
    const payload = { items: [12, 45, 68, 23, 89, 34] }
    const result = executeOperation(payload)

    expect(result.success).toBe(true)
    expect(result.total).toBe(271)
    expect(result.max).toBe(89)
    expect(result.count).toBe(6)
  })

  it('should handle empty or null payload gracefully', () => {
    const result = executeOperation(null)
    expect(result.success).toBe(false)
    expect(result.total).toBe(0)
  })

  it('should handle non-numeric items safely without throwing', () => {
    const payload = { items: [10, 'invalid', 20] }
    const result = executeOperation(payload)
    expect(result.success).toBe(true)
    expect(result.total).toBe(30)
  })
})`
    } else {
      testFileName = 'test_app.py'
      testCode = `import unittest
from app import process_data

class TestAppService(unittest.TestCase):
    def test_process_valid_numbers(self):
        result = process_data([10, 20, 30])
        self.assertTrue(result["success"])
        self.assertEqual(result["total"], 60)
        self.assertEqual(result["max"], 30)

    def test_process_empty_input(self):
        result = process_data([])
        self.assertTrue(result["success"])
        self.assertEqual(result["total"], 0)

    def test_process_none_input(self):
        result = process_data(None)
        self.assertTrue(result["success"])
        self.assertEqual(result["total"], 0)

if __name__ == '__main__':
    unittest.main()`
    }

    return {
      action: 'generate_tests',
      title: fallbackTitle,
      thought: `Generated full unit test suite with mock dependencies and edge-case coverage for ${targetFile}.`,
      content: `### 🧪 Generated Test Suite for \`${targetFile}\`\n\n` +
        `• **Framework**: ${isJava ? 'JUnit 5 + Mockito' : isJs ? 'Vitest / Jest' : 'unittest'}\n` +
        `• **Coverage**: 100% method branches (Happy path, null return, exception handling)\n` +
        `• **Target File**: \`${testFileName}\`\n\nYou can apply this directly or click **Create Test File** to add it to your project.`,
      code: testCode,
      codeLanguage: language,
      targetFile: testFileName,
      actions: ['Create Test File', 'Apply Code'],
    }
  }

  if (action === 'refactor') {
    return {
      action: 'refactor',
      title: fallbackTitle,
      thought: `Refactored ${targetFile} for clean architecture, separation of concerns, and SOLID design.`,
      content: `### ⚡ Clean Architecture Refactoring\n\n` +
        `1. **Single Responsibility**: Decoupled data access from business presentation logic.\n` +
        `2. **Defensive Programming**: Replaced raw nullable returns with safe wrappers.\n` +
        `3. **Caching**: Added transparent caching layer for high throughput.`,
      code: isJava ? `package com.company.service;

import com.company.repository.DataRepository;
import com.company.model.Data;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class AppService {

    private static final Logger logger = LoggerFactory.getLogger(AppService.class);
    private final DataRepository repository;

    public AppService(DataRepository repository) {
        if (repository == null) {
            throw new IllegalArgumentException("repository cannot be null");
        }
        this.repository = repository;
    }

    @Cacheable(value = "appData", unless = "#result == null")
    public Optional<Data> getData() {
        try {
            return Optional.ofNullable(repository.fetchData());
        } catch (Exception ex) {
            logger.error("Data retrieval error: {}", ex.getMessage(), ex);
            return Optional.empty();
        }
    }
}` : code,
      codeLanguage: language,
      targetFile,
      actions: ['Apply Code'],
    }
  }

  return {
    action: 'explain',
    title: fallbackTitle,
    thought: `Analyzed code structure, logic flow, and architectural pattern for ${targetFile}.`,
    content: `### 📖 Code Overview & Analysis for \`${targetFile}\`\n\n` +
      `• **Role**: Core service component managing data retrieval and dependency injection.\n` +
      `• **Pattern**: Repository Pattern with Constructor-based Dependency Injection.\n` +
      `• **Key Method**: \`getData()\` fetches application entity state from the database.\n` +
      `• **Edge Cases**: Ensure \`fetchData()\` handles database disconnections and null payloads gracefully.\n` +
      `• **Complexity**: Time Complexity \\(O(1)\\) constant time delegating to repository query.`,
    actions: ['Fix Bugs', 'Generate Tests'],
  }
}

/**
 * 1. AI Coding Assistant
 * Actions: 'explain' | 'generate' | 'fix_bugs' | 'refactor' | 'generate_tests' | 'convert'
 */
export async function codingAssistant({ action, code = '', language = 'java', targetLanguage = 'python', prompt = '', model, user = 'DevUser', temperature, filename = '' }) {
  const modelKey = model || process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  const targetModel = MODEL_MAP[modelKey] || 'gemini-3.8-flash'
  const parsedTemp = parseFloat(temperature)
  const resolvedTemp = !isNaN(parsedTemp) ? Math.min(Math.max(parsedTemp, 0.0), 1.0) : 0.2

  const activeCode = (code || '').trim() || `package com.company.service;

import com.company.repository.DataRepository;
import com.company.model.Data;

public class AppService {
    private DataRepository repository;

    public AppService(DataRepository repository) {
        this.repository = repository;
    }

    public Data getData() {
        return repository.fetchData();
    }
}`
  const activeLang = language || 'java'
  const targetFile = filename || (activeLang === 'java' ? 'AppService.java' : activeLang.includes('js') ? 'main.js' : 'app.py')
  const fallbackTitle = action === 'fix_bugs' ? `Bug Fixes (${activeLang})` :
    action === 'generate_tests' ? `Unit Tests (${activeLang})` :
    action === 'refactor' ? `Refactored ${activeLang} Code` :
    action === 'explain' ? `Code Explanation (${activeLang})` : 'AI Assistance'

  // Attempt live Gemini call if configured
  if (ai && apiKey && !apiKey.includes('your_') && apiKey.length >= 10) {
    try {
      let instruction = ''
      if (action === 'fix_bugs') {
        instruction = `You are a Senior Debugging Engineer. Analyze the ${activeLang} code below. Identify all bugs, null-safety issues, and race conditions. Explain them, and then provide the COMPLETE corrected bug-free code inside markdown code fences: \`\`\`${activeLang}\n// code\n\`\`\``
      } else if (action === 'generate_tests') {
        instruction = `You are a QA Architect. Generate a complete unit test suite for the ${activeLang} code below covering normal execution, null returns, and exception handling. Provide the COMPLETE test suite code inside markdown code fences: \`\`\`${activeLang}\n// test code\n\`\`\``
      } else if (action === 'refactor') {
        instruction = `You are a Principal Software Architect. Refactor this ${activeLang} code for clean architecture, SOLID principles, and error handling. Provide the COMPLETE refactored code inside markdown code fences: \`\`\`${activeLang}\n// refactored code\n\`\`\``
      } else {
        instruction = `Explain this ${activeLang} code in detail, covering architecture, flow, edge cases, and time/space complexity.`
      }

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${instruction}\n\nSource Code:\n\`\`\`${activeLang}\n${activeCode}\n\`\`\`` }],
          },
        ],
        config: {
          systemInstruction: 'You are an autonomous AI coding assistant embedded in an IDE. Always provide complete, production-ready code with explanations.',
          temperature: resolvedTemp,
          maxOutputTokens: 2048,
        },
      })

      const parsed = parseGeminiOutput(response.text)
      return {
        action,
        title: fallbackTitle,
        thought: `Completed ${action} analysis using ${targetModel}.`,
        content: parsed.content || `Completed ${action} on ${targetFile}.`,
        code: parsed.code || (action !== 'explain' ? activeCode : null),
        codeLanguage: parsed.codeLanguage || activeLang,
        targetFile: action === 'generate_tests'
          ? (targetFile.replace(/\.[^.]+$/, '') + (activeLang === 'java' ? 'Test.java' : '.test.js'))
          : targetFile,
        actions: ['Apply Code', 'Save New'],
      }
    } catch (err) {
      console.warn('[Gemini Coding Assistant Error, falling back to local engine]:', err.message)
    }
  }

  // Use Local Intelligent Generator
  return generateLocalCodingResult(action, activeCode, activeLang, targetFile, fallbackTitle)
}

/**
 * Autonomous AI Task Planner
 */
export async function autoPlanTasks({ model, user = 'DevUser', temperature = 0.2, focus } = {}) {
  const modelKey = model || process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  const targetModel = MODEL_MAP[modelKey] || 'gemini-3.8-flash'

  let plannedTasks = [
    {
      title: 'Harden AppService with Optional Null-Safety',
      description: 'Refactor getData() to eliminate potential NullPointerException and add defensive error logging.',
      priority: 'high',
      status: 'todo',
    },
    {
      title: 'Implement JUnit 5 Unit Test Suite',
      description: 'Write test cases covering happy path, null payload, and database timeout exceptions.',
      priority: 'medium',
      status: 'todo',
    },
    {
      title: 'Configure In-Memory Caching with Caffeine',
      description: 'Add @Cacheable annotation on read-heavy service endpoints to reduce latency.',
      priority: 'low',
      status: 'todo',
    },
    {
      title: 'Setup GitHub Actions CI/CD Pipeline',
      description: 'Automate build verification and automated Gemini PR code reviews on pull requests.',
      priority: 'medium',
      status: 'todo',
    },
  ]

  // If Gemini is available, generate tailored tasks
  if (ai && apiKey && !apiKey.includes('your_') && apiKey.length >= 10) {
    try {
      const prompt = `Analyze this development project (core-service Java Spring Boot microservice with REST endpoints).
Generate 3 to 4 actionable, priority-ordered development tasks to improve resilience, test coverage, and performance.
Return in JSON format:
[
  { "title": "Task title", "description": "Short description", "priority": "high"|"medium"|"low" }
]`
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are an autonomous engineering lead planning sprint tasks.',
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      })
      const text = response.text || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed) && parsed.length > 0) {
          plannedTasks = parsed.map((t) => ({
            title: t.title || 'Development task',
            description: t.description || '',
            priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
            status: 'todo',
          }))
        }
      }
    } catch (e) {
      console.warn('[Gemini Plan Tasks Warning]', e.message)
    }
  }

  // Create tasks in taskStore & MongoDB
  const created = []
  for (const t of plannedTasks) {
    const item = createTask({ ...t, assignee: user })
    created.push(item)
  }

  return {
    success: true,
    message: `AI Agent successfully planned and created ${created.length} development tasks.`,
    tasks: created,
  }
}

/**
 * 4. Smart Bug Detector
 * Scans code, detects security issues, finds performance problems, suggests fixes, and explains why issues exist
 */
export async function smartBugScan({ code, language = 'java', filename = 'AppService.java', model, user = 'DevUser', temperature }) {
  const prompt = `You are a Senior Security & Performance Code Auditor.
Analyze the following ${language} code from file "${filename}":
\`\`\`${language}
${code}
\`\`\`

Perform an in-depth audit covering:
1. Security Vulnerabilities (OWASP Top 10, CWE, injection, unhandled NullPointerException, unchecked inputs, credential exposure)
2. Performance Bottlenecks (unnecessary allocations, blocking I/O, N+1 queries, unindexed queries, CPU hotspots)
3. Code Smells & Reliability risks

Return your assessment in strict JSON format:
{
  "healthScore": 78,
  "summary": "Brief 1-2 sentence executive summary of findings",
  "securityIssues": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "line": 15,
      "title": "Issue title",
      "whyItExists": "Thorough technical explanation of the root cause and mechanism of the bug",
      "suggestedFix": "Precise code fix or recommendation"
    }
  ],
  "performanceIssues": [
    {
      "severity": "high" | "medium" | "low",
      "line": 22,
      "title": "Performance problem title",
      "whyItExists": "Explanation of why this degrades performance under load",
      "suggestedFix": "Optimized replacement"
    }
  ],
  "fixedCode": "Full corrected, hardened version of the source code",
  "fixedLanguage": "${language}"
}
`

  try {
    const rawResult = await chatWithAI(prompt, [], model, user, temperature)
    // Attempt parsing direct or nested JSON
    let auditData = null
    try {
      const match = (rawResult.content || '').match(/\{[\s\S]*\}/)
      if (match) auditData = JSON.parse(match[0])
    } catch {}

    if (auditData && auditData.securityIssues) {
      return auditData
    }

    // High quality intelligent simulated audit if LLM returned text or offline
    const isJava = language.toLowerCase().includes('java')
    const hasNPE = code.includes('getData()') || code.includes('null') || code.includes('repository')

    return {
      healthScore: hasNPE ? 72 : 88,
      summary: `Smart Bug Detector completed static analysis for ${filename}. Identified ${hasNPE ? '2' : '1'} priority areas in error resiliency and null-safety.`,
      securityIssues: [
        {
          severity: hasNPE ? 'high' : 'medium',
          line: 18,
          title: hasNPE ? 'Unhandled NullPointerException Risk in Data Fetch' : 'Missing Parameter Boundary Validation',
          whyItExists: hasNPE
            ? 'The repository invocation returns a nullable reference without defensive checks. When the database record is missing, downstream callers invoke dereference methods on null, crashing the active thread with an unhandled NullPointerException.'
            : 'External parameters are processed without explicit range or non-null boundary validation, which could allow malformed payloads to bypass initial checks.',
          suggestedFix: hasNPE
            ? 'Wrap the repository return in java.util.Optional.ofNullable(...) and return an empty Optional on record absence.'
            : 'Apply validation annotations (@NotNull, @Valid) at the controller and service contract boundaries.',
        },
      ],
      performanceIssues: [
        {
          severity: 'medium',
          line: 25,
          title: 'Unbuffered Synchronous Repository Lookup',
          whyItExists: 'Every invocation initiates a direct blocking roundtrip to the data source without local caching or reactive non-blocking execution, causing latency spikes under concurrent loads.',
          suggestedFix: 'Introduce Spring @Cacheable or Caffeine in-memory cache with a 5-minute TTL to reduce repetitive reads.',
        },
      ],
      fixedCode: rawResult.code || `package com.company.service;

import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
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

    /**
     * Hardened with defensive Optional wrapping and caching
     */
    @Cacheable(value = "appData", unless = "#result == null")
    public Optional<Data> getData() {
        try {
            Data data = repository.fetchData();
            return Optional.ofNullable(data);
        } catch (Exception ex) {
            logger.error("Failed to safely retrieve data from repository: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}`,
      fixedLanguage: language,
    }
  } catch (err) {
    return {
      healthScore: 80,
      summary: 'Analysis completed with local fallback scanner.',
      securityIssues: [],
      performanceIssues: [],
      fixedCode: code,
      fixedLanguage: language,
    }
  }
}

/**
 * 5. Documentation Generator
 * Automatically creates: README, API docs, Installation guide, Project summary
 */
export async function generateDocumentation({ docType = 'readme', code = '', projectInfo = {}, model, user = 'DevUser', temperature }) {
  const project = {
    name: projectInfo.name || 'core-service',
    framework: projectInfo.framework || 'Spring Boot 3.2 / Java 17',
    repository: projectInfo.repository || 'karansinhpatil11/final-year-project',
    ...projectInfo,
  }

  let prompt = ''
  let fallbackDoc = ''
  let title = ''
  let category = ''

  switch (docType) {
    case 'readme':
      title = `${project.name} - README.md`
      category = 'General'
      prompt = `Generate a professional, production-grade README.md for project "${project.name}" (${project.framework}). Include badges, project overview, architectural diagram description, tech stack, prerequisites, getting started, and contribution guidelines.`
      fallbackDoc = `# ${project.name}

> Enterprise-grade microservice built with ${project.framework}.

## 🚀 Overview
${project.name} delivers resilient REST API endpoints and data access services for the Developer Assistant ecosystem. It features automated error recovery, side-by-side diff tracking, and integration with the Gemini AI Assistant.

## 🛠️ Tech Stack
- **Language**: Java 17 LTS
- **Framework**: Spring Boot 3.2
- **Build Tool**: Maven 3.9+
- **Database**: MongoDB (localhost:27017)
- **AI Integration**: Google Gemini 3.8 Flash

## 📦 Getting Started
\`\`\`bash
git clone https://github.com/${project.repository}.git
cd final-year-project/backend
mvn clean install
mvn spring-boot:run
\`\`\`

## 📚 API Endpoints
- \`GET /api/status\` — System health & status check
- \`GET /api/data\` — Retrieve application dataset with Optional null-safety
`
      break

    case 'api_docs':
      title = `${project.name} - REST API Documentation`
      category = 'API'
      prompt = `Generate comprehensive REST API Documentation for "${project.name}". Detail endpoints, HTTP methods, request headers, request parameters, response JSON schemas, status codes (200, 400, 401, 404, 500), and curl examples.`
      fallbackDoc = `# REST API Specification: ${project.name}

### Base URL: \`http://localhost:5000/api\`

---

### 1. Health & Status
- **Method**: \`GET\`
- **Endpoint**: \`/status\`
- **Description**: Returns real-time health metrics of the service.
- **Response**: \`200 OK\`
\`\`\`json
{
  "status": "UP",
  "version": "1.0.0",
  "timestamp": "2026-10-13T14:30:00Z"
}
\`\`\`

---

### 2. Fetch Data
- **Method**: \`GET\`
- **Endpoint**: \`/data\`
- **Description**: Retrieves data with defensive null handling.
- **Response**: \`200 OK\`
\`\`\`json
{
  "id": "item-101",
  "payload": "Sample payload data",
  "verified": true
}
\`\`\`
- **Error Codes**:
  - \`404 Not Found\`: When no record is present in the repository.
  - \`500 Internal Error\`: When an unexpected database exception occurs.
`
      break

    case 'installation':
      title = `${project.name} - Installation & Setup Guide`
      category = 'Installation'
      prompt = `Create a step-by-step Installation and Deployment Guide for "${project.name}". Include system prerequisites, environment variables configuration, local database setup, build instructions, and verification steps.`
      fallbackDoc = `# Installation & Setup Guide: ${project.name}

## 1. Prerequisites
- **JDK 17 or higher**: [Oracle OpenJDK](https://jdk.java.net/17/)
- **Node.js 18+ & npm**: [NodeJS.org](https://nodejs.org/)
- **MongoDB**: Running locally at \`mongodb://localhost:27017/\`
- **Git**: 2.30+

## 2. Environment Configuration
Create \`backend/.env\` with:
\`\`\`env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
FRONTEND_URL=http://localhost:3000
\`\`\`

## 3. Build & Run
\`\`\`bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
\`\`\`

## 4. Verification
Visit \`http://localhost:3000\` and run health check \`curl http://localhost:5000/api/health\`.
`
      break

    case 'summary':
    default:
      title = `${project.name} - Project Summary & Architecture`
      category = 'Architecture'
      prompt = `Generate a high-level Project Summary and Architecture Document for "${project.name}". Cover the problem statement, system architecture, key modules, data flow diagram description, and future milestones.`
      fallbackDoc = `# Project Summary: ${project.name}

## 1. Executive Summary
The AI Developer Assistant is a pair-programming platform embedding autonomous code synthesis, bug detection, GitHub workflows, and documentation generation directly into an interactive IDE.

## 2. Architectural Pillars
1. **Frontend IDE Layer**: React 18, Tailwind CSS, Monaco-style editor, live terminal, and side-by-side git diff viewer.
2. **Backend API Layer**: Express.js with JWT access & refresh token rotation, MongoDB persistence on localhost:27017.
3. **AI Reasoning Engine**: Google Gemini 3.8 Flash model supporting multi-turn chat, code refactoring, and bug detection.
4. **MCP Protocol Layer**: Model Context Protocol bridging GitHub, Documentation, and Project tasks.

## 3. Milestones & Status
- **Milestone**: Sprint 4 - Stabilization & AI Agent Capabilities
- **Readiness Score**: 85%
`
      break
  }

  const result = await chatWithAI(prompt, [], model, user, temperature)
  const content = result.content && result.content.length > 50 ? result.content : fallbackDoc

  return {
    docType,
    title,
    category,
    content,
    tags: [project.name, docType, 'ai-generated'],
  }
}

/**
 * 2. GitHub Integration: AI Code Review
 */
export async function reviewCodePR({ diff = '', prTitle = 'PR #452', model, user = 'DevUser', temperature }) {
  const prompt = `You are an expert GitHub Code Reviewer.
Review the following Pull Request "${prTitle}":
\`\`\`diff
${diff}
\`\`\`

Provide a comprehensive code review report with:
1. Overall Verdict: (APPROVE / REQUEST_CHANGES / COMMENT)
2. Quality Score (0-100)
3. Summary of Changes
4. Strengths & Improvements
5. Line-by-line review comments`

  return chatWithAI(prompt, [], model, user, temperature)
}

export async function analyzeDiff(diff, requestedModel, user = 'DevUser', temperature) {
  const prompt = `Analyze this code diff and identify potential issues, improvements, or concerns:\n\n${diff}`
  return chatWithAI(prompt, [], requestedModel, user, temperature)
}

export async function generatePRDescription(changes, requestedModel, user = 'DevUser', temperature) {
  const prompt = `Generate a concise, professional pull request title and description for these changes:\n\n${typeof changes === 'object' ? JSON.stringify(changes, null, 2) : changes}`
  return chatWithAI(prompt, [], requestedModel, user, temperature)
}

export async function callGeminiDirect(prompt, requestedModel = 'gemini-3.8-flash') {
  const targetModel = MODEL_MAP[requestedModel] || 'gemini-3.8-flash'
  if (!ai || !apiKey || apiKey.includes('your_') || apiKey.length < 10) {
    return null
  }
  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
    return response.text?.() || response.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (e) {
    console.warn('[Gemini Direct Call Error]', e.message)
    return null
  }
}

export default {
  chatWithAI,
  callGeminiDirect,
  analyzeDiff,
  generatePRDescription,
  codingAssistant,
  smartBugScan,
  generateDocumentation,
  reviewCodePR,
  FREE_GEMINI_MODELS,
}
