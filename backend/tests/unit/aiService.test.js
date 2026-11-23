import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  codingAssistant,
  smartBugScan,
  generateDocumentation,
  autoPlanTasks,
  reviewCodePR,
  analyzeDiff,
  generatePRDescription,
} from '../../src/services/aiService.js'

describe('Unit Testing: AI Service Engine', () => {
  it('should generate bug fixes for code vulnerabilities (fix_bugs)', async () => {
    const javaCode = `public class AppService {
    public Data getData() {
        return repository.fetchData();
    }
}`
    const result = await codingAssistant({
      action: 'fix_bugs',
      code: javaCode,
      language: 'java',
      filename: 'AppService.java',
    })

    assert.equal(result.action, 'fix_bugs')
    assert.ok(result.content.includes('Bug') || result.content.includes('NullPointer'))
    assert.ok(result.code, 'Must return corrected code')
    assert.equal(result.targetFile, 'AppService.java')
  })

  it('should generate unit tests for provided source code (generate_tests)', async () => {
    const result = await codingAssistant({
      action: 'generate_tests',
      code: 'public class Calc { public int add(int a, int b) { return a + b; } }',
      language: 'java',
      filename: 'Calc.java',
    })

    assert.equal(result.action, 'generate_tests')
    assert.ok(result.code, 'Must return test suite code')
    assert.ok(result.targetFile.includes('Test'), 'Target file should be a test file')
  })

  it('should refactor code following clean architecture (refactor)', async () => {
    const result = await codingAssistant({
      action: 'refactor',
      code: 'public class Order { public void process() { /* logic */ } }',
      language: 'java',
      filename: 'Order.java',
    })

    assert.equal(result.action, 'refactor')
    assert.ok(result.code)
  })

  it('should provide architectural explanation of code (explain)', async () => {
    const result = await codingAssistant({
      action: 'explain',
      code: 'public class Controller { public void handle() {} }',
      language: 'java',
      filename: 'Controller.java',
    })

    assert.equal(result.action, 'explain')
    assert.ok(result.content.length > 20)
  })

  it('should perform smart bug detection and return healthScore and issues', async () => {
    const result = await smartBugScan({
      code: 'public class Unsafe { public String read() { return null; } }',
      language: 'java',
      filename: 'Unsafe.java',
    })

    assert.ok(typeof result.healthScore === 'number')
    assert.ok(result.healthScore >= 0 && result.healthScore <= 100)
    assert.ok(Array.isArray(result.securityIssues))
    assert.ok(result.summary)
  })

  it('should auto-plan development tasks with priorities', async () => {
    const result = await autoPlanTasks({ user: 'UnitTestDev' })
    assert.equal(result.success, true)
    assert.ok(Array.isArray(result.tasks))
    assert.ok(result.tasks.length >= 3)

    for (const t of result.tasks) {
      assert.ok(t.title)
      assert.ok(['high', 'medium', 'low'].includes(t.priority))
      assert.equal(t.status, 'todo')
    }
  })

  it('should generate documentation for README and API docs', async () => {
    const readme = await generateDocumentation({ docType: 'readme' })
    assert.equal(readme.docType, 'readme')
    assert.ok(readme.title.includes('README'))
    assert.ok(readme.content.length > 50)

    const apiDocs = await generateDocumentation({ docType: 'api_docs' })
    assert.equal(apiDocs.docType, 'api_docs')
    assert.ok(apiDocs.title.includes('API'))
  })
})

