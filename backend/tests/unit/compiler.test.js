import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SUPPORTED_LANGUAGES,
} from '../../src/controllers/compilerController.js'

describe('Unit Testing: Compiler Controller & Languages', () => {
  it('should export all required supported languages with valid metadata', () => {
    assert.ok(Array.isArray(SUPPORTED_LANGUAGES))
    assert.ok(SUPPORTED_LANGUAGES.length >= 8)

    const expectedLangs = ['javascript', 'python', 'java', 'cpp', 'c', 'typescript', 'go', 'rust']
    const languageIds = SUPPORTED_LANGUAGES.map((l) => l.id)

    for (const id of expectedLangs) {
      assert.ok(languageIds.includes(id), `Supported languages must include ${id}`)
    }

    // Verify properties
    for (const lang of SUPPORTED_LANGUAGES) {
      assert.ok(lang.id, 'Language must have an id')
      assert.ok(lang.name, 'Language must have a name')
      assert.ok(lang.extension, 'Language must have an extension')
      assert.ok(lang.version, 'Language must specify a version')
    }
  })
})

