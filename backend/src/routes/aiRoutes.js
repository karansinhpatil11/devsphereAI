import { Router } from 'express'
import {
  chat,
  analyzeCodeDiff,
  generatePR,
  handleCodingAssist,
  handleSmartBugScan,
  handleGenerateDocs,
  handleCodeReview,
} from '../controllers/aiController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Core AI endpoints
router.post('/chat', optionalAuth, chat)
router.post('/analyze-diff', optionalAuth, analyzeCodeDiff)
router.post('/generate-pr-description', optionalAuth, generatePR)

// 1. AI Coding Assistant (Explain, Generate, Fix bugs, Refactor, Generate tests, Convert)
router.post('/coding-assist', optionalAuth, handleCodingAssist)

// 4. Smart Bug Detector (Scan code, Security issues, Performance problems, Fixes, Explanations)
router.post('/smart-bug-scan', optionalAuth, handleSmartBugScan)

// 5. Documentation Generator (README, API docs, Installation guide, Project summary)
router.post('/generate-docs', optionalAuth, handleGenerateDocs)

// 2. AI Code Review
router.post('/code-review', optionalAuth, handleCodeReview)

export default router
