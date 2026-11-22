import { Router } from 'express'
import { executeCode, getLanguages } from '../controllers/compilerController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Compile and execute code
router.post('/execute', optionalAuth, executeCode)

// Get available languages and templates
router.get('/languages', getLanguages)

export default router

