import { chatWithAI, analyzeDiff, generatePRDescription } from '../services/aiService.js'
import { AISession, Activity } from '../models/schemas.js'
import { isDBConnected } from '../config/db.js'

/**
 * POST /api/ai/chat
 * Body: { message, history, model }
 */
export async function chat(req, res) {
  try {
    const { message, history = [], model } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' })
    }

    const result = await chatWithAI(message, history, model)

    // Persist chat session to MongoDB
    if (isDBConnected()) {
      try {
        const userId = req.user?.id || req.user?.email || 'DevUser'
        const sessionId = `session-${userId}`
        await AISession.findOneAndUpdate(
          { sessionId },
          {
            $set: { userId, model: model || 'gemini-3.8-flash' },
            $push: {
              messages: {
                $each: [
                  { role: 'user', content: message, timestamp: new Date() },
                  {
                    role: 'assistant',
                    content: result.content || result.message || '',
                    code: result.code || '',
                    codeLanguage: result.codeLanguage || 'java',
                    actions: result.actions || [],
                    timestamp: new Date(),
                  },
                ],
              },
            },
          },
          { upsert: true, new: true }
        )

        await Activity.create({
          userId,
          action: 'ai_chat',
          details: { messageSnippet: message.slice(0, 80), model: model || 'gemini-3.8-flash' },
          timestamp: new Date(),
        })
      } catch (dbErr) {
        // Non-blocking log
      }
    }

    return res.json(result)
  } catch (err) {
    console.error('[AI Chat Error]', err.message)
    return res.status(500).json({ error: 'AI service unavailable', details: err.message })
  }
}

/**
 * POST /api/ai/analyze-diff
 * Body: { diff, model }
 */
export async function analyzeCodeDiff(req, res) {
  try {
    const { diff, model } = req.body
    if (!diff) return res.status(400).json({ error: 'diff is required' })

    const result = await analyzeDiff(diff, model)
    return res.json(result)
  } catch (err) {
    console.error('[Analyze Diff Error]', err.message)
    return res.status(500).json({ error: 'Analysis failed', details: err.message })
  }
}

/**
 * POST /api/ai/generate-pr-description
 * Body: { changes, model }
 */
export async function generatePR(req, res) {
  try {
    const { changes, model } = req.body
    if (!changes) return res.status(400).json({ error: 'changes are required' })

    const result = await generatePRDescription(changes, model)
    return res.json(result)
  } catch (err) {
    console.error('[Generate PR Error]', err.message)
    return res.status(500).json({ error: 'Generation failed', details: err.message })
  }
}

/**
 * POST /api/ai/coding-assist
 * Body: { action, code, language, targetLanguage, prompt, model }
 */
export async function handleCodingAssist(req, res) {
  try {
    const { action, code, language, targetLanguage, prompt, model } = req.body
    if (!action) return res.status(400).json({ error: 'action is required' })

    const user = req.user?.id || req.user?.email || 'DevUser'
    const { codingAssistant } = await import('../services/aiService.js')
    const result = await codingAssistant({
      action,
      code,
      language,
      targetLanguage,
      prompt,
      model,
      user,
    })

    return res.json(result)
  } catch (err) {
    console.error('[Coding Assist Error]', err.message)
    return res.status(500).json({ error: 'Coding assistance failed', details: err.message })
  }
}

/**
 * POST /api/ai/smart-bug-scan
 * Body: { code, language, filename, model }
 */
export async function handleSmartBugScan(req, res) {
  try {
    const { code, language, filename, model } = req.body
    if (!code) return res.status(400).json({ error: 'code is required for scan' })

    const user = req.user?.id || req.user?.email || 'DevUser'
    const { smartBugScan } = await import('../services/aiService.js')
    const result = await smartBugScan({
      code,
      language: language || 'java',
      filename: filename || 'AppService.java',
      model,
      user,
    })

    return res.json(result)
  } catch (err) {
    console.error('[Smart Bug Scan Error]', err.message)
    return res.status(500).json({ error: 'Smart bug scan failed', details: err.message })
  }
}

/**
 * POST /api/ai/generate-docs
 * Body: { docType, code, projectInfo, saveToDocs, model }
 */
export async function handleGenerateDocs(req, res) {
  try {
    const { docType = 'readme', code, projectInfo, saveToDocs = true, model } = req.body
    const user = req.user?.id || req.user?.email || 'DevUser'

    const { generateDocumentation } = await import('../services/aiService.js')
    const docResult = await generateDocumentation({
      docType,
      code,
      projectInfo,
      model,
      user,
    })

    // If requested, save directly to the documentation store & MongoDB
    if (saveToDocs) {
      try {
        const { createDoc } = await import('../models/docStore.js')
        const savedDoc = createDoc({
          title: docResult.title,
          category: docResult.category,
          content: docResult.content,
          tags: docResult.tags,
        })
        docResult.savedId = savedDoc.id
      } catch (saveErr) {
        console.warn('[Doc Auto-Save Warning]', saveErr.message)
      }
    }

    return res.json(docResult)
  } catch (err) {
    console.error('[Generate Docs Error]', err.message)
    return res.status(500).json({ error: 'Documentation generation failed', details: err.message })
  }
}

/**
 * POST /api/ai/code-review
 * Body: { diff, prTitle, model }
 */
export async function handleCodeReview(req, res) {
  try {
    const { diff, prTitle, model } = req.body
    if (!diff) return res.status(400).json({ error: 'diff is required for code review' })

    const user = req.user?.id || req.user?.email || 'DevUser'
    const { reviewCodePR } = await import('../services/aiService.js')
    const result = await reviewCodePR({
      diff,
      prTitle: prTitle || 'PR #452',
      model,
      user,
    })

    return res.json(result)
  } catch (err) {
    console.error('[Code Review Error]', err.message)
    return res.status(500).json({ error: 'Code review failed', details: err.message })
  }
}
